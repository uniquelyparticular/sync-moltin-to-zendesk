const { json, send } = require('micro')
const fetch = require('node-fetch')
const { createClient } = require('@moltin/request')
const moltin = new createClient({
  client_id: process.env.MOLTIN_CLIENT_ID,
  client_secret: process.env.MOLTIN_CLIENT_SECRET,
  application: 'demo-sync-stripe-to-moltin'
})
const cors = require('micro-cors')({
  allowMethods: ['POST'],
  exposeHeaders: ['x-moltin-secret-key'],
  allowHeaders: [
    'x-moltin-secret-key',
    'x-forwarded-proto',
    'X-Requested-With',
    'Access-Control-Allow-Origin',
    'X-HTTP-Method-Override',
    'Content-Type',
    'Authorization',
    'Accept'
  ]
})

const _toJSON = error => {
  return !error
    ? ''
    : Object.getOwnPropertyNames(error).reduce(
        (jsonError, key) => {
          return { ...jsonError, [key]: error[key] }
        },
        { type: 'error' }
      )
}

const _toCamelcase = string => {
  return !string
    ? ''
    : string.replace(
        /\w\S*/g,
        word => `${word.charAt(0).toUpperCase()}${word.substr(1).toLowerCase()}`
      )
}

process.on('unhandledRejection', (reason, p) => {
  console.error(
    'Promise unhandledRejection: ',
    p,
    ', reason:',
    JSON.stringify(reason)
  )
})

module.exports = cors(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, 200, 'ok!')
  }
  if (
    (await req.headers['x-moltin-secret-key']) !=
    process.env.MOLTIN_WEBHOOK_SECRET
  )
    return send(res, 401)

  try {
    const { triggered_by, resources: body } = await json(req)

    const {
      data: { type: observable, id: observable_id }
    } = JSON.parse(body)

    const event = triggered_by.split('.')[1] //event is 'order', trigger is `created`,`updated`,`fulfilled` or `paid`

    if (observable === 'order' && observable_id) {
      // just locking down to orders to protect code below
      const {
        data: {
          status: order_status,
          payment: payment_status,
          shipping: shipping_status,
          customer: { name: customer_name, email },
          meta: {
            display_price: {
              with_tax: { formatted: total_paid }
            }
          },
          relationships: {
            items: { data: items },
            customer: {
              data: { id: customer_id }
            }
          }
        }
      } = await moltin.get(`${observable}s/${observable_id}`)

      const payload = {
        profile: {
          source: 'support',
          identifiers: {
            moltin_id: customer_id,
            email: email
          }
        },
        event: {
          source: 'moltin',
          type: `moltin-${observable}-${event}`,
          description: _toCamelcase(`${observable} ${event}`),
          properties: {
            'Customer Name': customer_name,
            'Order ID': observable_id,
            'Order Status': order_status,
            'Order Total': total_paid,
            'Payment Status': payment_status,
            'Shipping Status': shipping_status
          }
        }
      }
      console.log('payload', payload)

      fetch(
        `https://${
          process.env.ZENDESK_SUBDOMAIN
        }.zendesk.com/api/sunshine/track`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.ZENDESK_INTEGRATION_EMAIL}/token:${
                process.env.ZENDESK_INTEGRATION_SECRET
              }`
            ).toString('base64')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )
        .then(response => {
          if (response.ok && response.status < 299) {
            return send(
              res,
              200,
              JSON.stringify({ received: true, order_id: observable_id })
            )
          } else {
            return send(res, 500, 'Error')
          }
        })
        .catch(error => {
          console.log('error', error)
          const jsonError = _toJSON(error)
          return send(
            res,
            jsonError.type === 'StripeSignatureVerificationError' ? 401 : 500,
            jsonError
          )
        })
    } else {
      console.error('missing order_id')
      return send(
        res,
        200,
        JSON.stringify({ received: true, order_id: 'null' })
      )
    }
  } catch (error) {
    const jsonError = _toJSON(error)
    return send(res, 500, jsonError)
  }
})
