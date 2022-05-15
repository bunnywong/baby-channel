const {bot} = require('./utils');
const {CHANNEL_ID} = process.env;
const {get, isEmpty} = require('lodash');

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
  // const inviteLinkData = await bot.telegram.banChatMember(CHANNEL_ID)
  return await response.status(200).end('test');
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
const webhookSubscriptionCreated = async (request, response) => {
  const data = get(request, 'body.data', false);
  if (isEmpty(data)) {
    return await response.status(204).end();
  }
  const metadata = request?.body?.data?.object.metadata;
  const userId = metadata?.userId;
  const channelId = metadata?.channelId;
  const inviteLinkData = await bot.telegram.createChatInviteLink(channelId, {
    member_limit: 1,
    name: `user ID: ${userId}`,
    expire_date: data?.canceled_at, // @TODO: check
  });
  let html = 'SUBSCRIPTION SUCCESS\n\n'; // @TODO: show invoice
  html += `🔗 channel link: \n${inviteLinkData.invite_link}`;
  bot.telegram.sendMessage(userId, html);
  return await response.status(200).end();
};

module.exports = {
  test,
  paymentCancel,
  paymentSuccess,
  webhookSubscriptionCreated,
};
