'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class SurveyResult extends CommonDao {
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

    getOneByQueryPopulate(query, fileds, opt) {
        return this.model.findOne(query, fileds, opt).populate('child').populate('intervention').exec();
    }

    getByQueryPopulate(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate('child').populate('intervention').exec();
    }

    getByQueryPopulateSM(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate('surveyMission').exec();
    }

    getByQueryPopulateChild(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate('child').exec();
    }

    getByQueryPopulateChildAndParent(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate({
            path: "child",
            populate: {
                path: "parentId"
            }
        }).exec();
    }
}

const Schema = SurveyResult.SchemaExt({
    type: {type: Number},//1 普查， 2 小屋体检
    surveyMission: {type: ObjectId, ref: "survey_mission"},//普查任务Id
    roomId: {type: ObjectId, ref: "room"},//小屋id
    child: {type: ObjectId, ref: "child"},//宝贝Id
    result: [{//体检结果
        _id: false,
        checkupGroup: {type: ObjectId, ref: "checkup_group"},//检查组Id
        checkupTerm: {type: ObjectId, ref: "checkup_term"},//检查项Id
        value: {type: String},//体检值
        doctor: {type: ObjectId, ref: "doctor"},//医生id
        staff: {type: ObjectId, ref: "room_person"},//小屋工作人员id
    }],
    intervention: [{type: ObjectId, ref: "intervention"}],//体检结果匹配到的干预方案
    questionnaireStr: [{type: Array}],//问卷匹配到的问卷规则
    interventionIsMatched: {type: Number, default: 1},//1，新建记录，2、匹配成功，3、匹配失败
    businessStatus: {type: Number, default: 2},//业务状态 1 请打印二维码，2 结果分析中，3 填写反馈 4 待领取优惠券 5 已领取优惠券（更改为 领取普查报告）
});

Schema.index({room: -1, child: -1, createAt: -1})

module.exports = new SurveyResult(null);