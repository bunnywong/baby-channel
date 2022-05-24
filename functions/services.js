const {DATABASE} = process.env;
const fs = require('firebase-admin');
const {map} = require('lodash');
const serviceAccount = require('./service-account.json');

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount),
});
const db = fs.firestore();

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
  let result = [];
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
