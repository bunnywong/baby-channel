const {DATABASE} = process.env;
const fs = require('firebase-admin');
const serviceAccount = require('./service-account.json');

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount),
});
const db = fs.firestore();

const getData = async (ref) => {
  const doc = await ref.get();
  return doc.exists ? doc.data() : null;
};
const getBotInfo = async (botId) => {
  const botRef = db.collection(DATABASE).doc(botId);
  return await getData(botRef);
};
const getChannelInfo = async (botId, channelId) => {
  const botRef = db
    .collection(DATABASE)
    .doc(botId)
    .collection('channels')
    .doc(channelId);
  return await getData(botRef);
};

module.exports = {
  getBotInfo,
  getChannelInfo,
};
