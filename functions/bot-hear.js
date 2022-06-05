const {BASE_URL} = process.env;
const {size, get, filter, forEach} = require('lodash');
const {Markup} = require('telegraf');
const dayjs = require('dayjs');
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
const {getChannels} = require('./services');
const {commonKeyboard, btnJoinChannel} = require('./bot-keyboards');
const sessionEndpoints = {
  success_url: `${BASE_URL}/payment_success`,
  cancel_url: `${BASE_URL}/payment_cancel`,
};

// 1. plans
bot.hears('PLANS', async (ctx) => {
  isTyping(ctx);
  const botId = ctx.update?.bot_id;
  const channelData = await getChannels(botId);
  channelData.forEach(async (channel) => {
    isTyping(ctx);
    const product = await stripe.products.retrieve(channel?.stripe_product_id);
    const text = await contentProduct(channel?.stripe_product_id);
    const channelId = channel?.channel_id;
    const session = await stripe.checkout.sessions.create({
      ...sessionEndpoints,
      line_items: [{price: product?.default_price, quantity: 1}],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          channelId,
          userId: getUserId(ctx),
          username: getUsername(ctx),
          last_update: dayjs().format('YYYY.MM.DD'),
        },
      },
    });
    await ctx.reply(
      text,
      Markup.inlineKeyboard([Markup.button.url('💳 SUBSCRIBE', session?.url)]),
    );
  });
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
    const dateCreated = dayjs(sub.created * 1000).format('YYYY.MM.DD');
    let statusText = await contentProduct(sub?.plan?.product);
    statusText += await lineNextPayment(sub);
    statusText += `@DEBUG: created: ${dateCreated}\n`;
    statusText += `@DEBUG: Invoice status: ${invoice.status.toUpperCase()}`;

    const inlineRowOne = [];
    // 2.11 line one:
    if (invoice?.hosted_invoice_url) {
      // button: Invoice
      inlineRowOne.push(
        Markup.button.url('📁 Receipt', invoice?.hosted_invoice_url),
      );
    }
    // 2.12 button: Billing
    if (session?.url) {
      inlineRowOne.push(Markup.button.url('📝 Update Billing', session?.url));
    }
    // 2.21 line two:
    const inlineRowTwo = [];
    // button: Cancel Subscription
    if (sub?.id) {
      inlineRowTwo.push(
        Markup.button.callback(
          '⏹️ Cancel Subscription',
          `confirm_unsubscribe_${sub.id}`,
        ),
      );
    }
    // 2.22 button: invoite link
    if (sub?.metadata?.inviteLink) {
      inlineRowTwo.push(btnJoinChannel(sub.metadata.inviteLink));
    }

    return await ctx.reply(
      statusText,
      Markup.inlineKeyboard([inlineRowOne, inlineRowTwo]),
    );
  });
});
