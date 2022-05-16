const {Markup} = require('telegraf');

const commonKeyboard = Markup.keyboard([['PLANS', 'STATUS']]).resize();

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

module.exports = {commonKeyboard, langKeyboard, firebaseStripeKeyboard};
