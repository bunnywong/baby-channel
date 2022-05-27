const {SUPPORT_TEXT} = process.env;
const {Markup} = require('telegraf');
const {get, isEmpty} = require('lodash');
const {btnJoinChannel} = require('./bot-keyboards');
const {
  bot,
  stripe,
  lineNextPayment,
  contentProduct,
  getStatusInChannel,
} = require('./utils');

// helper
const whitelistUser = async (channelId, userId) => {
  const textInfo = `user ID: ${userId} of channel ID[${channelId}]`;
  if (isEmpty(channelId) || isEmpty(userId)) {
    console.error(`...Not able to unban user with (either)empty ${textInfo}`);
    return;
  }
  // fetch and unban
  try {
    const userInChannelStatus = await getStatusInChannel(channelId, userId);
    if (userInChannelStatus === 'kicked') {
      const unbanMember = await bot.telegram.unbanChatMember(channelId, userId);
      if (unbanMember) {
        console.info(`...Unbaned ${textInfo}`);
        return;
      }
      console.error(`...Not able to unban ${textInfo}`);
    }
  } catch (err) {
    console.error(err);
  }
};
const banUser = async (channelId, userId) => {
  const textInfo = `user ID: ${userId} of channel ID[${channelId}]`;
  if (isEmpty(channelId) || isEmpty(userId)) {
    console.error(`...Not able to ban user with (either)empty ${textInfo}`);
    return;
  }
  // fetch and ban
  try {
    const userInChannelStatus = await getStatusInChannel(channelId, userId);
    if (userInChannelStatus) {
      const banMember = await bot.telegram.banChatMember(channelId, userId);
      if (banMember !== 'owner') {
        console.info(`...banned ${textInfo}`);
        return;
      }
      console.error(`...Not able to ban ${textInfo}`);
    }
  } catch (err) {
    console.error(err);
  }
};

// 1. handler deleted
const handleSubscriptionDeleted = async (response, data) => {
  if (data?.status !== 'canceled') {
    return await response.status(203).end();
  }
  const productId = get(data, 'plan.product', false);
  const channelId = get(data, 'metadata.channelId', false);
  const userId = data?.metadata?.userId;
  // 1.1 kick user from channel
  banUser(channelId, userId);
  // 1.2 reply message for warm remind: unsubscribed
  if (productId) {
    const product = await stripe.products.retrieve(productId);
    const price = await stripe.prices.retrieve(product?.default_price);
    let text = '🔔 Your subscription was canceled successfully.\n';
    text += 'You will not be charged again for below subscription:\n\n';
    text += await contentProduct(price?.recurring);
    bot.telegram.sendMessage(userId, text);
  }
  return await response.status(200).end();
};
const handleSubscriptionCreated = async (response, data) => {
  const userId = data.metadata?.userId;
  const channelId = data.metadata?.channelId;
  const inviteLinkData = await bot.telegram.createChatInviteLink(channelId, {
    // 2. handler created
    member_limit: 1,
    name: `user ID: ${userId}`,
    expire_date: data.current_period_end,
  });
  const inviteLink = inviteLinkData?.invite_link;
  const invoice = await stripe.invoices.retrieve(data?.latest_invoice);
  if (inviteLink && invoice.hosted_invoice_url) {
    whitelistUser(channelId, userId);
    let text = '🎉 Your subscription is ACTIVE\n';
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
// 2. handler updated
const handleSubscriptionUpdated = async (response, data) => {};

module.exports = {
  handleSubscriptionDeleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
};
