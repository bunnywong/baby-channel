const {BASE_URL, PRODUCT_ID} = process.env;
const {size, get, filter, forEach, head} = require('lodash');
const {Markup} = require('telegraf');
// custom
const {
  bot,
  stripe,
  getUsername,
  getUserId,
  isTyping,
  contentProduct,
  lineNextPayment,
} = require('./utils');
const {getChannelIds} = require('./services');
const {commonKeyboard, btnJoinChannel} = require('./bot-keyboards');
const sessionEndpoints = {
  success_url: `${BASE_URL}/payment_success`,
  cancel_url: `${BASE_URL}/payment_cancel`,
};

// 1. plans
bot.hears('PLANS', async (ctx) => {
  isTyping(ctx);
  const product = await stripe.products.retrieve(PRODUCT_ID);
  const text = await contentProduct(PRODUCT_ID);
  const channelIds = await getChannelIds(ctx.update?.bot_id);
  const channelId = head(channelIds); // @TODO: set multi
  const session = await stripe.checkout.sessions.create({
    ...sessionEndpoints,
    line_items: [{price: product?.default_price, quantity: 1}],
    mode: 'subscription',
    subscription_data: {
      metadata: {
        channelId,
        userId: getUserId(ctx),
        username: getUsername(ctx),
      },
    },
  });
  return await ctx.reply(
    text,
    Markup.inlineKeyboard([Markup.button.url('💳 SUBSCRIBE', session?.url)]),
  );
});
// 2.: status
bot.hears('STATUS', async (ctx) => {
  isTyping(ctx);
  const subscriptions = await stripe.subscriptions.list();
  // filter out active subscribe for current user(as I/O result)
  const userInSubscription = filter(subscriptions?.data, (sub) => {
    const isCurrentUser = sub?.metadata?.userId === getUserId(ctx);
    const isActive = sub?.status === 'active';
    return isCurrentUser && isActive;
  });
  const textItem = size(userInSubscription) > 1 ? 'items' : 'item';
  const textSubscribed = `📮 You have subscribed ${size(
    userInSubscription,
  )} ${textItem} as below:`;
  const textNewCustom = "You don't have any subscription"; // eslint-disable-line
  const textStatus = userInSubscription.length ? textSubscribed : textNewCustom;
  ctx.reply(textStatus, commonKeyboard);
  // plans combo message
  isTyping(ctx);
  // create link: edit billing info
  const customerId = get(userInSubscription, '[0].customer');
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'setup',
    customer: customerId,
    ...sessionEndpoints,
  });
  isTyping(ctx);
  forEach(userInSubscription, async (sub) => {
    const invoice = await stripe.invoices.retrieve(sub?.latest_invoice);
    // text content
    let statusText = await contentProduct(sub?.plan?.product);
    statusText += await lineNextPayment(sub);
    return await ctx.reply(
      statusText,
      Markup.inlineKeyboard([
        [
          Markup.button.url('📁 Receipt', invoice?.hosted_invoice_url),
          Markup.button.url('📝 Update Billing', session?.url),
        ],
        [
          Markup.button.callback(
            '⏹️ Cancel Subscription',
            `confirm_unsubscribe_${sub?.id}`,
          ),
          btnJoinChannel(sub?.metadata?.inviteLink),
        ],
      ]),
    );
  });
});
