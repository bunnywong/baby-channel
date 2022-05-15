const {bot, stripe} = require('./utils');

require('./bot-action');
bot.action(/unsubscribe_+/, async (ctx) => {
  const subscribeId = ctx.match.input.substr('unsubscribe_'.length);
  const unsubscribe = await stripe.subscriptions.del(subscribeId);
  if (unsubscribe.status === 'canceled') {
    return await ctx.editMessageText('✅ UNSUBSCRIBED');
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
