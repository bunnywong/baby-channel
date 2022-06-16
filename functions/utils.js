const {Telegraf} = require('telegraf');
const {get, toString, upperCase} = require('lodash');
const dayjs = require('dayjs');
// custom
const {BOT_TOKEN, STRIPE_TOKEN} = process.env;
const {getBotdata} = require('./services');

const bot = new Telegraf(BOT_TOKEN, {
  telegram: {webhookReply: true},
});
const Stripe = require('stripe');
const stripe = new Stripe(STRIPE_TOKEN);

const isTyping = (ctx) => ctx.telegram.sendChatAction(ctx?.chat?.id, 'typing');
const isBotAdmin = async (ctx) => {
  const formUserId = get(ctx, 'update.message.from.id', false);
  const adminUserId = await getBotdata(ctx?.update?.bot_id);
  return Boolean(formUserId === adminUserId);
};

// translate: by session support
const t = (ctx, message) => {
  const lang = get(ctx, 'session.lang', 'en');
  ctx.i18n.locale(lang);
  return ctx.i18n.t(message);
};
const getLang = (ctx) => {
  if (get(ctx, 'session.lang')) {
    return ctx.session.lang;
  }
  const tgLang = get(ctx, 'update.message.from.language_code');
  return tgLang === 'zh' ? 'zh' : 'en';
};
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
};
const lineNextPayment = (data) => {
  const periodEndDate = dayjs
    .unix(data?.current_period_end)
    .format('YYYY.MM.DD');
  return `📆 Next payment on: ${periodEndDate}\n`;
};
const randomArray = (arr) =>
  arr
    .map((value) => ({value, sort: Math.random()}))
    .sort((a, b) => a.sort - b.sort)
    .map(({value}) => value);

module.exports = {
  bot,
  stripe,
  t,
  getLang,
  isTyping,
  isBotAdmin,
  getUsername,
  getUserId,
  getStatusInChannel,
  contentProduct,
  lineNextPayment,
  randomArray,
};
