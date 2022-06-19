const {Markup} = require('telegraf');
const {set} = require('lodash');
// custom
const {bot, t, stripe, isMasterAdmin, randomArray} = require('./utils');
const {commonKeyboard} = require('./bot-keyboards');
require('./bot-action');

// 1. unsubscribe
bot.action(/ask_unsub_+/, async (ctx) => {
  console.info('...action/ask_unsub_');
  const subscribeId = ctx.match.input.substr('ask_unsub_'.length);
  const escUnsubscribe = (text) =>
    Markup.button.callback(text, 'cancel_unsubscribe');
  const buttons = [
    [escUnsubscribe(t(ctx, 'nope_nevermind'))],
    [escUnsubscribe(t(ctx, 'no_no_no'))],
    [escUnsubscribe(t(ctx, 'no'))],
    [
      Markup.button.callback(
        t(ctx, 'yes_i_am_100_percent_sure'),
        `do_unsub_${subscribeId}`,
      ),
    ],
  ];
  await ctx.editMessageText(
    '⚠️ Are you sure to cancel your subscription?',
    Markup.inlineKeyboard(randomArray(buttons)),
  );
});
// 2.1 unsubscribe: esc
bot.action('cancel_unsubscribe', async (ctx) => {
  console.info('...action/cancel_unsubscribe');
  const text = `🔄 ${t(
    ctx,
    'your_subscription_was_not_cancelled_it_still_alive',
  )}\n`;
  return await ctx.editMessageText(text);
});
// 2.2 unsubscribe: process
bot.action(/do_unsub_+/, async (ctx) => {
  console.info('...action/do_unsub_');
  const subscribeId = ctx.match.input.substr('do_unsub_'.length);
  const unsubscribe = await stripe.subscriptions.del(subscribeId);
  if (unsubscribe.status === 'canceled') {
    return await ctx.editMessageText(`✅ ${t(ctx, 'canceled_subscription')}`);
  }
  await ctx.reply('⚠️ Not able to unsubscribe');
});
// 3. del Stripe webhook
bot.action(/del_stripeWebhook_+/, async (ctx) => {
  console.info('...action: del_stripeWebhook_');
  if (!isMasterAdmin(ctx)) {
    return;
  }
  const removeId = ctx.match.input.substr('del_stripeWebhook_'.length);
  const removement = await stripe.webhookEndpoints.del(removeId);
  if (removement?.deleted) {
    await ctx.editMessageText('✅ WEBHOOK DELETED');
    return;
  }
  await ctx.reply('⚠️ Not able to delete webhook');
});
bot.action('english', async (ctx) => {
  setLanguage(ctx, 'en');
});
bot.action('chinese', async (ctx) => {
  setLanguage(ctx, 'zh');
});

const setLanguage = async (ctx, lang) => {
  await ctx.editMessageText(t(ctx, 'choose_language'));
  await set(ctx, 'session.lang', lang);
  await ctx.reply(t(ctx, 'current_language'), commonKeyboard(lang));
};
