# @particular./sync-moltin-to-zendesk

[![npm version](https://badge.fury.io/js/%40particular.%2Fsync-moltin-to-zendesk.svg)](https://badge.fury.io/js/%40particular.%2Fsync-moltin-to-zendesk)

> Add a Zendesk Sunshine Event when an order is created or modified in Moltin

Asynchronous microservice that is triggered by [moltin](https://moltin.com) webhooks to create a Sunshine Event inside of [Zendesk](https://zendesk.com).

⚠️ Zendesk [Sunshine Event API](https://develop.zendesk.com/hc/en-us/community/posts/360004233828-About-the-Events-API) is only available via Early Access BETA registration.

Built with [Micro](https://github.com/zeit/micro)! 🤩

## 🛠 Setup

Both a [Zendesk](https://zendesk.com) _and_ [moltin](https://moltin.com) account are needed for this to function.

Create a `.env` at the project root with the following credentials:

```dosini
MOLTIN_CLIENT_ID=
MOLTIN_CLIENT_SECRET=
MOLTIN_WEBHOOK_SECRET=
ZENDESK_INTEGRATION_EMAIL=
ZENDESK_INTEGRATION_SECRET=

```

Find your `MOLTIN_CLIENT_ID` and `MOLTIN_CLIENT_SECRET` inside of your [moltin Dashboard](https://dashboard.moltin.com)'s API keys.

`MOLTIN_WEBHOOK_SECRET` can be anything you want.

While logged in to your Zendesk instance create a new User to run the Webhooks under by going to `Settings` > `People` > `Add User` > `Role: Staff`; this email address will be used as your `ZENDESK_INTEGRATION_EMAIL` above.

Find your `ZENDESK_INTEGRATION_SECRET` within your Zendesk instance by going to `Settings` > `API` > enable `Token Access` > add `Active API Tokens [+]` > `API Token`.

## 📦 Package

Run the following command to build the app

```bash
yarn install
```

Start the development server

```bash
yarn dev
```

The server will typically start on PORT `3000`, if not, make a note for the next step.

Start ngrok (change ngrok port below from 3000 if yarn dev deployed locally on different port above)

```bash
ngrok http 3000
```

Make a note of the https `ngrok URL` provided.

## ⛽️ Usage

Next head over to the [moltin Webhook Settings](https://dashboard.moltin.com/app/settings/integrations) area, add a new integration (`Settings > Integrations` and click `Create`).

Enter any name and description for your Integration. Moltin recommends you prefix the name with `DEVELOPMENT:` for any testing.

Next, enter the `ngrok URL` from above and `MOLTIN_WEBHOOK_SECRET` that you saved inside `.env`.

![URL and Secret Key](https://user-images.githubusercontent.com/950181/52846929-ca957980-3102-11e9-9a20-23b8139767ee.png)

Now finally you'll want to configure what Moltin Observables will cause this webhook to be invoked. In this example we want to monitor the `Order` observable and select the `Created`,`Fulfilled` and `Paid/Captured` box.

![Observes selection](https://user-images.githubusercontent.com/950181/52851227-76dc5d80-310d-11e9-9dff-70b7daaf21e8.png)

Click Save to register your new Webhook with Moltin.

## 🚀 Deploy

You can easily deploy this function to [now](https://now.sh).

_Contact [Adam Grohs](https://www.linkedin.com/in/adamgrohs/) @ [Particular.](https://uniquelyparticular.com) for any questions._
