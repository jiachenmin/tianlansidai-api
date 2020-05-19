'use strict';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const ObjectId = mongoose.Schema.Types.ObjectId;

class CommonDao {
    constructor(model) {
        if (!model) {
            this.conn = this.getConn();
            this.schema = this.getSchema();
            this.collect = this.getCollect();
            this.model = this.conn.model(this.collect, this.schema);
        } else this.model = model;
    }
    static SchemaExt(obj, options) {

        options = Object.assign({}, {
            read: 'secondaryPreferred',
            writeConcern: {
                w: 'majority',
                j: true,
                wtimeout: 1000
            }
        }, options)

        let ext = {
            memo: { type: String, default: "" },
            status: { type: Number, default: 1 }, // -1.已删除  1: 新创建 2: 已启用 3: 已停用 
            createBy: { type: String, alias: 'create_by', default: "admin" },
            createAt: { type: Date, alias: 'create_at', default: Date.now },//创建时间
            modifyAt: { type: Date, alias: 'modify_at', default: Date.now },//更新时间
            modifyBy: { type: String, alias: 'modify_by', default: "admin" }
        }
        obj = Object.assign({}, obj, ext)
        let schema = new mongoose.Schema(obj, options)

        // schema.pre('updateOne', async function(next) {
        //     this.modifyAt = new Date()
        //     next()
        // });
        return schema
    }
    setModel(collect, conn, schema) {
        if (collect) this.collect = collect;
        if (conn) this.conn = conn;
        if (schema) this.schema = schema;
        this.model = this.conn.model(this.collect, this.schema);
        return this;
    }
    initModel(model) {
        this.model = model;
        return this;
    }
    getModel() {
        return this.model;
    }
    create(docs = MissingParameter()) {
        return this.model.create(docs);
    }
    getById(id = MissingParameter()) {
        return this.model.findOne({ _id: id }).exec();
    }
    countByQuery(query) {
        return this.model.countDocuments(query)//  count();
    }
    getByQuery(query, fileds, opt) {
        // opt = {limit: count, skip: (page - 1) * count}
        return this.model.find(query, fileds, opt).exec();
    }
    save(model = MissingParameter()) {
        model = model instanceof this.model ? model : new this.model(model);
        return model.save();
    }
    getOneByQuery(query, fileds, opt) {
        return this.model.findOne(query, fileds, opt).exec();
    }
    getAll() {
        return this.model.find({}).exec();
    }
    remove(query) {
        return this.model.remove(query);
    }
    updateOne(conditions, update, options) {
        return this.model.updateOne(conditions, update, options);
    }
    update(conditions, update, options) {
        return this.model.updateMany(conditions, update, options);
    }
    updateMany(conditions, update, options) {
        return this.model.updateMany(conditions, update, options);
    }
    distinct(query, field) {
        return this.model.find(query).distinct(field);
    }
    delete(conditions) {
        return this.model.findOneAndUpdate(conditions, { $set: { status: -1 } }, { new: true });
    }
    findOneAndUpdate(conditions, update, options) {
        return this.model.findOneAndUpdate(conditions, update, options);
    }
    findOneAndReplace(conditions, options) {
        return this.model.findOneAndReplace(conditions, options);
    }
    findOneAndDelete(conditions, options) {
        return this.model.findOneAndDelete(conditions, options);
    }
    insertMany(docs) {
        return this.model.collection.insertMany(docs);
    }
}
/**
 * 静态属性
 * 静态属性指的是Class本身的属性，即Class.propname，而不是定义在实例对象（this）上的属性。
 * 目前，只有这种写法可行，因为ES6明确规定，Class内部只有静态方法，没有静态属性。
 */
CommonDao.mongoose = mongoose;
module.exports = CommonDao;