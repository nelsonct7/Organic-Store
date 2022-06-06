const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = function (done) {
  const url = 'mongodb+srv://nelsonct7:Nelson123456789@cluster0.20wkv.mongodb.net/?retryWrites=true&w=majority';
  const dbname = "shopping"; //database name
  mongoClient.connect(url, (err, data) => {
    if (err) {
      return done(err);
    }

    state.db = data.db("organicStore");

    done();
  });
};
module.exports.get = function () {
  return state.db;
};
