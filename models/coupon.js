'use strict';
const path      = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn    = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
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
        file     = file[file.length-1].split('.')[0];
        return file;//设定表名
    }
    getConn () {
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
    ctid: {type: ObjectId, ref: 'coupon_type' }, // 优惠券类型 ID
    seq: {type: Number},
    code: {type: String},
    title: {type: String},
    content: {type: String},
    introduceUrl: {type: String},
    collectRule: {type: Object, default: null},
    useRule: {type: Object, default: null},
    isUse: {type: Number, default:1},
    memo: {type: String, default:''},
});

// Schema.post('save', async function(one) {
//     const CouponType = require('./coupon_type');
//     let result = await CouponType.update({_id: one.gid}, {
//         $addToSet: {
//             subjects: one._id
//         }
//     }, {});
// });

// Schema.post('findOneAndUpdate', async function(doc) {
//     if (doc && doc.status == -1) {
//        const CouponType = require('./coupon_type');
//     //    console.log(doc._id)
//        let result = await CouponType.updateOne({_id: doc.gid}, {
//            $pull: {
//                terms: doc._id
//            }
//        }, {});
//     }
// });

module.exports = new DB(null);