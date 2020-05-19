const config = require('../config');
const Promise = require("bluebird");
const redis = require('redis');
const mongoose = require('mongoose');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);


let mongoConn;
if(config.mongodb && config.mongodb.connStr && config.mongodb.options) {
  
  mongoose.set('useCreateIndex', true)
  mongoConn = mongoose.createConnection(config.mongodb.connStr, config.mongodb.options);
  
}

let redisConn;
if(config.redis) {
  redisConn = redis.createClient(config.redis);
}
module.exports = {mongoConn, redisConn};

