const {Telegraf} = require('telegraf');
const {toString} = require('lodash');
const {BOT_TOKEN, STRIPE_TOKEN} = process.env;

const bot = new Telegraf(BOT_TOKEN, {
  telegram: {webhookReply: true},
});
const Stripe = require('stripe');
const stripe = new Stripe(STRIPE_TOKEN);

const isTyping = (ctx) => ctx.telegram.sendChatAction(ctx?.chat?.id, 'typing');
const getUsername = (ctx) => ctx?.update?.message?.chat?.username;
const getUserId = (ctx) => toString(ctx?.update?.message?.from?.id);
const getStatusInChannel = async (channelId, userId) => {
  try {
    const userInChannel = await bot.telegram.getChatMember(channelId, userId);
    return userInChannel?.status;
  } catch (err) {
    console.error(err);
  }
  return 'haha';
};
const lineProduct = (product) => {
  let text = `💎 **${product?.name}**\n`;
  text += `${product?.description}\n`;
  text += '\n';
  return text;
};

module.exports = {
  bot,
  stripe,
  isTyping,
  getUsername,
  getUserId,
  getStatusInChannel,
  lineProduct,
};
