const {SUPPORT_TEXT} = process.env;
const {Markup} = require('telegraf');
const {set, size, get, isEmpty} = require('lodash');
const dayjs = require('dayjs');
const {btnJoinChannel} = require('./bot-keyboards');
const {
  bot,
  t,
  stripe,
  isBotAdmin,
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
const banUser = async (channelId, userId, botId) => {
  let ctx = {};
  ctx = set(ctx, 'update.message.from.id', userId);
  ctx = set(ctx, 'update.bot_id', botId);
  const _isBotAdmin = await isBotAdmin(ctx);
  if (_isBotAdmin) {
    return;
  }
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

// 1. handler created
const handleSubscriptionCreated = async (response, data) => {
  console.info('...webhook: customer.subscription.created');
  const {lang, user_id: userId, channel_id: channelId} = data.metadata;
  const langObj = {lang};

  const inviteLinkData = await bot.telegram.createChatInviteLink(channelId, {
    member_limit: 1,
    name: `user ID: ${userId}`,
    expire_date: data.current_period_end,
  });
  const inviteLink = inviteLinkData?.invite_link;
  const invoice = await stripe.invoices.retrieve(data?.latest_invoice);
  if (inviteLink && invoice.hosted_invoice_url) {
    whitelistUser(channelId, userId);
    let text = `🎉 ${t(langObj, 'your_subscription_is_active')}\n`;
    text += lineNextPayment(data, langObj);
    bot.telegram.sendMessage(
      userId,
      text,
      Markup.inlineKeyboard([
        Markup.button.url(
          `📁 ${t(langObj, 'invoice_and_receipt')}`,
          invoice.hosted_invoice_url,
        ),
        btnJoinChannel(langObj, inviteLink),
      ]),
    );
    // update metadata with invite link
    const subscriptionUpdate = await stripe.subscriptions.update(data?.id, {
      metadata: {...data.metadata, invite_link: inviteLink},
    });
    console.info(
      '...update stripe.subscriptions(metadata.invite_link) result:',
      subscriptionUpdate?.status,
    );
  } else {
    const text = `⚠️ ${t(
      langObj,
      'not_able_to_create_a_channel_invite_link',
    )}\n`;
    bot.telegram.sendMessage(userId, text + SUPPORT_TEXT);
  }
  return await response.status(200).end();
};
// 3. handler updated (not trigger by #2.deleted subscription)
const handleSubscriptionUpdated = async (response, data) => {
  console.info('...webhook: customer.subscription.updated');
  if (data?.status !== 'active') {
    return;
  }
  // update metadata channel invite link
  const {
    user_id: userId,
    channel_id: channelId,
    last_update: lastUpdate,
  } = data.metadata;

  const today = dayjs().format('YYYY.MM.DD');
  const inviteLinkData = await bot.telegram.createChatInviteLink(channelId, {
    // 2. handler created
    member_limit: 1,
    name: `user ID: ${userId}`,
    expire_date: data.current_period_end,
  });
  const inviteLink = inviteLinkData?.invite_link;
  // the middle empty check for webhook fire order: `updated` > `created`
  if (inviteLink && size(lastUpdate) && lastUpdate != today) {
    const subscriptionUpdate = await stripe.subscriptions.update(data?.id, {
      metadata: {...data.metadata, invite_link: inviteLink, last_update: today},
    });
    console.info(
      '...Updated invite link to subscription metadata:',
      subscriptionUpdate?.status,
    );
    return;
  }
  console.log('...skipped invite link update');
};

// 4. handler deleted
const handleSubscriptionDeleted = async (response, data) => {
  console.info('...webhook: customer.subscription.deleted');
  if (data?.status !== 'canceled') {
    return await response.status(203).end();
  }
  const productId = get(data, 'plan.product', false);
  const {
    lang,
    channel_id: channelId,
    bot_id: botId,
    user_id: userId,
  } = data.metadata;
  const langObj = {lang};

  // 1.1 kick user from channel
  banUser(channelId, userId, botId);
  // 1.2 reply message for warm remind: unsubscribed
  if (productId) {
    let text = `🔔 ${t(
      langObj,
      'your_subscription_was_canceled_successfully',
    )}\n`;
    text += `${t(
      langObj,
      'you_will_not_be_charged_again_for_the_below_subscription',
    )}:\n\n`;
    text += await contentProduct(langObj, productId, botId);
    bot.telegram.sendMessage(userId, text);
  }
  return await response.status(200).end();
};

module.exports = {
  handleSubscriptionDeleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
};
