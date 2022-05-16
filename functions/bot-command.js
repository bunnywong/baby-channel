const {CHANNEL_ID} = process.env;
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
const ADMIN_USER = 'brothercar';

// cmd: /start
bot.command('/start', (ctx) => {
  isTyping(ctx);
  // ctx.sesstion ??= {language: 'en'};
  ctx.reply('🎉 Welcome onboard 歡迎');
  ctx.reply('Please select language 請選擇語言', langKeyboard);
});
// cmd: /webhook_telegram
bot.command('webhook_telegram', async (ctx) => {
  if (getUsername(ctx) === ADMIN_USER) {
    isTyping(ctx);
    const telegramWebhook = await ctx.telegram.getWebhookInfo();
    await ctx.reply(`Telegram webhook:\n${telegramWebhook?.url}`);
  }
});
// cmd: /webhook_stripe
bot.command('webhook_stripe', async (ctx) => {
  if (getUsername(ctx) === ADMIN_USER) {
    isTyping(ctx);
    const webhookEndpoints = await stripe.webhookEndpoints.list();
    const data = webhookEndpoints.data;
    await ctx.reply(`Stripe webhooks: ${size(data)}pcs`, commonKeyboard);
    forEach(data, async (d) => {
      let text = `1️⃣ ID: ${d.id}\n`;
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
bot.command('who', async (ctx) => {
  isTyping(ctx);
  const status = await getStatusInChannel(CHANNEL_ID, getUserId(ctx));
  if (status === 'kicked') {
    ctx.reply('Removed from channel');
  }
  const usernamneText = getUsername(ctx) ? `@${getUsername(ctx)}` : '⚠️ NULL';
  let message = `User ID: ${getUserId(ctx)}\n`;
  message += `Username: ${usernamneText}`;
  ctx.reply(message, commonKeyboard);
});
