const functions = require('firebase-functions');
const {bot} = require('./utils');
require('./bot');
const endpoints = require('./endpoints');

module.exports = {
  bot: functions.https.onRequest(async (request, response) => {
    const bodyData = {...request?.body, ...request?.query};
    try {
      bot.handleUpdate(bodyData, response);
    } finally {
      await response.status(200).end('hello bot');
    }
  }),
  payment_success: functions.https.onRequest(endpoints.paymentSuccess),
  payment_cancel: functions.https.onRequest(endpoints.paymentCancel),
  webhook_stripe: functions.https.onRequest(endpoints.webhookStripe),
  test: functions.https.onRequest(endpoints.test),
};
