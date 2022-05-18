const {get, isEmpty} = require('lodash');
const {bot, stripe, lineProduct} = require('./utils');
const {handleSubscriptionCreated} = require('./bot-webhook');

// utils
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
const webhookSubscriptionDeleted = async (request, response) => {
  const data = get(request, 'body.data.object', false);
  const productId = get(data, 'plan.product', false);
  const userId = data?.metadata?.userId;

  if (data?.status === 'canceled' && productId) {
    const product = await stripe.products.retrieve(productId);
    let text = 'You have unsubscribed for below:\n\n';
    text += lineProduct(product);
    bot.telegram.sendMessage(userId, text);
  }
  return await response.status(200).end();
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
    default:
      return await response.status(203).end();
  }
};

module.exports = {
  test,
  paymentCancel,
  paymentSuccess,
  webhookStripe,
  webhookSubscriptionDeleted,
};
