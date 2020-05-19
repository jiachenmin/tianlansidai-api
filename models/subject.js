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
    qid: {type: ObjectId, ref: 'questionnaire' }, // 调查问卷 ID
    sid: {type: Number},
    code: {type: String},
    question: {type: String},
    stype: {type: Number, default:1},   // 1.选择题，2.开放题
    options: {type: String},
    isUse: {type: Number, default:1},
    memo: {type: String, default:''},
    isMust: {type: Number, default: 1}, // 1.必填，2.可空
});

Schema.post('save', async function(one) {
    const Questionnaire = require('./questionnaire');
    let result = await Questionnaire.update({_id: one.qid}, {
        $addToSet: {
            subjects: one._id
        }
    }, {});
});

Schema.post('findOneAndUpdate', async function(doc) {
    if (doc && doc.status == -1) {
       const Questionnaire = require('./questionnaire');
    //    console.log(doc._id)
       let result = await Questionnaire.updateOne({_id: doc.qid}, {
           $pull: {
               terms: doc._id
           }
       }, {});
    }
});

module.exports = new DB(null);