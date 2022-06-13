const {get, set, forEach, size, head} = require('lodash');
const {Markup} = require('telegraf');
// custom
const {
  t,
  bot,
  stripe,
  isTyping,
  getUsername,
  getUserId,
  getStatusInChannel,
} = require('./utils');
const {getBotdata, getChannelIds} = require('./services');
const {commonKeyboard} = require('./bot-keyboards');

// helpers
const getWebhookTelegram = async (ctx) => {
  const botData = await getBotdata(ctx.update?.bot_id);
  if (getUserId(ctx) === botData?.admin_uid) {
    isTyping(ctx);
    const telegramWebhook = await ctx.telegram.getWebhookInfo();
    await ctx.reply(`Telegram webhook:\n${telegramWebhook?.url}`);
  }
};
const getWebhookStripe = async (ctx) => {
  const botData = await getBotdata(ctx.update?.bot_id);
  if (getUserId(ctx) === botData?.admin_uid) {
    isTyping(ctx);
    const webhookEndpoints = await stripe.webhookEndpoints.list();
    const data = webhookEndpoints.data;
    await ctx.reply(`Stripe webhooks: ${size(data)}pcs`, commonKeyboard);
    isTyping(ctx);
    forEach(data, async (d, key) => {
      let text = `${key + 1} of ${size(data)}\n`;
      text += `1️⃣ ID: ${d.id}\n`;
      text += `2️⃣ livemode: ${d.livemode}\n`;
      text += `3️⃣ enabled_events: ${d.enabled_events}\n`;
      text += `4️⃣ status: ${d.status}\n`;
      text += `5️⃣ url: ${d.url}`;
      await ctx.reply(
        text,
        Markup.inlineKeyboard([
          Markup.button.callback('⚠️ DELETE', `del_stripeWebhook_${d.id}`),
        ]),
      );
    });
  }
};

// commands:
bot.command('/start', (ctx) => {
  if (!get(ctx, 'session.lang')) {
    set(ctx, 'session.lang', 'zh');
  }
  ctx.session ??= {lang: 'en'};
  ctx.reply(t(ctx, 'welcome'));
});
bot.command('/en', (ctx) => {
  ctx.session.lang = 'en';
  ctx.reply(t(ctx, 'currewnt_language'));
});
bot.command('/zh', (ctx) => {
  ctx.session.lang = 'zh';
  ctx.reply(t(ctx, 'currewnt_language'));
});
bot.command('webhooks', async (ctx) => {
  await getWebhookTelegram(ctx);
  getWebhookStripe(ctx);
});
bot.command('status', async (ctx) => {
  isTyping(ctx);
  const channelIds = await getChannelIds(ctx.update?.bot_id);
  const channelId = head(channelIds); // set multi
  const statusInChannel = await getStatusInChannel(channelId, getUserId(ctx));
  ctx.reply(statusInChannel, commonKeyboard);
});
bot.command('who', async (ctx) => {
  isTyping(ctx);
  const usernamneText = getUsername(ctx) ? `@${getUsername(ctx)}` : '⚠️ NULL';
  let message = `User ID: ${getUserId(ctx)}\n`;
  message += `Username: ${usernamneText}`;
  ctx.reply(message, commonKeyboard);
});
