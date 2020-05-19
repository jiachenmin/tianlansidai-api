'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class Collect extends CommonDao {
    constructor(model) {
        super(model);
    }

    getSchema() {
        return Schema;
    }

    getCollect() {
        let file = __filename.split(path.sep);
        file = file[file.length - 1].split('.')[0];
        return file;//设定表名
    }

    getConn() {
        return dbconn.mongoConn;
    }

    getByQueryPopulate(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate('article').exec();
    }
}

const Schema = Collect.SchemaExt({
    user: {type: ObjectId, ref: "user"},//收藏着id
    article: {type: ObjectId, ref: "article"},//文章id
});
Schema.index({user: 1, status: 1})
module.exports = new Collect(null);