const functions = require('firebase-functions');
const {bot} = require('./utils');
require('./bot');
const endpoints = require('./endpoints');
// const _priceCode = 'price_1KwVE0GVMqzrNuvfiIhntx8J';
// # ref URL:
// https://akhromieiev.com/building-telegram-bot-with-firebase-cloud-functions-and-telegrafjs/
// https://www.jscamp.app/docs/telegraf/telegraf00/
// # Telegraf
// example - https://github.com/telegraf/telegraf/tree/bafef538c228db581352746539c7ccfacb099b64/docs/examples
// # membership 101
// https://medium.com/invitemember/membership-business-in-telegram-the-definitive-guide-68a1afcd456b
// https://godleon.github.io/blog/ChatOps/howto-develop-telegram-chatbot/

module.exports = {
  bot: functions.https.onRequest(async (request, response) => {
    try {
      bot.handleUpdate(request.body, response);
    } finally {
      await response.status(200).end('hello bot');
    }
  }),
  payment_success: functions.https.onRequest(endpoints.paymentSuccess),
  payment_cancel: functions.https.onRequest(endpoints.paymentCancel),
  webhook_subscription_created: functions.https.onRequest(
    endpoints.webhookSubscriptionCreated,
  ),
  webhook_subscription_: functions.https.onRequest(
    endpoints.webhookSubscriptionCreated,
  ),
  test: functions.https.onRequest(endpoints.test),
};
