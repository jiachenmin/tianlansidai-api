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
    getById (id = MissingParameter()) {
        return this.model.findOne({_id: id}).populate({
            path: 'coupons',
            match: { status: 1 }
        }).populate({
            path: 'children',
            match: { status: 1 }
        }).exec();
    }
    getByQuery(query, fileds, opt, callback) {
        return this.model.find(query, fileds, opt).populate({
            path: 'coupons',
            match: { status: 1 }
        }).populate({
            path: 'children',
            match: { status: 1 }
        }).exec();
    }
}
const Schema = DB.SchemaExt({
    ctid: {type: String},
    name: {type: String},
    parentId: {
        type: ObjectId,
        default: null,
        ref: 'questionnaire'
    },
    childList: [{
        type: ObjectId,
        ref: 'questionnaire'
    }],
    // coupons: [{
    //     type: ObjectId, 
    //     ref: 'coupon'
    // }],
    memo: {type: String, default:''},
});

Schema.post('save', async function(one) {
    const CouponType = require('./coupon_type');
    let result = await CouponType.update({_id: one.parentId}, {
        $addToSet: {
            childList: one._id
        }
    }, {})
});

// delete
Schema.post('findOneAndUpdate', async function(doc) {
    const CouponType = require('./coupon_type');
    if (doc && doc.status == -1 && doc.parentId) {
       let result = await CouponType.updateOne({_id: doc.parentId}, {
           $pull: {
               childList: doc._id
           }
       }, {})
    }
});

module.exports = new DB(null);