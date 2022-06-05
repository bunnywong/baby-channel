const {Markup} = require('telegraf');
const {bot, stripe, randomArray} = require('./utils');

require('./bot-action');
// 0. subscribe
bot.action(/subscribe_+/, async (ctx) => {});

// 1. unsubscribe
bot.action(/ask_unsub_+/, async (ctx) => {
  console.info('...action/ask_unsub_');
  const subscribeId = ctx.match.input.substr('ask_unsub_'.length);
  const escUnsubscribe = (text) =>
    Markup.button.callback(text, 'cancel_unsubscribe');
  const buttons = [
    [escUnsubscribe('Nope, nevermind')],
    [escUnsubscribe('No No No!')],
    [escUnsubscribe('No')],
    [
      Markup.button.callback(
        "Yes I'm 100% sure", // eslint-disable-line
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
  const text = '🔄 Your subscription was not cancelled, it still alive\n';
  return await ctx.editMessageText(text);
});
// 2.2 unsubscribe: process
bot.action(/do_unsub_+/, async (ctx) => {
  console.info('...action/do_unsub_');
  const subscribeId = ctx.match.input.substr('do_unsub_'.length);
  const unsubscribe = await stripe.subscriptions.del(subscribeId);
  if (unsubscribe.status === 'canceled') {
    return await ctx.editMessageText('✅ Canceled subscription');
  }
  await ctx.reply('⚠️ Not able to unsubscribe');
});
// 3. del Stripe webhook
bot.action(/del_stripeWebhook_+/, async (ctx) => {
  console.info('...action: del_stripeWebhook_');
  const removeId = ctx.match.input.substr('del_stripeWebhook_'.length);
  const removement = await stripe.webhookEndpoints.del(removeId);
  if (removement?.deleted) {
    await ctx.editMessageText('✅ WEBHOOK DELETED');
    return;
  }
  await ctx.reply('⚠️ Not able to delete webhook');
});
bot.action('english', async (ctx) => {
  return ctx.reply('No problem');
});
bot.action('chinese', async (ctx) => {
  return ctx.reply('沒問題');
});
