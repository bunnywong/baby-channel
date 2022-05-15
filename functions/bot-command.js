const {STRIPE_TOKEN, CHANNEL_ID} = process.env;
const {size} = require('lodash');
const {Markup} = require('telegraf');
const Stripe = require('stripe');
const stripe = new Stripe(STRIPE_TOKEN);
// custom
const {
  bot,
  isTyping,
  getUsername,
  getUserId,
  whitelistUser,
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
    if (getUsername(ctx) === ADMIN_USER) {
      await ctx.reply(`Stripe webhooks: ${size(data)}pcs`, commonKeyboard);
      for (let i = 0; i < data.length; i++) {
        let text = `ID: ${data[i].id}\n`;
        text += `livemode: ${data[i].livemode}\n`;
        text += `enabled_events: ${data[i].enabled_events}`;
        text += `status: ${data[i].status}`;
        text += `url: ${data[i].url}`;
        await ctx.reply(
          text,
          Markup.inlineKeyboard([
            Markup.button.callback(
              '⚠️ DELETE',
              `del_stripeWebhook_${data[i].id}`,
            ),
          ]),
        );
      }
      await ctx.reply('Set Firebase:', commonKeyboard);
    }
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
