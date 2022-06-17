const {Markup} = require('telegraf');
// custom
const {t} = require('./utils');

const commonKeyboard = (lang) => {
  const buttons = lang === 'zh' ? ['計劃', '狀態'] : ['PLANS', 'STATUS'];
  return Markup.keyboard([buttons]).resize();
};

const langKeyboard = (currentLang) => {
  const showChecked = (lang) => (currentLang === lang ? ' ✓' : '');
  return Markup.inlineKeyboard([
    Markup.button.callback(`English ${showChecked('en')}`, 'english'),
    Markup.button.callback(`中文 ${showChecked('zh')}`, 'chinese'),
  ]);
};

const firebaseStripeKeyboard = Markup.inlineKeyboard([
  Markup.button.callback(
    'customer.subscription.created',
    'set_stripe_webhook_to_firebase_subscription_created',
  ),
  Markup.button.callback(
    'customer.subscription.deleted',
    'set_stripe_webhook_to_firebase_subscription_deleted',
  ),
]);

const btnJoinChannel = (ctx, link) => {
  if (link) {
    return Markup.button.url(`🌟 ${t(ctx, 'join_channel')}`, link);
  }
  return [];
};
module.exports = {
  commonKeyboard,
  langKeyboard,
  firebaseStripeKeyboard,
  btnJoinChannel,
};
