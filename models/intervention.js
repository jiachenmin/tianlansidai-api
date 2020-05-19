'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const config = require('../config');
const ObjectId = mongoose.Schema.Types.ObjectId;

class InterventionType extends CommonDao {
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

const Schema = InterventionType.SchemaExt({
    version: {type: ObjectId, ref: "intervention_version"},//版本id
    seq: {type: Number},//排序序号
    number: {type: String, default: ""},//编号
    content: {type: String, default: ""},//内容
    visionRule: {type: String},//视力规则
    questionnaireRule: {type: String, default: ""},//问卷规则
    questionnaire: {type: ObjectId, ref: "questionnaire"},//问卷id
    businessStatus: {type: Number, default: "2"}//1新创建，2已启用，3停用
});
module.exports = new InterventionType(null);