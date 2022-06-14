const {Markup} = require('telegraf');

const commonKeyboard = (lang) => {
  const buttons = lang === 'zh' ? ['計劃', '狀態'] : ['PLANS', 'STATUS'];
  return Markup.keyboard([buttons]).resize();
};

const langKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('English', 'english'),
  Markup.button.callback('中文', 'chinese'),
]);

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

const btnJoinChannel = (link) => {
  if (link) {
    return Markup.button.url('🌟 Join Channel', link);
  }
  return [];
};
module.exports = {
  commonKeyboard,
  langKeyboard,
  firebaseStripeKeyboard,
  btnJoinChannel,
};
