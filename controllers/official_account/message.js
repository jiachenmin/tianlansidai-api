const config = require('../../config')
const crypto = require("crypto");
const LOG = require('../../common/log.js')
const xml2js = require('xml2js');
const WCAPI = require('../../common/offiaccount.js');
const userModel = require('../../models/user')
const moment = require('moment')

/**
 *
 * @param {} ctx
 * @param {*} next
 */
async function wxCheckSign(ctx, next) {

    let param = ctx.query;

    if (checkrSign(param)) {
        ctx.response.body = param.echostr;
    } else {
        ctx.response.body = false;
    }
    // await next();
}

/**
 *
 * @param {} ctx
 * @param {*} next
 */
async function wxMessageEvent(ctx, next) {
    let param = ctx.query;
    let body = ctx.request.body;
    console.log("body:", body.toString());
    ctx.response.body = await msgHandler(body.xml);
}

async function toXml(obj) {
    var builder = new xml2js.Builder({
        allowSurrogateChars: true
    });
    var xml = builder.buildObject({
        xml: obj
    });
    return xml;
}

const attrKeysMsg = {
    "key1": {
        MsgType: 'text',
        Content: '你好啊<a href="https://www.baidu.com">点击跳转百度</a>',
    },
    "key2": {
        MsgType:'news',
        ArticleCount: 1,
        Articles: {
            'item': {
                Title: "测试标题",
                Description: "测试描述",
                PicUrl: "https://mmbiz.qpic.cn/mmbiz_jpg/fQkWb9YYyiavKLYib1RmqicPb0IwiaoTD8Pxt5U2qTI2SPYibibJGlS45HY10ASAtBZCicGvslTuYYpz0IC6xp1tVdCtg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1",
                Url: "https://mp.weixin.qq.com/s/w6G-11pJPyd0P17aKtcpHg"
            }
        }
    },
}



async function msgHandler(result) {

    // console.log(result);
    let baseData = {
        ToUserName: result.FromUserName,
        FromUserName: result.ToUserName,
        CreateTime: Date.now(),
    }
    let user = null;
    switch (result.MsgType) {
        case 'text':
            switch (result.Content.toLowerCase()) {
                case 'bind':
                    user = await WCAPI.getWxUserInfo(result.FromUserName);
                    if (user) {
                        // console.log("绑定没有关注的用户")
                        user = await userModel.findOneAndUpdate({ "unionId": user.unionid }, {
                            $set: {
                                openId_wxb5d799965c32b6af: user.openid,
                                unionId: user.unionid,
                                nickName: user.nickname,
                                language: user.language,
                                city: user.city,
                                gender: user.sex,
                                province: user.province,
                                country: user.country,
                                avatarUrl: user.headimgurl,
                                subscribe: user.subscribe,
                                subscribeTime: moment(parseInt(user.subscribe_time) * 1000),
                            }
                        }, { new: false, upsert: true });
                    }
                    var data = Object.assign({
                        MsgType: 'text',
                        Content: "绑定成功",
                    }, baseData);
                    return toXml(data);
                default:
                    // 关键词匹配规则
                    let o = attrKeysMsg[result.Content.toLowerCase()];
                    if (o != undefined && o != null) {
                        console.log('o', o);
                        var data = Object.assign(o, baseData);
                        return toXml(data);
                    } else {
                        // 没有匹配不回复任何东西
                        return "success";
                    }
            }
        case 'event':
            switch (result.Event) {
                case "subscribe":
                    // console.log("关注了");
                    user = await WCAPI.getWxUserInfo(result.FromUserName);
                    if (user) {
                        // console.log("<<<:", user);
                        user = await userModel.findOneAndUpdate({ "unionId": user.unionid }, {
                            $set: {
                                openId_wxb5d799965c32b6af: user.openid,
                                unionId: user.unionid,
                                nickName: user.nickname,
                                language: user.language,
                                city: user.city,
                                gender: user.sex,
                                province: user.province,
                                country: user.country,
                                avatarUrl: user.headimgurl,
                                subscribe: user.subscribe,
                                subscribeTime: moment(parseInt(user.subscribe_time) * 1000),
                            }
                        }, { new: false, upsert: true });
                        // console.log(">>>:", user);
                    }
                    var data = Object.assign({
                        MsgType: 'text',
                        Content: '终于等到你啦，让我们一起对抗儿童青少年“近视”！',
                    }, baseData);
                    return toXml(data);
                case "unsubscribe":
                    // 取消关注
                    user = await WCAPI.getWxUserInfo(result.FromUserName);
                    if (user) {
                        // console.log("<<<:", user);
                        user = await userModel.findOneAndUpdate({ "openId_wxb5d799965c32b6af": user.openid }, {
                            $set: {
                                subscribe: user.subscribe,
                                modifyAt: Date.now()
                            }
                        }, { new: false, upsert: true });
                        // console.log(">>>:", user);
                    }
                    // console.log("取消关注了");
                    return "success";
                case 'CLICK':
                    var data = Object.assign({
                        MsgType: 'text',
                        Content: '点击了按钮：' + result.EventKey,
                    }, baseData);

                    return toXml(data);
                default:
                    return "success";
            }

        default:
            return "success";
    }
}


/**
 * 创建菜单
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
async function createMenus(ctx, next) {

    let body = ctx.request.body;

    if (!body) {
        ctx.state.code = 4;
        ctx.state.message = "10000#参数不合法!";
        throw new Error(error)
    }

    let res = await WCAPI.createMenus(body);
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, res);
    await next;
}

async function checkrSign(param) {
    let sign = param.signature;
    // 拼成数组，字典排序，再拼接
    const tmpStr = [config.offiaccount.token, param.timestamp, param.nonce].sort().reduce((prev, cur) => prev + cur);
    // sha1加密
    const sha1 = crypto.createHash('sha1');
    const sha1_result = sha1.update(tmpStr).digest('hex');

    // 如果是来自微信的请求就返回echostr
    if (sign == sha1_result) {
        return true;

    } else {
        return false;
    }

}

module.exports = { wxCheckSign, wxMessageEvent, createMenus }
