'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class Feedback extends CommonDao {
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

const Schema = Feedback.SchemaExt({
    surveyMissionId: {type: ObjectId, ref: "survey_mission"},//普查任务id
    parentId: {type: ObjectId, ref: "user"},//家长id
    childId: {type: ObjectId, ref: "child"},//宝贝id
    phone: {type: String, alias: 'mobile', length: 11},//电话
    parentName: {type: String, default: ""},//家长名字
    parentOpinion: {type: String, default: ""}//家长意见
});
Schema.index({surveyMissionId: -1, childId: -1}, {unique: true})
module.exports = new Feedback(null);
