'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const ObjectId = mongoose.Schema.Types.ObjectId;

class DB extends CommonDao {
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

    // async create (doc = MissingParameter()) {
    //     let self = this
    //     const session = await dbconn.mongoConn.startSession()
    //     session.startTransaction();
    //     let createResult = await this.model.create([doc], {session})
    //     await session.commitTransaction();
    //     session.endSession();
    //     return createResult
    // }
}
const Schema = DB.SchemaExt({
    cid: { type: ObjectId, ref: 'coupon' }, // 优惠券 ID
    userId: { type: ObjectId, ref: 'user' },  // 用户 ID
    childId: { type: ObjectId, ref: 'child' },  // 孩子 ID
    missionId: { type: ObjectId, ref: 'survey_mission' },  // 普查任务 ID
    money: { type: Number },    // 金额
    useStatus: { type: Number, default: 1 },    // 状态：1.正常，2.已使用
    schoolId: {type: ObjectId, ref: 'school' },  // 学校 ID, 用于使用时判断同城...
    areaId: {type: ObjectId, ref: 'area' },  // 同上
    image: {type: String, default: ''},     // 二维码
    staff: {type: ObjectId, ref: 'user'},   // 核销人员
});

// Schema.post('save', async function (one) {
//     const User = require('./user');
//     let result = await User.update({ _id: one.userId }, {
//         $addToSet: {
//             coupons: one._id
//         }
//     }, {});
// });

// Schema.post('findOneAndUpdate', async function (doc) {
//     if (doc && doc.status == -1) {
//         const User = require('./user');
//         await User.updateOne({ _id: doc.userId }, {
//             $pull: {
//                 coupons: doc._id
//             }
//         }, {});
//     }
// });

// Schema.index({missionId: -1, childId: -1}, {unique: true})
module.exports = new DB(null);