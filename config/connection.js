const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = function (done) {
  const url = "mongodb://localhost:27017";
  const dbname = "shopping"; //database name
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
