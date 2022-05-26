const {isEmpty} = require('lodash');
const {
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} = require('./bot-webhook-handle');

// helpers
const setHtml = (content) => {
  let bodyStyle = 'color: white; font-family: system-ui;display: ';
  bodyStyle += 'flex; align-items: center; justify-content: center;';
  let html = '<html style="background: #1a1f36">';
  html += `<body style="${bodyStyle}">`;
  html += `<h1>${content}</h1></body></html>`;
  return html;
};
// /test
const test = async (request, response) => {
  const result = 'hello test';
  return await response.status(200).end(result);
};
// /payment_cancel
const paymentCancel = async (request, response) => {
  return await response.status(200).end(setHtml('PAYMENT CANCEL'));
};
// /payment_success
const paymentSuccess = async (request, response) => {
  return await response.status(200).end(setHtml('PAYMENT SUCCESS'));
};
// /webhook_subscription_created
const webhookStripe = async (request, response) => {
  const data = request?.body?.data?.object;
  if (isEmpty(data)) {
    return await response.status(204).end();
  }
  switch (request?.body?.type) {
    case 'customer.subscription.created':
      return handleSubscriptionCreated(response, data);
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(response, data);
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(response, data);
    default:
      return await response.status(203).end();
  }
};

module.exports = {
  test,
  paymentCancel,
  paymentSuccess,
  webhookStripe,
};
