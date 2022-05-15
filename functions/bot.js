const functions = require('firebase-functions');
const {session} = require('telegraf');
// custom
const {bot} = require('./utils');
require('./bot-command');
require('./bot-hear');
require('./bot-action');

bot.use(session());
// error handling
bot.catch((err, ctx) => {
  functions.logger.error('[Bot] Error', err);
  return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
