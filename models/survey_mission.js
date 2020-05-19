'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class SurveyMission extends CommonDao {
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
        return this.model.find(query, fileds, opt).populate("schoolId").exec();
    }

    getOneByQueryPopulate(query, fileds, opt) {
        return this.model.findOne(query, fileds, opt).populate("schoolId").exec();
    }

    getByQueryPopulateSDC(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate("schoolId").populate("doctorIds").populate("couponId").exec();
    }
}

const Schema = SurveyMission.SchemaExt({
    name: {type: String, default: ""},  //任务名称
    code: {type: String},               //任务编码
    schoolId: {type: ObjectId, ref: "school"},//学校Id
    areaId: {type: ObjectId, ref: "area"},  //区域Id
    doctorIds: [{                       //参与医生的Id
        type: ObjectId, ref: "doctor"
    }],
    businessStatus: {type: Number, default: 1},//1 新建，2 执行中，3 已完成
    startTime: {type: Date},//开始时间
    endTime: {type: Date},//结束时间
    couponId: [{type: ObjectId, ref: "coupon"}],   //可领取的优惠券
    completeTime: {type: Date, default: null}//标记完成时间
});
module.exports = new SurveyMission(null);