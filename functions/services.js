const {FIRESTORE_DB} = process.env;
const firebase = require('firebase-admin');
const {map} = require('lodash');
const serviceAccount = require('./service-account.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});
const db = firebase.firestore();

const getBotdata = async (botId) => {
  // fetch items: admin_uid, bot_token, stripe_token
  const snapshot = await db.collection(FIRESTORE_DB).doc(botId).get();
  return snapshot.exists ? snapshot.data() : null;
};
const getChannelIds = async (botId) => {
  const channelData = await getChannels(botId);
  const ids = [];
  map(channelData, (val) => {
    ids.push(val?.channel_id);
  });
  return ids;
};
const getChannels = async (botId) => {
  // fetch items: stripe_product_id, support_text, product_info
  const snapshot = await db
    .collection(FIRESTORE_DB)
    .doc(botId)
    .collection('channels')
    .get();
  if (snapshot.empty) {
    return null;
  }
  const result = [];
  snapshot.forEach((doc) => {
    const data = {channel_id: doc.id, ...doc.data()};
    result.push(data);
  });
  return result;
};

module.exports = {
  getBotdata,
  getChannels,
  getChannelIds,
};
