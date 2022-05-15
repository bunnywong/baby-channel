const {Telegraf} = require('telegraf');
const {toString} = require('lodash');
const {BOT_TOKEN} = process.env;

const bot = new Telegraf(BOT_TOKEN, {
  telegram: {webhookReply: true},
});
const getUsername = (ctx) => ctx?.update?.message?.chat?.username;
const getUserId = (ctx) => toString(ctx?.update?.message?.from?.id);
const isTyping = (ctx) => ctx.telegram.sendChatAction(ctx?.chat?.id, 'typing');

module.exports = {bot, getUsername, getUserId, isTyping};
