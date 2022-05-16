const {BASE_URL, CHANNEL_ID, PRODUCT_ID} = process.env;
const {filter, forEach, upperCase} = require('lodash');
const dayjs = require('dayjs');
const {Markup} = require('telegraf');
// custom
const {
  bot,
  stripe,
  getUsername,
  getUserId,
  isTyping,
  lineProduct,
} = require('./utils');
const {commonKeyboard} = require('./bot-keyboards');

const linePrice = (price) => {
  const currency = upperCase(price?.currency);
  const amount = price.unit_amount / price.unit_amount_decimal;
  return `Price: ${upperCase(currency)}${amount.toFixed(2)}\n`;
};
const lineChargeFrequency = (recurring) => {
  const intervalCount = recurring?.interval_count;
  const interval = recurring?.interval;
  return `Charge frequency: ${intervalCount} ${interval}\n`;
};
// LHS: plans
bot.hears('plans', async (ctx) => {
  isTyping(ctx);
  // fetch Stripe
  const product = await stripe.products.retrieve(PRODUCT_ID);
  const price = await stripe.prices.retrieve(product?.default_price);
  // plan content
  let planText = lineProduct(product);
  planText += linePrice(price);
  planText += lineChargeFrequency(price?.recurring);

  const session = await stripe.checkout.sessions.create({
    success_url: `${BASE_URL}/payment_success`,
    cancel_url: `${BASE_URL}/payment_cancel`,
    line_items: [{price: product?.default_price, quantity: 1}],
    mode: 'subscription',
    subscription_data: {
      metadata: {
        channelId: CHANNEL_ID,
        userId: getUserId(ctx),
        username: getUsername(ctx),
      },
    },
  });
  return await ctx.replyWithMarkdown(
    planText,
    Markup.inlineKeyboard([Markup.button.url('💳 SUBSCRIBE', session?.url)]),
  );
});
// RHS: status
bot.hears('status', async (ctx) => {
  isTyping(ctx);
  const subscriptions = await stripe.subscriptions.list();
  // filter out active subscribe for current user(as I/O result)
  const userInSubscription = filter(subscriptions?.data, (sub) => {
    const isCurrentUser = sub?.metadata?.userId === getUserId(ctx);
    const isActive = sub?.status === 'active';
    return isCurrentUser && isActive;
  });
  const textSubscribed = 'Purchased item as below:';
  const textNewCustom = "You don't have any subscription"; // eslint-disable-line
  const textStatus = userInSubscription.length ? textSubscribed : textNewCustom;
  ctx.replyWithMarkdown(textStatus, commonKeyboard);
  // plans combo message
  forEach(userInSubscription, async (sub) => {
    const product = await stripe.products.retrieve(sub?.plan?.product);
    const price = await stripe.prices.retrieve(product?.default_price);
    const invoice = await stripe.invoices.retrieve(sub?.latest_invoice);
    const periodEnd = dayjs.unix(sub?.current_period_end).format('YYYY.MM.DD');
    // text content
    let statusText = lineProduct(product);
    statusText += linePrice(price);
    statusText += lineChargeFrequency(price?.recurring);
    statusText += `Next bill: ${periodEnd}`;
    return await ctx.replyWithMarkdown(
      statusText,
      Markup.inlineKeyboard([
        Markup.button.url(
          '📁 Invoice and Receipt',
          invoice?.hosted_invoice_url,
        ),
        Markup.button.callback('Unsubscribe', `unsubscribe_${sub?.id}`),
      ]),
    );
  });
});
