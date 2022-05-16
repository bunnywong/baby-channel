const {SUPPORT_EMAIL} = process.env;
const {get, isEmpty} = require('lodash');
const {Markup} = require('telegraf');
const {
  bot,
  stripe,
  getStatusInChannel,
  lineProduct,
  lineNextPayment,
} = require('./utils');

// utils
const setHtml = (content) => {
  let bodyStyle = 'color: white; font-family: system-ui;display: ';
  bodyStyle += 'flex; align-items: center; justify-content: center;';
  let html = '<html style="background: #1a1f36">';
  html += `<body style="${bodyStyle}">`;
  html += `<h1>${content}</h1></body></html>`;
  return html;
};
const whitelistUser = async (channelId, userId) => {
  try {
    const userInChannelStatus = await getStatusInChannel(channelId, userId);
    if (userInChannelStatus === 'kicked') {
      const unbanMember = await bot.telegram.unbanChatMember(channelId, userId);
      if (unbanMember) {
        console.info(`...Unbaned user ID: ${userId}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
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
const webhookSubscriptionCreated = async (request, response) => {
  const data = get(request, 'body.data.object', false);
  if (isEmpty(data)) {
    return await response.status(204).end();
  }
  const userId = data.metadata?.userId;
  const channelId = data.metadata?.channelId;
  const inviteLinkData = await bot.telegram.createChatInviteLink(channelId, {
    member_limit: 1,
    name: `user ID: ${userId}`,
    expire_date: data?.canceled_at, // @TODO: check
  });
  const invoice = await stripe.invoices.retrieve(data?.latest_invoice);
  if (inviteLinkData?.invite_link && invoice.hosted_invoice_url) {
    whitelistUser(channelId, userId);
    let text = 'Your subscription is ACTIVE\n';
    text += lineNextPayment(data);
    bot.telegram.sendMessage(
      userId,
      text,
      Markup.inlineKeyboard([
        Markup.button.url('📁 Invoice and Receipt', invoice.hosted_invoice_url),
        Markup.button.url('🌟 Join Channel', inviteLinkData.invite_link),
      ]),
    );
  } else {
    let text = '⚠️ Not able to create channel invite link\n';
    text += `please contact ${SUPPORT_EMAIL}`;
    bot.telegram.sendMessage(userId, text);
  }
  return await response.status(200).end();
};

module.exports = {
  test,
  paymentCancel,
  paymentSuccess,
  webhookSubscriptionDeleted,
  webhookSubscriptionCreated,
};
