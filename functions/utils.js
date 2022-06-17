const {Telegraf} = require('telegraf');
const {find, get, toString, upperCase} = require('lodash');
const dayjs = require('dayjs');
// custom
const {BOT_TOKEN, STRIPE_TOKEN} = process.env;
const {getBotdata, getChannels} = require('./services');

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
  const customLang = get(ctx, 'lang');
  if (customLang) {
    const fs = require('fs');
    const data = JSON.parse(
      fs.readFileSync(`./locales/${customLang}.json`, 'utf8'),
    );
    return data?.[message];
  }
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
// internal: source form Firestore
const lineProductLang = async (ctx) => {
  const products = await getChannels(ctx.update?.bot_id);
  const productInfo = get(products, '[0].product_info');
  const data = find(productInfo, {lang: getLang(ctx)});
  let text = `${data?.name}\n`;
  text += `${data?.description}\n`;
  text += '\n';
  return text;
};
// internal: source form Stripe
const lineProductStripe = (product) => {
  let text = `💎 ${product?.name}\n`;
  text += `${product?.description}\n`;
  text += '\n';
  return text;
};
// internal
const linePrice = (ctx, price) => {
  const currency = upperCase(price?.currency);
  const amount = price.unit_amount / price.unit_amount_decimal;
  return `${t(ctx, 'price')}: ${upperCase(currency)}${amount.toFixed(2)}\n`;
};
// internal
const lineChargeFrequency = (ctx, recurring) => {
  const intervalCount = recurring?.interval_count;
  const interval = recurring?.interval;
  return `${t(ctx, 'charge_frequency')}: ${intervalCount} ${t(
    ctx,
    interval,
  )}\n`;
};
const contentProduct = async (productId, ctx) => {
  const product = await stripe.products.retrieve(productId);
  const price = await stripe.prices.retrieve(product?.default_price);
  let text = ctx ? await lineProductLang(ctx) : lineProductStripe(product);
  text += linePrice(ctx, price);
  text += lineChargeFrequency(ctx, price?.recurring);
  return price ? text : null;
};
const lineNextPayment = (data, ctx) => {
  const periodEndDate = dayjs
    .unix(data?.current_period_end)
    .format('YYYY.MM.DD');
  const nextPaymentOn = ctx ? t(ctx, 'next_payment_on') : 'Next payment on';

  return `📆 ${nextPaymentOn}: ${periodEndDate}\n`;
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
