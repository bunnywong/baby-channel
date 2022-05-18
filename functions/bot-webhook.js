const {SUPPORT_TEXT} = process.env;
const {Markup} = require('telegraf');
const {bot, stripe, lineNextPayment, whitelistUser} = require('./utils');

const handleSubscriptionCreated = async (response, data) => {
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
    text += `please contact ${SUPPORT_TEXT}`;
    bot.telegram.sendMessage(userId, text);
  }
  return await response.status(200).end();
};

module.exports = {
  handleSubscriptionCreated,
};
