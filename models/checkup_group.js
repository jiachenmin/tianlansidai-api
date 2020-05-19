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
            path: 'terms',
            match: { status: 1 },
            select: '',
            options: {sort: { seq: 1 }}
        }).populate({
            path: 'children',
            match: { status: 1 },
            select: '',
            options: {sort: { seq: 1 }}
        }).exec();
    }
    getByQuery(query, fileds, opt, callback) {
        return this.model.find(query, fileds, opt).populate({
            path: 'terms',
            match: { status: 1 },
            select: '',
            options: {sort: { seq: 1 }}
        }).populate({
            path: 'children',
            match: { status: 1 },
            select: '',
            options: {sort: { seq: 1 }}
        }).exec();
    }
}
const Schema = DB.SchemaExt({
    gid: {
        type: String
    },
    name: { 
        type: String, 
        default: '', 
        unique: true, 
        required: [true, 'group name required']
    },
    seq: {type:Number, default:1},
    parentId: {
        type: ObjectId,
        default: null,
        ref: 'checkup_group'
    },
    childList: [{
        type: ObjectId,
        ref: 'checkup_group'
    }],
    terms: [{
        type: ObjectId, 
        ref: 'checkup_term'
    }],
    memo: {type: String, default:''},
});

Schema.post('save', async function(one) {
    const CheckUpGroup = require('./checkup_group');
    let result = await CheckUpGroup.update({_id: one.parentId}, {
        $addToSet: {
            childList: one._id
        }
    }, {})
});

// delete
Schema.post('findOneAndUpdate', async function(doc) {
    const CheckUpGroup = require('./checkup_group');
    if (doc && doc.status == -1 && doc.parentId) {
       let result = await CheckUpGroup.updateOne({_id: doc.parentId}, {
           $pull: {
               childList: doc._id
           }
       }, {})
    }
});

module.exports = new DB(null);