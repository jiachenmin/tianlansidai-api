const Joi = require('joi');
const CouponModel = require('../../models/coupon.js');
const CouponTypeModel = require('../../models/coupon_type.js');
const CouponInstanceModel = require('../../models/coupon_instance.js');
const UserModel = require("../../models/user.js");
const RoomModel = require("../../models/room.js");
const MissionModel = require("../../models/survey_mission.js");
const SurveyResultModel = require("../../models/survey_result.js");
const ChildModel = require("../../models/child.js");
const SchoolModel = require("../../models/school.js");
const AreaModel = require("../../models/area.js");
const StaffModel = require("../../models/room_person.js");
const qr_image = require("qr-image");
const config = require('../../config')
const moment = require('moment')
const mongoose = require('mongoose')
const OSS = require('ali-oss')

async function collectCoupon(ctx, next) {

    let cid = ctx.request.body.couponId;
    let user = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };
    // let missonId = ctx.request.body.misssionId;

    const schema = Joi.object().keys({
        cid: Joi.string().length(24).required(),
        // missonId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        cid: cid,
        // missonId: missonId,
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let coupon = await CouponModel.getById(cid);
    if (coupon == null) {
        ctx.state.code = -1;
        ctx.state.message = "未找到该公益补贴券";
        throw new Error(ctx.state.message)
    }

    let children = await ChildModel.getByQuery({ parentId: user._id, status: 1 }, '', {});
    let schools = [];
    children.forEach(oneChild => {
        schools.push(oneChild.schoolId)
    });
    let missions = await MissionModel.getByQuery({ schoolId: { $in: schools } }, '', {});
    let pair = [];
    children.forEach(oneChild => {
        missions.forEach(oneMission => {
            if (oneChild.schoolId.toString() == oneMission.schoolId.toString()) {
                pair.push({ child: oneChild._id, mission: oneMission._id });
            }
        });
    });

    let results = [];
    for (const onePair of pair) {
        let tmpRes = await SurveyResultModel.getByQuery({ child: onePair.child, surveyMission: onePair.mission }, '', {});
        if (tmpRes != null) {
            results = results.concat(tmpRes);
        }
    }
    // let coupons = await CouponInstanceModel.getByQuery({ _id: { $in: user.coupons } }, '', {});
    let coupons = await CouponInstanceModel.getByQuery({ userId: user._id }, '', {});

    let collectRule = coupon.collectRule;
    // console.log("00000================> " + JSON.stringify(coupon));
    let ruleData = {
        children: children,
        missions: missions,
        pair: pair,
        coupons: coupons,
        results: results,
        coupon2Collect: coupon,
        user: user,
    };
    // console.log("00000================> " + JSON.stringify(results));

    let res = await createInstance(collectRule, ruleData);
    console.log("================> " + JSON.stringify(res));
    if (!res.success) {
        ctx.state.code = res.code;
        ctx.state.message = res.message;
        throw new Error(error)
    } else {
        ctx.state.code = res.code;
        ctx.state.message = res.message;
        ctx.state.data = Object.assign({}, ctx.state.data, {
            coupons: res.instanceList,
        });
    }

    await next();
}

async function createInstance(rule, data) {
    let res = {};
    let noCollect = true;
    let instanceList = [];
    let tmp = [];
    //check
    // console.log("1111--------------> " + data.coupon2Collect._id);
    for (const oneMission of data.missions) {
        // console.log("2222--------------> " + /*JSON.stringify(oneMission)*/oneMission._id.toString());
        if (oneMission.couponId.indexOf(data.coupon2Collect._id.toString()) >= 0) {
            for (const oneResult of data.results) { //循环所有结果
                // console.log("3333--------------> " + JSON.stringify(oneResult));
                if ((oneResult.surveyMission.toString() == oneMission._id.toString()) && (oneResult.businessStatus == 4)) {
                    let needForCreate = [];

                    for (const onePair of data.pair) { //检查是否已领取
                        // console.log("11111===========> "+ JSON.stringify(onePair) + "---------> " + oneMission._id);
                        let tmpCollect = true;
                        for (const oneOriCoupon of data.coupons) { //循环已领取的优惠券列表
                            if ((onePair.mission.toString() == oneMission._id.toString()) && (oneOriCoupon.missionId.toString() == onePair.mission.toString()) && (oneOriCoupon.childId.toString() == onePair.child.toString())) {
                                noCollect = false;
                                tmpCollect = false;
                                break;
                            }
                        }
                        if (tmpCollect) {
                            if (onePair.mission.toString() == oneMission._id.toString()) {
                                needForCreate.push({ child: onePair.child, result: oneResult._id });
                            }
                        }
                    }

                    //create
                    // console.log("4444--------------> " + JSON.stringify(needForCreate) + " ========> "+ noCollect);
                    for (const onePair of needForCreate) {
                        // console.log("0000----------------------rule: " + JSON.stringify(rule));
                        for (let index = 0; index < rule.length; index++) {
                            const oneRule = rule[index];
                            // console.log("----------------------rule: " + JSON.stringify(oneRule));
                            switch (oneRule.type) {
                                case 1:
                                    let tmpNum = oneRule.num;
                                    let money = oneRule.money;
                                    for (let i = 0; i < tmpNum; i++) {
                                        let ciid = mongoose.Types.ObjectId()

                                        //生成二维码并上传到oss
                                        let qrimage = qr_image.image(ciid.toString())
                                        let filename = ciid.toString() + '_' + (new Date().getTime()) + '.png'
                                        let uploadRes = await upload(filename, qrimage)
                                        if (200 != uploadRes.res.status) {
                                            ctx.state.code = 4;
                                            ctx.state.message = "二维码生成失败!"
                                            ctx.state.data = {}
                                            return await next()
                                        }

                                        let tmpIns = await CouponInstanceModel.save({
                                            _id: ciid,
                                            cid: data.coupon2Collect._id,
                                            userId: data.user._id,
                                            childId: onePair.childId,
                                            missionId: oneMission._id,
                                            money: money,
                                            useStatus: 1,
                                            schoolId: oneMission.schoolId,
                                            areaId: oneMission.areaId,
                                            image: config.aliyun.oss.visitUrl + uploadRes.name,
                                        });
                                        instanceList.push(ciid);
                                    }
                                    break;

                                default:
                                    break;
                            }
                        }
                        let result = await SurveyResultModel.updateOne({
                            _id: onePair.result,
                        }, { $set: { businessStatus: 5 } })
                    }

                } else if ((oneResult.surveyMission.toString() == oneMission._id.toString()) && (oneResult.businessStatus < 4)) {
                    tmp.push({
                        success: false,
                        code: -1,
                        message: "请先完成普查并填写反馈",
                        missionId: oneMission._id,
                        resultId: oneResult._id,
                        missionStatus: oneResult.businessStatus,
                    });
                    // return res;
                }
            }
        }
    }
    // console.log("5555--------------> " + JSON.stringify(instanceList) + "  ==============>" + JSON.stringify(tmp));
    // console.log("5555--------------> " + noCollect);
    if (instanceList.length > 0) {
        res = {
            success: true,
            code: 1,
            message: "领取成功",
            instanceList: instanceList,
        };
        return res;
    }
    if (tmp.length > 0) {
        res = {
            success: false,
            code: -1,
            message: "请先完成普查并填写反馈",
            tmpData: tmp,
        };
        return res;
    }
    if (!noCollect) {
        res = {
            success: false,
            code: -1,
            message: "已领取过该优惠券",
        };
        return res;
    }
    res = {
        success: false,
        code: -1,
        message: "您没有可领取的优惠券",
    };
    return res;
}

async function newCollectForOne(ctx, next) {
    let user = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };
    let childId = ctx.request.body.childId;
    let missionId = ctx.request.body.surveyId;

    const schema = Joi.object().keys({
        childId: Joi.string().length(24).required(),
        missionId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        childId: childId,
        missionId: missionId,
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let instanceList = [];
    let success = true;

    let child = await ChildModel.getById({ _id: value.childId });
    let oneMission = await MissionModel.getById({ _id: value.missionId });
    let result = await SurveyResultModel.getOneByQuery({ child: value.childId, surveyMission: value.missionId }, '', {});
    if (result.businessStatus != 4) {
        ctx.state.code = 4;
        ctx.state.message = "请先完成普查并填写反馈";
        throw new Error(ctx.state.message);
    }
    let oriCoupons = await CouponInstanceModel.getByQuery({ userId: user._id, missionId: value.missionId, childId: value.childId }, '', {});
    if (oriCoupons.length > 0) {
        ctx.state.code = 4;
        ctx.state.message = "已领取过该公益补贴券";
        throw new Error(ctx.state.message);
    }

    let tmpList = [];
    for (let i = 0; i < oneMission.couponId.length; i++) {
        const couponId = oneMission.couponId[i];
        let coupon = await CouponModel.getById({ _id: couponId });
        let canCollect = true;
        for (let j = 0; j < coupon.collectRule.length; j++) {
            const oneRule = coupon.collectRule[j];
            switch (oneRule.type) {
                case 1: //领取相关， money：单张金额，num：张数
                    let tmpNum = oneRule.num;
                    let money = oneRule.money;
                    for (let n = 0; n < tmpNum; n++) {
                        let tmpIns = {
                            cid: couponId,
                            userId: user._id,
                            childId: value.childId,
                            missionId: value.missionId,
                            money: money,
                            useStatus: 1,
                            schoolId: child.schoolId,
                            areaId: oneMission.areaId,
                        };
                        tmpList.push(tmpIns);
                    }
                    break;
                case 2: // 领取条件， time：天数
                    let completeTime = Date.parse(oneMission.completeTime);
                    let limitTime = (oneRule.time) * 24 * 60 * 60 * 1000;
                    let nowS = Date.parse(new Date());
                    if (completeTime + limitTime <= nowS) {
                        canCollect = false;
                    }
                    break;
                default:
                    break;
            }
        }
        if (!canCollect) {
            success = false;
        } else {
            for (let k = 0; k < tmpList.length; k++) {
                const element = tmpList[k];
                let tmpInsSave = await CouponInstanceModel.save(element);
                instanceList.push(tmpInsSave._id);
            }
        }
    }
    if (!success) {
        ctx.state.code = 4;
        ctx.state.message = "公益补贴券已超过领取有效期";
        ctx.state.data = {};
        throw new Error(ctx.state.message);
    }
    if (success && instanceList.length == 0) {
        ctx.state.code = 4;
        ctx.state.message = "您没有可领取的公益补贴券";
        ctx.state.data = {};
        throw new Error(ctx.state.message);
    }

    let resultNew = await SurveyResultModel.updateOne({
        _id: result._id,
    }, { $set: { businessStatus: 5 } });

    ctx.state.code = 1;
    ctx.state.message = "领取成功";
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupons: instanceList,
    });

    await next();
}
async function newCollect(ctx, next) {
    let user = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };

    let children = await ChildModel.getByQuery({ parentId: user._id, status: 1 }, '', {});
    let instanceList = [];
    let success = true;
    let isRule = true;
    let message = '';

    for (const child of children) {
        let mission = await MissionModel.getByQuery({ schoolId: child.schoolId }, '', {});
        for (const oneMission of mission) {
            let oriCoupons = await CouponInstanceModel.getByQuery({ userId: user._id, missionId: oneMission._id, childId: child._id }, '', {});

            if (oriCoupons.length > 0) {
                success = false;
                message = "已领取过该公益补贴券"
                break;
            }

            let mResult = await SurveyResultModel.getByQuery({ child: child._id, surveyMission: oneMission._id }, '', {});
            for (const oneResult of mResult) {
                if (oneResult.businessStatus != 4) {
                    console.log("--------------------->" + JSON.stringify(oneResult));
                    success = false;
                    message = "请先完成普查并填写反馈"
                    break;
                } else {
                    let tmpList = [];
                    for (let i = 0; i < oneMission.couponId.length; i++) {
                        const couponId = oneMission.couponId[i];
                        let coupon = await CouponModel.getById({ _id: couponId });
                        let canCollect = true;
                        for (let j = 0; j < coupon.collectRule.length; j++) {
                            const oneRule = coupon.collectRule[j];
                            switch (oneRule.type) {
                                case 1: //领取相关， money：单张金额，num：张数
                                    let tmpNum = oneRule.num;
                                    let money = oneRule.money;
                                    for (let n = 0; n < tmpNum; n++) {
                                        let ciid = mongoose.Types.ObjectId()

                                        //生成二维码并上传到oss
                                        let qrimage = qr_image.image(ciid.toString())
                                        let filename = ciid.toString() + '_' + (new Date().getTime()) + '.png'
                                        let uploadRes = await upload(filename, qrimage)
                                        if (200 != uploadRes.res.status) {
                                            ctx.state.code = 4;
                                            ctx.state.message = "二维码生成失败!"
                                            ctx.state.data = {}
                                            return await next()
                                        }

                                        let tmpIns = {
                                            _id: ciid,
                                            cid: couponId,
                                            userId: user._id,
                                            childId: child._id,
                                            missionId: oneResult.surveyMission,
                                            money: money,
                                            useStatus: 1,
                                            schoolId: child.schoolId,
                                            areaId: oneMission.areaId,
                                            image: config.aliyun.oss.visitUrl + uploadRes.name,
                                        };
                                        tmpList.push(tmpIns);
                                    }
                                    break;
                                case 2: // 领取条件， time：天数
                                    let completeTime = Date.parse(oneMission.completeTime);
                                    let limitTime = (oneRule.time) * 24 * 60 * 60;
                                    let nowS = Date.parse(new Date());
                                    if (completeTime + limitTime > nowS) {
                                        canCollect = false;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (!canCollect) {
                            success = false;
                            isRule = false;
                        } else {
                            for (let k = 0; k < tmpList.length; k++) {
                                const element = tmp[k];
                                let tmpInsSave = await CouponInstanceModel.save(element);
                                instanceList.push(tmpInsSave._id);
                            }
                        }
                    }
                }
            }
        }
    }
    if (!success && !isRule) {
        ctx.state.code = 4;
        ctx.state.message = "公益补贴券已超过领取有效期";
        ctx.state.data = {};
        throw new Error(ctx.state.message);
    }
    if (success && instanceList.length == 0) {
        ctx.state.code = 4;
        ctx.state.message = "您没有可领取的公益补贴券";
        ctx.state.data = {};
        throw new Error(ctx.state.message);
    }
    if (instanceList.length == 0 && !success) {
        ctx.state.code = 4;
        ctx.state.message = message;
        ctx.state.data = {};
        throw new Error(ctx.state.message);
    }

    ctx.state.code = 1;
    ctx.state.message = "领取成功";
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupons: instanceList,
    });

    await next();
}

async function useCoupon(ctx, next) {

    let ciid = ctx.request.body.id;
    let staff = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };
    // let userId = ctx.request.body.userId;

    // let user = getUser(userId);
    let staffPerson = await StaffModel.getOneByQuery({ phone: staff.phone });
    if (!staffPerson) {
        ctx.state.code = 4;
        ctx.state.message = "您没有核销权限";
        throw new Error(ctx.state.message)
    }

    const schema = Joi.object().keys({
        ciid: Joi.string().length(24).required()
    });

    const { error, value } = Joi.validate({
        ciid: ciid
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let couponInstance = await CouponInstanceModel.getById(ciid);
    if (couponInstance == null) {
        ctx.state.code = 4;
        ctx.state.message = "未找到该公益补贴券";
        throw new Error(ctx.state.message)
    }
    let coupon = await CouponModel.getById(couponInstance.cid);
    if (coupon == null) {
        ctx.state.code = 4;
        ctx.state.message = "未找到该公益补贴券";
        throw new Error(ctx.state.message)
    }
    if (couponInstance.useStatus == 2) {
        ctx.state.code = 4;
        ctx.state.message = "该公益补贴券已使用过";
        throw new Error(ctx.state.message)
    }
    if (couponInstance.useStatus == 3) {
        ctx.state.code = 4;
        ctx.state.message = "该公益补贴券已过期";
        throw new Error(ctx.state.message)
    }
    // if (user._id != couponInstance.userId) {
    //     ctx.state.code = -1;
    //     ctx.state.message = "用户不是该优惠券拥有者";
    //     throw new Error(ctx.state.message)
    // }

    let useRule = coupon.useRule;
    let canUse = true;
    if (useRule != null || useRule.length != 0) {
        // 其他需求？
        for (let i = 0; i < useRule.length; i++) {
            const oneRule = useRule[i];
            switch (oneRule.type) {
                case 2: // 限时， time：天数
                    let collectTime = Date.parse(couponInstance.createAt);
                    let limitTime = (oneRule.time) * 24 * 60 * 60 * 1000;
                    let nowS = Date.parse(new Date());
                    console.log("------------------------>" + JSON.stringify([collectTime, limitTime, nowS, ((collectTime + limitTime) <= nowS)]));
                    if ((collectTime + limitTime) <= nowS) {
                        canUse = false;
                        ctx.state.code = 4;
                        ctx.state.message = "该公益补贴券已过期";
                        throw new Error(ctx.state.message)
                    }
                    break;

                default:
                    break;
            }
        }
    }
    // 默认同城判断
    let schoolId = couponInstance.schoolId;
    let areaId = couponInstance.areaId;
    let school = await SchoolModel.getById(schoolId);
    if (!school) {
        ctx.state.code = 4;
        ctx.state.message = "学校与本小屋不在同一城市";
        throw new Error(ctx.state.message)
    }

    let room = await RoomModel.getById(staffPerson.roomId);
    if (school.cityCode != room.cityCode) {
        ctx.state.code = 4;
        ctx.state.message = "本小屋与学校不在同一城市";
        throw new Error(ctx.state.message)
    }

    if (canUse) {
        // 其他操作？
        // 改变优惠卷使用状态
        await CouponInstanceModel.update({ _id: ciid }, {
            $set: {
                useStatus: 2, // 2：已使用！
                staff: staff._id,
            }
        }, {});
    }

    ctx.state.code = 1;
    ctx.state.message = "公益补贴券使用成功";

    await next();
}

async function getList(ctx, next) {
    let user = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };

    let count = ctx.request.query.pageSize
    let page = ctx.request.query.pageNum
    let type = ctx.request.query.type

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).required(),
        page: Joi.number().default(1).min(1).required(),
        type: Joi.number().default(1).min(1).max(3).required(),
    });

    const { error, value } = Joi.validate({
        count: count,
        page: page,
        type: type,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let opt = {
        limit: value.count,
        skip: (value.page - 1) * value.count,
        sort: { seq: 1 }
    }

    let coupons = await CouponInstanceModel.getByQuery({ userId: user._id, useStatus: value.type }, '', opt);
    let couponsList = [];
    for (const oneCoupon of coupons) {
        let time = 0;
        let canUse = true;
        let coupon = await CouponModel.getById({ _id: oneCoupon.cid });
        let couponType = await CouponTypeModel.getById({ _id: coupon.ctid });
        for (let j = 0; j < coupon.useRule.length; j++) {
            const oneRule = coupon.useRule[j];
            if (oneRule.type == 2 && value.type == 1) {
                let collectTime = Date.parse(oneCoupon.createAt);
                let limitTime = (oneRule.time) * 24 * 60 * 60 * 1000;
                let nowS = Date.parse(new Date());
                let tmpTime = Math.trunc((limitTime - (nowS - collectTime)) / (24 * 60 * 60 * 1000));
                // console.log("------------------------>" + JSON.stringify([collectTime, limitTime, nowS, ((collectTime + limitTime) <= nowS)]));
                console.log("------------------------>" + tmpTime);
                if (collectTime + limitTime <= nowS) {
                    canUse = false;
                } else if (tmpTime < 1) {
                    if (Math.trunc((limitTime - (nowS - collectTime)) / (60 * 60 * 1000)) >= 1) {
                        time = Math.trunc((limitTime - (nowS - collectTime)) / (60 * 60 * 1000)) + "小时";
                    } else if (Math.trunc((limitTime - (nowS - collectTime)) / (60 * 1000)) >= 1) {
                        time = Math.trunc((limitTime - (nowS - collectTime)) / (60 * 1000)) + "分钟";
                    } else {
                        time = Math.trunc((limitTime - (nowS - collectTime)) / 1000) + "秒";
                    }
                } else {
                    time = tmpTime + "天";
                }
            }
        };
        if (time == 0) {
            time = "长期有效";
        }
        if (value.type == 2) {
            time = "已核销";
        }
        if (!canUse || value.type == 3) {
            time = "已过期";
        }
        let outCoupon = {
            ciid: oneCoupon._id,
            name: couponType.name,
            title: coupon.title,
            content: coupon.content,
            introduceUrl: coupon.introduceUrl,
            useStatus: oneCoupon.useStatus,
            createAt: moment(oneCoupon.createAt).format("YYYY年MM月DD日"),
            money: oneCoupon.money,
            desc: coupon.memo,
            expiryTime: time,
        };
        if (!canUse && value.type == 1) {
            let couponsNew = await CouponInstanceModel.findOneAndUpdate({
                _id: oneCoupon._id,
            }, { $set: { useStatus: 3 } });
            continue;
        }
        couponsList.push(outCoupon);
    }

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupons: couponsList,
    });

    await next();
}

async function getCanCollectListNew(ctx, next) {
    let user = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };
    let childId = ctx.request.query.childId;
    let missionId = ctx.request.query.surveyId;

    const schema = Joi.object().keys({
        childId: Joi.string().length(24).required(),
        missionId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        childId: childId,
        missionId: missionId,
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let oneMission = await MissionModel.getById({ _id: value.missionId });
    let result = await SurveyResultModel.getOneByQuery({ child: value.childId, surveyMission: value.missionId }, '', {});
    if (result.businessStatus != 4) {
        ctx.state.code = 4;
        ctx.state.message = "请先完成普查并填写反馈";
        ctx.state.data = Object.assign({}, ctx.state.data, {
            collectList: [],
        });
        throw new Error(ctx.state.message);
    }
    let coupon = await CouponModel.getByQuery({ _id: { $in: oneMission.couponId } }, '', {});
    let res = [];
    for (const oneCoupon of coupon) {
        let money = 0,
            num = 0,
            time = 0;
        let canCollect = true;
        let couponType = await CouponTypeModel.getById({ _id: oneCoupon.ctid });
        for (let j = 0; j < oneCoupon.collectRule.length; j++) {
            const oneRule = oneCoupon.collectRule[j];
            if (oneRule.type == 1) {
                money = oneRule.money;
                num = oneRule.num;
            }
            if (oneRule.type == 2) {
                let completeTime = Date.parse(oneMission.completeTime);
                let limitTime = (oneRule.time) * 24 * 60 * 60 * 1000;
                let nowS = Date.parse(new Date());
                // console.log("------------------------>" + JSON.stringify([completeTime, limitTime, nowS, ((completeTime + limitTime) <= nowS)]));
                if (completeTime + limitTime <= nowS) {
                    canCollect = false;
                } else {
                    time = Math.trunc((limitTime - (nowS - completeTime)) / (24 * 60 * 60 * 1000)) + "天";
                }
            }
        };
        if (time == 0) {
            time = "长期有效";
        }
        let outRes = {
            child: value.childId,
            mission: value.missionId,
            couponId: oneCoupon._id,
            name: couponType.name,
            title: oneCoupon.title,
            content: oneCoupon.content,
            introduceUrl: oneCoupon.introduceUrl,
            expiryTime: time,
            money: money,
            num: num,
        };
        if (canCollect) {
            res.push(outRes);
        }
    }
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        collectList: res,
    });

    await next();
}
async function getCanCollectList(ctx, next) {
    let user = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };
    // let childId = ctx.request.body.childId;
    // let missionId = ctx.request.body.missionId;

    let children = await ChildModel.getByQuery({ parentId: user._id, status: 1 });
    let schools = [];
    children.forEach(oneChild => {
        schools.push(oneChild.schoolId)
    });
    let missions = await MissionModel.getByQuery({ schoolId: { $in: schools } }, '', {});
    let pair = [];
    children.forEach(oneChild => {
        missions.forEach(oneMission => {
            if (oneChild.schoolId.toString() == oneMission.schoolId.toString()) {
                pair.push({ child: oneChild._id, mission: oneMission._id });
            }
        });
    });
    // console.log("------------------->" + JSON.stringify(pair));
    let results = [];
    for (const onePair of pair) {
        let tmpRes = await SurveyResultModel.getByQuery({ child: onePair.child, surveyMission: onePair.mission }, '', {});
        if (tmpRes != null) {
            results = results.concat(tmpRes);
        }
    }
    // console.log("====================>" + JSON.stringify(results));
    let res = [];
    for (const oneResult of results) {
        // console.log("====================>" + oneResult._id + " status: "+ oneResult.businessStatus);
        if (oneResult.businessStatus == 4) {
            for (const oneMission of missions) {
                if (oneMission._id.toString() == oneResult.surveyMission.toString()) {
                    let coupon = await CouponModel.getByQuery({ _id: { $in: oneMission.couponId } }, '', {});
                    for (const oneCoupon of coupon) {
                        let money = 0,
                            num = 0;
                        let couponType = await CouponTypeModel.getById({ _id: oneCoupon.ctid });
                        for (let j = 0; j < oneCoupon.collectRule.length; j++) {
                            const oneRule = oneCoupon.collectRule[j];
                            if (oneRule.type == 1) {
                                money = oneRule.money;
                                num = oneRule.num;
                            }
                        };
                        let outRes = {
                            child: oneResult.child,
                            mission: oneResult.surveyMission,
                            couponId: oneMission.couponId,
                            name: couponType.name,
                            title: oneCoupon.title,
                            content: oneCoupon.content,
                            introduceUrl: oneCoupon.introduceUrl,
                            expiryTime: "30天", // 目前先给小鹏返回，到时候需要对coupon加字段！后台需要可以配置~或通过某个规则获取！
                            money: money,
                            num: num,
                        };
                        res.push(outRes);
                    }
                }
            }
        }
    }

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        collectList: res,
    });

    await next();
}

async function couponInfo(ctx, next) {
    let ciid = ctx.request.query.ciid

    let instance = await CouponInstanceModel.getById({ _id: ciid });
    let coupon = await CouponModel.getById({ _id: instance.cid });
    let couponType = await CouponTypeModel.getById({ _id: coupon.ctid });

    let info = {
        ciid: ciid,
        name: couponType.name,
        title: coupon.title,
        content: coupon.content,
        introduceUrl: coupon.introduceUrl,
        image: instance.image,
        useStatus: instance.useStatus,
        createAt: moment(instance.createAt).format("YYYY年MM月DD日"),
        money: instance.money,
        desc: coupon.memo,
    };

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupon: info,
    });

    await next();
}

async function upload(filename, data) {
    filename = 'weapp/' + moment().format('YYYY/MM/DD') + '/' + filename
    let client = new OSS({
        region: config.aliyun.oss.region,
        accessKeyId: config.aliyun.oss.AccessKeyId,
        accessKeySecret: config.aliyun.oss.AccessKeySecret,
        bucket: config.aliyun.oss.bucket
    })
    let result = await client.putStream(filename, data);
    return result
}

async function getStaffCoupon(ctx, next) {
    let staff = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" };

    let staffPerson = await StaffModel.getOneByQuery({ phone: staff.phone });
    if (!staffPerson) {
        ctx.state.code = 4;
        ctx.state.message = "您不是爱眼小屋服务专员";
        throw new Error(ctx.state.message)
    }

    let count = ctx.request.query.pageSize
    let page = ctx.request.query.pageNum

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).required(),
        page: Joi.number().default(1).min(1).required(),
    });

    const { error, value } = Joi.validate({
        count: count,
        page: page
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let opt = {
        limit: value.count,
        skip: (value.page - 1) * value.count,
        sort: { seq: 1 }
    }

    let coupons = await CouponInstanceModel.getByQuery({ staff: staff._id }, '', opt);
    let couponsList = [];
    for (const oneCoupon of coupons) {
        let coupon = await CouponModel.getById({ _id: oneCoupon.cid });
        let couponType = await CouponTypeModel.getById({ _id: coupon.ctid });
        let outCoupon = {
            ciid: oneCoupon._id,
            name: couponType.name,
            title: coupon.title,
            content: coupon.content,
            useStatus: oneCoupon.useStatus,
            createAt: moment(oneCoupon.createAt).format("YYYY年MM月DD日"),
            money: oneCoupon.money,
            desc: coupon.memo,
        };
        couponsList.push(outCoupon);
    }

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupons: couponsList,
    });

    await next();
}

module.exports = { newCollectForOne, useCoupon, getList, getCanCollectListNew, couponInfo, getStaffCoupon }