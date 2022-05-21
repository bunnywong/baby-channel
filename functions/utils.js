const {Telegraf} = require('telegraf');
const {toString, upperCase} = require('lodash');
const dayjs = require('dayjs');
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
};
// internal
const lineProduct = (product) => {
  let text = `💎 ${product?.name}\n`;
  text += `${product?.description}\n`;
  text += '\n';
  return text;
};
// internal
const linePrice = (price) => {
  const currency = upperCase(price?.currency);
  const amount = price.unit_amount / price.unit_amount_decimal;
  return `Price: ${upperCase(currency)}${amount.toFixed(2)}\n`;
};
// internal
const lineChargeFrequency = (recurring) => {
  const intervalCount = recurring?.interval_count;
  const interval = recurring?.interval;
  return `Charge frequency: ${intervalCount} ${interval}\n`;
};
const contentProduct = async (productId) => {
  const product = await stripe.products.retrieve(productId);
  const price = await stripe.prices.retrieve(product?.default_price);

  let text = lineProduct(product);
  text += linePrice(price);
  text += lineChargeFrequency(price?.recurring);
  return price ? text : null;
  return text;
};
const lineNextPayment = (data) => {
  const periodEndDate = dayjs
    .unix(data?.current_period_end)
    .format('YYYY.MM.DD');
  return `📆 Next payment on: ${periodEndDate}`;
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
const randomArray = (arr) =>
  arr
    .map((value) => ({value, sort: Math.random()}))
    .sort((a, b) => a.sort - b.sort)
    .map(({value}) => value);

module.exports = {
  bot,
  stripe,
  isTyping,
  getUsername,
  getUserId,
  getStatusInChannel,
  contentProduct,
  lineNextPayment,
  whitelistUser,
  randomArray,
};
