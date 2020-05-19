'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const ObjectId = mongoose.Schema.Types.ObjectId;

class DB extends CommonDao {
    constructor(model) {
        super(model);
    }
    getSchema () {
        return Schema;
    }
    getCollect () {
        let file = __filename.split(path.sep);
        file = file[file.length - 1].split('.')[0];
        return file;//设定表名
    }
    getConn () {
        return dbconn.mongoConn;
    }

    getByQueryPopulate (query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate('hospitalId').populate('schoolId').exec();
    }
}
const Schema = DB.SchemaExt({
    hospitalId: { type: ObjectId, ref: 'hospital' },            // 医院 ID
    appointedDate: { type: Date, default: Date.now },           // 预约的日期
    appointedTime: { type: String, default: "" },               // 预约的时间段
    phone: { type: String, default: "" },                       // 家长手机号
    childName: { type: String, default: "" },                   // 孩子姓名
    childGender: { type: Number },                              // 1 male 2 female
    childIdentityCard: { type: String, default: "" },           // 孩子身份证
    schoolId: { type: ObjectId, ref: "school" },                // 学校 ID
    gradeName: { type: String, default: "" },                   // 班级
    className: { type: String, default: "" },                   // 年级
});

module.exports = new DB(null);