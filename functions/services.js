const {DATABASE} = process.env;
const firebase = require('firebase-admin');
const {map} = require('lodash');
const serviceAccount = require('./service-account.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});
const db = firebase.firestore();

const getBotdata = async (botId) => {
  const snapshot = await db.collection(DATABASE).doc(botId).get();
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
  const snapshot = await db
    .collection(DATABASE)
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
