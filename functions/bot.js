const functions = require('firebase-functions');
const {session} = require('telegraf');
// custom
const {bot} = require('./utils');
require('./bot-hear');
require('./bot-command');
require('./bot-action');
// require('./bot-playground');

bot.use(session());
// error handling
bot.catch((err, ctx) => {
  functions.logger.error('[Bot] Error', err);
  return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
