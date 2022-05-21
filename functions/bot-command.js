const {ADMIN_UID, CHANNEL_ID} = process.env;
const {forEach, size} = require('lodash');
const {Markup} = require('telegraf');
// custom
const {
  bot,
  stripe,
  isTyping,
  getUsername,
  getUserId,
  getStatusInChannel,
} = require('./utils');
const {commonKeyboard, langKeyboard} = require('./bot-keyboards');

// cmd: /start
bot.command('/start', (ctx) => {
  isTyping(ctx);
  // ctx.sesstion ??= {language: 'en'};
  ctx.reply('🎉 Welcome onboard 歡迎');
  ctx.reply('Please select language 請選擇語言', langKeyboard);
});
// cmd: /webhook_telegram
bot.command('webhook_telegram', async (ctx) => {
  if (getUserId(ctx) === ADMIN_UID) {
    isTyping(ctx);
    const telegramWebhook = await ctx.telegram.getWebhookInfo();
    await ctx.reply(`Telegram webhook:\n${telegramWebhook?.url}`);
  }
});
// cmd: /webhook_stripe
bot.command('webhook_stripe', async (ctx) => {
  if (getUserId(ctx) === ADMIN_UID) {
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
});
// cmd: /who
bot.command('status', async (ctx) => {
  isTyping(ctx);
  const statusInChannel = await getStatusInChannel(CHANNEL_ID, getUserId(ctx));
  ctx.reply(statusInChannel, commonKeyboard);
});
bot.command('who', async (ctx) => {
  isTyping(ctx);
  const usernamneText = getUsername(ctx) ? `@${getUsername(ctx)}` : '⚠️ NULL';
  let message = `User ID: ${getUserId(ctx)}\n`;
  message += `Username: ${usernamneText}`;
  ctx.reply(message, commonKeyboard);
});
