const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = function (done) {
  const url = process.env.mongoUrl
  
  mongoClient.connect(url, (err, data) => {
    if (err) {
      return done(err);
    }

    state.db = data.db("demoStore");

    done();
  });
};
module.exports.get = function () {
  return state.db;
};
