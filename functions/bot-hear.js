const {BASE_URL} = process.env;
const {mapValues, size, get, set, filter, forEach} = require('lodash');
const {Markup} = require('telegraf');
const dayjs = require('dayjs');
// custom
const {
  bot,
  t,
  stripe,
  getLang,
  getUsername,
  getUserId,
  isTyping,
  isMasterAdmin,
  contentProduct,
  lineNextPayment,
} = require('./utils');
const {getChannels} = require('./services');
const {btnJoinChannel} = require('./bot-keyboards');
const sessionEndpoints = {
  success_url: `${BASE_URL}/payment_success`,
  cancel_url: `${BASE_URL}/payment_cancel`,
};
const getSessionEndpoints = (ctx) =>
  mapValues(sessionEndpoints, (o) => `${o}?lang=${getLang(ctx)}`);

// 0. hear
bot.hears('PLANS', async (ctx) => {
  await set(ctx, 'session.lang', 'en');
  handlePlans(ctx);
});
bot.hears('計劃', async (ctx) => {
  await set(ctx, 'session.lang', 'zh');
  handlePlans(ctx);
});
bot.hears('STATUS', async (ctx) => {
  await set(ctx, 'session.lang', 'en');
  await handleStatus(ctx);
});
bot.hears('狀態', async (ctx) => {
  await set(ctx, 'session.lang', 'zh');
  await handleStatus(ctx);
});
// 1. plans
const handlePlans = async (ctx) => {
  await ctx.reply(`${t(ctx, 'plans_as_below')}:`);
  isTyping(ctx);

  const botId = ctx.update?.bot_id;
  const channelData = await getChannels(botId);
  channelData.forEach(async (channel) => {
    isTyping(ctx);
    const product = await stripe.products.retrieve(channel?.stripe_product_id);
    const text = await contentProduct(
      ctx,
      channel?.stripe_product_id,
      ctx.update?.bot_id,
    );
    const channelId = channel?.channel_id;
    const session = await stripe.checkout.sessions.create({
      ...getSessionEndpoints(ctx),
      line_items: [{price: product?.default_price, quantity: 1}],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          lang: getLang(ctx),
          bot_id: botId,
          channel_id: channelId,
          user_id: getUserId(ctx),
          username: getUsername(ctx),
          last_update: dayjs().format('YYYY.MM.DD'),
        },
      },
    });
    await ctx.reply(
      text,
      Markup.inlineKeyboard([
        Markup.button.url(`💳 ${t(ctx, 'subscribe')}`, session?.url),
      ]),
    );
  });
};
// 2. status
const handleStatus = async (ctx) => {
  isTyping(ctx);
  const subscriptions = await stripe.subscriptions.list();
  // filter out active subscribe for current user(as I/O result)
  const userInSubscription = filter(subscriptions?.data, (sub) => {
    const isCurrentUser = sub?.metadata?.user_id === getUserId(ctx);
    const isActive = sub?.status === 'active';
    return isCurrentUser && isActive;
  });
  const textItem =
    size(userInSubscription) > 1 ? t(ctx, 'items') : t(ctx, 'item');
  const textSubscribed = `📮 ${t(ctx, 'you_have_subscribed')} (${size(
    userInSubscription,
  )} ${textItem}):`;
  const textNewCustom = t(ctx, 'you_dont_have_any_subscription');
  const textStatus = userInSubscription.length ? textSubscribed : textNewCustom;
  ctx.reply(textStatus);
  // plans combo message
  isTyping(ctx);
  // create link: edit billing info
  const customerId = get(userInSubscription, '[0].customer');
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'setup',
    customer: customerId,
    ...getSessionEndpoints(ctx),
  });
  isTyping(ctx);
  forEach(userInSubscription, async (sub) => {
    const invoice = await stripe.invoices.retrieve(sub?.latest_invoice);
    const productId = sub?.plan?.product;
    const dateCreated = dayjs(sub.created * 1000).format('YYYY.MM.DD');
    let statusText = await contentProduct(ctx, productId, ctx.update?.bot_id);
    statusText += await lineNextPayment(sub, ctx);

    if (isMasterAdmin(ctx)) {
      statusText += `[admin] created: ${dateCreated}\n`;
      statusText += `[admin] Invoice status: ${invoice.status.toUpperCase()}`;
    }
    // lines array
    const inlineRowOne = [];
    const inlineRowTwo = [];
    // 2.10 line #1:
    if (invoice?.hosted_invoice_url) {
      // 2.11 [Receipt]
      inlineRowOne.push(
        Markup.button.url(
          `📁 ${t(ctx, 'receipt')}`,
          invoice?.hosted_invoice_url,
        ),
      );
    }
    // 2.12 [Update Billing]
    if (session?.url) {
      inlineRowOne.push(
        Markup.button.url(`📝 ${t(ctx, 'update_billing')}`, session?.url),
      );
    }
    // 2.20 line #2:
    // 2.21 [Cancel Subscription]
    if (sub?.id) {
      inlineRowTwo.push(
        Markup.button.callback(
          `⏹️ ${t(ctx, 'cancel_subscription')}`,
          `ask_unsub_${sub.id}`,
        ),
      );
    }
    // 2.22 [Join Channel]
    if (sub?.metadata?.invite_link) {
      inlineRowTwo.push(btnJoinChannel(ctx, sub.metadata.invite_link));
    }

    return await ctx.reply(
      statusText,
      Markup.inlineKeyboard([inlineRowOne, inlineRowTwo]),
    );
  });
};
