const {get, set, forEach, size, head} = require('lodash');
const {Markup} = require('telegraf');
// custom
const {
  bot,
  t,
  getLang,
  stripe,
  isTyping,
  isMasterAdmin,
  getUsername,
  getUserId,
  getStatusInChannel,
} = require('./utils');
const {getBotdata, getChannelIds} = require('./services');
const {commonKeyboard, langKeyboard} = require('./bot-keyboards');

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
    await ctx.reply(`Stripe webhooks: ${size(data)}pcs`);
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

// public command:
bot.command('/start', async (ctx) => {
  const lang = getLang(ctx);
  if (!get(ctx, 'session.lang')) {
    set(ctx, 'session.lang', lang);
  }
  await ctx.reply(t(ctx, 'welcome'), commonKeyboard(lang));
  await ctx.reply(t(ctx, 'choose_language'), langKeyboard(lang));
});
// private commands for dev only:
bot.command('/zh', async (ctx) => {
  await set(ctx, 'session.lang', 'zh');
  await ctx.reply(t(ctx, 'current_language'), commonKeyboard('zh'));
});
bot.command('/en', async (ctx) => {
  await set(ctx, 'session.lang', 'en');
  await ctx.reply(t(ctx, 'current_language'), commonKeyboard('en'));
});
bot.command('/lang', async (ctx) => {
  // not able to confirm current language base on no keyboard ref
  await ctx.reply(t(ctx, 'current_language'));
  await ctx.reply(t(ctx, 'choose_language'), langKeyboard());
});
bot.command('/status', async (ctx) => {
  isTyping(ctx);
  const channelIds = await getChannelIds(ctx.update?.bot_id);
  const channelId = head(channelIds); // set multi
  const statusInChannel = await getStatusInChannel(channelId, getUserId(ctx));
  ctx.reply(statusInChannel);
});
bot.command('who', async (ctx) => {
  isTyping(ctx);
  const usernamneText = getUsername(ctx) ? `@${getUsername(ctx)}` : '⚠️ NULL';
  let message = `User ID: ${getUserId(ctx)}\n`;
  message += `Username: ${usernamneText}`;
  ctx.reply(message);
});
// admin command:
bot.command('/webhooks', async (ctx) => {
  if (!isMasterAdmin(ctx)) {
    return;
  }
  await getWebhookTelegram(ctx);
  getWebhookStripe(ctx);
});
bot.command('/t', async (ctx) => {
  if (!isBotAdmin(ctx)) {
    return;
  }
});
