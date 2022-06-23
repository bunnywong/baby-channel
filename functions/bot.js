const functions = require('firebase-functions');
const {session} = require('telegraf');
// custom
const {bot} = require('./utils');

// i18n:
const TelegrafI18n = require('telegraf-i18n');
const path = require('path');
const i18n = new TelegrafI18n({
  defaultLanguage: 'zh',
  sessionName: 'session',
  useSession: true,
  defaultLanguageOnMissing: true,
  directory: path.resolve(__dirname, 'locales'),
});
bot.use(session());
bot.use(i18n.middleware());

// requires
require('./bot-command');
require('./bot-hear');
require('./bot-action');

// error handling
bot.catch((err, ctx) => {
  functions.logger.error('[Bot] Error', err);
  return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
