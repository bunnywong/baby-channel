const {SUPPORT_TEXT} = process.env;
const {Markup} = require('telegraf');
const {get} = require('lodash');
const {btnJoinChannel} = require('./bot-keyboards');
const {
  bot,
  stripe,
  lineNextPayment,
  whitelistUser,
  contentProduct,
} = require('./utils');

const handleSubscriptionDeleted = async (response, data) => {
  const productId = get(data, 'plan.product', false);
  const userId = data?.metadata?.userId;

  if (data?.status === 'canceled' && productId) {
    const product = await stripe.products.retrieve(productId);
    const price = await stripe.prices.retrieve(product?.default_price);
    let text = '🔔 Your subscription was canceled successfully.\n';
    text += 'You will not be charged again for below subscription:\n\n';
    text += contentProduct(price?.recurring);
    bot.telegram.sendMessage(userId, text);
  }
  return await response.status(200).end();
};
const handleSubscriptionCreated = async (response, data) => {
  const userId = data.metadata?.userId;
  const channelId = data.metadata?.channelId;
  const inviteLinkData = await bot.telegram.createChatInviteLink(channelId, {
    member_limit: 1,
    name: `user ID: ${userId}`,
    expire_date: data.current_period_end,
  });
  const inviteLink = inviteLinkData?.invite_link;
  const invoice = await stripe.invoices.retrieve(data?.latest_invoice);
  if (inviteLink && invoice.hosted_invoice_url) {
    whitelistUser(channelId, userId);
    let text = 'Your subscription is ACTIVE\n';
    text += lineNextPayment(data);
    bot.telegram.sendMessage(
      userId,
      text,
      Markup.inlineKeyboard([
        Markup.button.url('📁 Invoice and Receipt', invoice.hosted_invoice_url),
        btnJoinChannel(inviteLink),
      ]),
    );
    // update metadata with invite link
    const subscriptionUpdate = await stripe.subscriptions.update(data?.id, {
      metadata: {...data.metadata, inviteLink},
    });
    console.info(
      '...Saved invite link to subscription metadata:',
      subscriptionUpdate?.status,
    );
  } else {
    const text = '⚠️ Not able to create channel invite link\n';
    bot.telegram.sendMessage(userId, text + SUPPORT_TEXT);
  }
  return await response.status(200).end();
};

module.exports = {
  handleSubscriptionDeleted,
  handleSubscriptionCreated,
};
