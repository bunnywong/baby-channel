const {Markup} = require('telegraf');
const {bot, stripe, randomArray} = require('./utils');

require('./bot-action');
// 1. unsubscribe
bot.action(/confirm_unsubscribe_+/, async (ctx) => {
  const subscribeId = ctx.match.input.substr('confirm_unsubscribe_'.length);
  const escUnsubscribe = (text) =>
    Markup.button.callback(text, 'unsubscribe_esc');
  const buttons = [
    [escUnsubscribe('Nope, nevermind')],
    [escUnsubscribe('No No No!')],
    [escUnsubscribe('No')],
    [
      Markup.button.callback(
        "Yes I'm 100% sure",
        `unsubscribe_process_${subscribeId}`,
      ),
    ],
  ];
  await ctx.editMessageText(
    '⚠️ Are you sure to cancel your subscription?',
    Markup.inlineKeyboard(randomArray(buttons)),
  );
});
// 2.1 unsubscribe: esc
bot.action('unsubscribe_esc', async (ctx) => {
  const text = '🔄 Your subscription was not cancelled, it still alive\n';
  return await ctx.editMessageText(text);
});
// 2.2 unsubscribe: process
bot.action(/unsubscribe_process_+/, async (ctx) => {
  const subscribeId = ctx.match.input.substr('process_unsubscribe_'.length);
  const unsubscribe = await stripe.subscriptions.del(subscribeId);
  if (unsubscribe.status === 'canceled') {
    return await ctx.editMessageText('✅ Canceled subscription');
  }
  await ctx.reply('⚠️ Not able to unsubscribe');
});
bot.action(/del_stripeWebhook_+/, async (ctx) => {
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
