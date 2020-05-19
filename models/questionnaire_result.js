'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class QuestionnaireResult extends CommonDao {
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
}

const Schema = QuestionnaireResult.SchemaExt({
    child: {type: ObjectId, ref: 'child'},//宝贝id
    questionnaire: {type: ObjectId, ref: 'questionnaire'},//问卷id
    select: [{
        _id: false,
        subject: {type: ObjectId, ref: "subject"},//题目id
        value: String//选择的值
    }]
});

module.exports = new QuestionnaireResult(null);
