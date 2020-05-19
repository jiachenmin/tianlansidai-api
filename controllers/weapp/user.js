const moment = require('moment')
const userModel = require('../../models/user')
const config = require('../../config')
const redis = require('../../models/index.js').redisConn
const aesDecrypt = require('../../common/aesDecrypt.js')
const { ERRORS } = require('../../common/constants.js')

// @ 单后台支持多小程序 @ 登录授权
async function login4MultiMiniProgram(ctx, next) {

    let user = ctx.state.user

    const appId = user.appId

    const key4OpenId = "openId_" + appId
    const key4SessionKey = "sessionKey_" + appId
    const key4Skey = "skey_" + appId
    const key4LastVisitTime = "lastVisitTime_" + appId

    const value4OpenId = user["wxOpenId"][appId]
    const value4SessionKey = user["wxSessionKey"][appId]
    const value4Skey = user["wxSkey"][appId]
    const value4LastVisitTime = user["wxLastVisitTime"][appId]

    const queryCondition = { [key4OpenId]: value4OpenId }
    const isUserExist = await userModel.getOneByQuery(queryCondition)
    if (isUserExist) {
        // 如果用户存在则更新
        user = await userModel.findOneAndUpdate(queryCondition, {
            $set: {
                nickName: user.nickName,
                gender: user.gender,
                language: user.language,
                city: user.city,
                province: user.province,
                country: user.country,
                avatarUrl: user.avatarUrl,
                watermark: user.watermark,
                [key4Skey]: value4Skey,
                [key4SessionKey]: value4SessionKey,
                [key4LastVisitTime]: value4LastVisitTime,
            }
        })
    } else {
        user = await userModel.save({
            nickName: user.nickName,
            gender: user.gender,
            language: user.language,
            city: user.city,
            province: user.province,
            country: user.country,
            avatarUrl: user.avatarUrl,
            watermark: user.watermark,
            openId: value4OpenId,
            [key4OpenId]: value4OpenId,
            [key4Skey]: value4Skey,
            [key4SessionKey]: value4SessionKey,
            [key4LastVisitTime]: value4LastVisitTime,
        })
    }

    let expires = 7200 * 1000 // 7200s
    if (config.wechat.wxLoginExpires && !isNaN(parseInt(config.wechat.wxLoginExpires))) {
        expires = parseInt(config.wechat.wxLoginExpires) * 1000
    }
    await redis.setAsync(value4Skey, JSON.stringify(user), 'EX', expires)

    ctx.state.user = user
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        user: user
    })
    await next()
}
async function loginNotInDB4MultiMiniProgram(ctx, next) {
    let user = ctx.state.user

    const key4OpenId = "openId_" + user.wxAppId
    const key4SessionKey = "sessionKey_" + user.wxAppId
    const key4Skey = "skey_" + user.wxAppId
    const key4LastVisitTime = "lastVisitTime_" + user.wxAppId

    const value4OpenId = user["wxOpenId"][user.wxAppId]
    const value4SessionKey = user["wxSessionKey"][user.wxAppId]
    const value4Skey = user["wxSkey"][user.wxAppId]
    const value4LastVisitTime = user["wxLastVisitTime"][user.wxAppId]

    const queryCondition = { [key4OpenId]: value4OpenId }
    const isUserExist = await userModel.getOneByQuery(queryCondition)
    if (isUserExist) {
        // 如果用户存在则更新
        const userAfterUpdate = await userModel.findOneAndUpdate(queryCondition, {
            $set: {
                [key4Skey]: value4Skey,
                [key4SessionKey]: value4SessionKey,
                [key4LastVisitTime]: value4LastVisitTime,
            }
        }, { new: true })
        user = Object.assign({}, user, JSON.parse(JSON.stringify(userAfterUpdate)))
    }
    let expires = 7200 * 1000 // 7200s
    if (config.wechat.wxLoginExpires && !isNaN(parseInt(config.wechat.wxLoginExpires))) {
        expires = parseInt(config.wechat.wxLoginExpires) * 1000
    }
    await redis.setAsync(value4Skey, JSON.stringify(user), 'EX', expires)
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        user: user
    })
    await next()
}

// @ 单后台支持多小程序 @ 更改手机号
async function updateUserPhone4MultiMiniProgram(ctx, next) {
    let user = ctx.state.user
    // 判断手机号是否存在
    const phone = ctx.state.phone
    if (!phone) {
        ctx.state.data = Object.assign({}, ctx.state.data, { user: user })
        return await next()
    }
    // 判断手机号对应的用户是否存在
    const queryCondition = { phone: phone }
    let isUserExist = await userModel.getOneByQuery(queryCondition)
    if (!isUserExist) {
        const error = "该手机号对应的用户不存在！"
        ctx.state.code = 4
        ctx.state.message = error
        throw new Error(error)
    }

    // 将当前用户在当前小程序中的相关信息存在起来
    const key4OpenId = "openId_" + user.wxAppId
    const key4SessionKey = "sessionKey_" + user.wxAppId
    const key4Skey = "skey_" + user.wxAppId
    const key4LastVisitTime = "lastVisitTime_" + user.wxAppId

    const value4OpenId = user["wxOpenId"][user.wxAppId]
    const value4SessionKey = user["wxSessionKey"][user.wxAppId]
    const value4Skey = user["wxSkey"][user.wxAppId]
    const value4LastVisitTime = user["wxLastVisitTime"][user.wxAppId]

    const userAfterUpdate = await doUpdateUserInfo(value4Skey, user, queryCondition, {
        unionId: isUserExist.unionId ? isUserExist.unionId : user.unionId,
        [key4OpenId]: value4OpenId,
        [key4Skey]: value4Skey,
        [key4SessionKey]: value4SessionKey,
        [key4LastVisitTime]: value4LastVisitTime,
    })
    // 成功返回
    ctx.state.code = 1;
    ctx.state.user = userAfterUpdate
    ctx.state.data = Object.assign({}, ctx.state.data, { user: userAfterUpdate })
    await next()
}

// @ 单后台支持多小程序 @ 更改手机号
async function getUserByPhone(ctx, next) {
    let user = ctx.state.user
    // 判断手机号是否存在
    const phone = ctx.state.phone
    if (!phone) {
        const error = "没有手机号"
        ctx.state.code = 4
        ctx.state.message = error
        throw new Error(error)
    }
    // 判断手机号对应的用户是否存在
    const queryCondition = { phone: phone }
    let isUserExist = await userModel.listAllByQuery(queryCondition)
    if (!isUserExist) {
        const error = "该手机号对应的用户不存在"
        ctx.state.code = 4
        ctx.state.message = error
        throw new Error(error)
    }
    // 成功返回
    ctx.state.code = 1;
    ctx.state.user = user
    ctx.state.data = Object.assign({}, ctx.state.data, { phone: phone, users: isUserExist })
    await next()
}

// @ 单后台支持多小程序 @ 将当前用户绑定到另外一个用户上
async function linkTwoUsers(ctx, next) {
    
    // 判断是否传递了需要绑定的用户的id
    const userId = ctx.request.body.userId
    if (!userId) {
        const error = "没有指定要绑定到的用户的id"
        ctx.state.code = 4
        ctx.state.message = error
        throw new Error(error)
    }
    let user = ctx.state.user
    
    const key4OpenId = "openId_" + user.wxAppId
    const key4SessionKey = "sessionKey_" + user.wxAppId
    const key4Skey = "skey_" + user.wxAppId
    const key4LastVisitTime = "lastVisitTime_" + user.wxAppId

    const value4OpenId = user["wxOpenId"][user.wxAppId]
    const value4SessionKey = user["wxSessionKey"][user.wxAppId]
    const value4Skey = user["wxSkey"][user.wxAppId]
    const value4LastVisitTime = user["wxLastVisitTime"][user.wxAppId]

    // 查看当前账户是否已经绑定在其他用户上了
    let queryCondition = null
    let userAfterUpdate = null
    if (user && user._id){
        queryCondition = { _id: user._id }
        const isUserExist = await userModel.getOneByQuery(queryCondition)
        if (!isUserExist) {
            const error = "该标识对应的用户不存在！"
            ctx.state.code = 4
            ctx.state.message = error
            throw new Error(error)
        }
        userAfterUpdate = await doUpdateUserInfo(value4Skey, user, queryCondition, {
            unionId: "",
            [key4OpenId]: "",
            [key4Skey]: "",
            [key4SessionKey]: "",
            [key4LastVisitTime]: "",
        })
    }
    // 查找即将绑定的用户的信息
    queryCondition = { _id: userId }
    userAfterUpdate = await doUpdateUserInfo(value4Skey, user, queryCondition, {
        unionId: user.unionId,
        [key4OpenId]: value4OpenId,
        [key4Skey]: value4Skey,
        [key4SessionKey]: value4SessionKey,
        [key4LastVisitTime]: value4LastVisitTime,
    })
    // 成功返回
    ctx.state.code = 1;
    ctx.state.user = userAfterUpdate
    ctx.state.data = Object.assign({}, ctx.state.data, { user: userAfterUpdate })
    await next()
}

// @ 单后台支持多小程序 @ 更改用户信息 @ finished
async function updateUserInfo4MultiMiniProgram(ctx, next) {
    // 0.判断用户信息是否存在
    const userInfo = ctx.state.userInfo
    if (!userInfo) {
        ctx.state.code = 4
        ctx.state.message = '未解密出用户信息'
        ctx.state.data = Object.assign({}, ctx.state.data, { user: user })
        return await next()
    }

    let user = ctx.state.user
    // 1.通过 unionid 获取用户进行更新，并返回更新标识
    const key4OpenId = "openId_" + user.wxAppId
    const key4SessionKey = "sessionKey_" + user.wxAppId
    const key4Skey = "skey_" + user.wxAppId
    const key4LastVisitTime = "lastVisitTime_" + user.wxAppId

    const value4OpenId = user["wxOpenId"][user.wxAppId]
    const value4SessionKey = user["wxSessionKey"][user.wxAppId]
    const value4Skey = user["wxSkey"][user.wxAppId]
    const value4LastVisitTime = user["wxLastVisitTime"][user.wxAppId]

    let queryCondition = { unionId: userInfo.unionId }
    let isUserExist = await userModel.getOneByQuery(queryCondition)
    if (isUserExist) {
        // 成功返回
        const userAfterUpdate = await doUpdateUserInfo(value4Skey, user, queryCondition, {
            [key4OpenId]: value4OpenId,
            [key4Skey]: value4Skey,
            [key4SessionKey]: value4SessionKey,
            [key4LastVisitTime]: value4LastVisitTime,
        })
        ctx.state.code = 1;
        ctx.state.data = Object.assign({}, ctx.state.data, { user: userAfterUpdate })
        return await next()
    }
    // 2.通过 openid 获取用户进行更新，并返回更新标识
    queryCondition = { [key4OpenId]: value4OpenId }
    isUserExist = await userModel.getOneByQuery(queryCondition)
    if (isUserExist) {
        // 成功返回
        const userAfterUpdate = await doUpdateUserInfo(value4Skey, user, queryCondition, {
            unionId: userInfo.unionId,
            [key4Skey]: value4Skey,
            [key4SessionKey]: value4SessionKey,
            [key4LastVisitTime]: value4LastVisitTime,
        })
        ctx.state.code = 1;
        ctx.state.data = Object.assign({}, ctx.state.data, { user: userAfterUpdate })
        return await next()
    }
    // 3.都获取不到，不进行更新直接返回数据，并返回不更新的标识
    user = Object.assign({}, ctx.state.user, ctx.state.userInfo)
    redisUser(value4Skey, user)
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, { user: user })
    await next()
}
// @ 单后台支持多小程序 @ 数据库更改用户信息并存储到redis中 @ finished
async function doUpdateUserInfo(skey, userFromState, queryCondition, json4UpdateUserInfo) {
    const userAfterUpdate = await userModel.findOneAndUpdate(queryCondition, { $set: json4UpdateUserInfo }, { new: true })
    const user = Object.assign({}, userFromState, JSON.parse(JSON.stringify(userAfterUpdate)))
    redisUser(skey, user)
    return user
}

// @ 单后台支持多小程序 @ 数据库更改用户信息并存储到redis中 @ finished
async function redisUser(skey, user) {
    // 以 skey 为 key 将用户信息存储到 redis 中
    let expires = 7200 * 1000 // 7200s
    if (config.wechat.wxLoginExpires && !isNaN(parseInt(config.wechat.wxLoginExpires))) {
        expires = parseInt(config.wechat.wxLoginExpires) * 1000
    }
    await redis.setAsync(skey, JSON.stringify(user), 'EX', expires)
}

// @ 单后台支持多小程序 @ 解析用户信息
async function decrypteUserInfo4MultiMiniProgram(ctx, next) {
    const encryptedData = ctx.request.body.encryptedData
    if (!encryptedData) {
        return await next()
    }
    const iv = ctx.request.body.iv
    const user = ctx.state.user
    const sessionKey = user.wxSessionKey[user.wxAppId]
    // 解密
    let decryptedData;
    try {
        decryptedData = aesDecrypt(sessionKey, iv, encryptedData)
        decryptedData = JSON.parse(decryptedData);
        ctx.state.userInfo = decryptedData
    } catch (error) {
        throw new Error(`${ERRORS.ERR_IN_DECRYPT_DATA}`)
    }
    await next()
}
// @ 单后台支持多小程序 @ 解析手机号
async function decryptePhone4MultiMiniProgram(ctx, next) {
    const encryptedData = ctx.request.body.encryptedData
    if (!encryptedData) {
        return await next()
    }
    const iv = ctx.request.body.iv
    const user = ctx.state.user
    const sessionKey = user.wxSessionKey[user.wxAppId]
    // 解密
    let decryptedData;
    try {
        decryptedData = aesDecrypt(sessionKey, iv, encryptedData)
        decryptedData = JSON.parse(decryptedData);
        let phone = parseInt(decryptedData.phoneNumber)
        if (!phone) throw new Error('phone is null')
        ctx.state.phone = phone
    } catch (error) {
        throw new Error(`${ERRORS.ERR_IN_DECRYPT_DATA}`)
    }
    await next()
}
// 登录授权接口
async function login(ctx, next) {
    let user = ctx.state.user
    let isUserExist = await userModel.getOneByQuery({ openId: user.openId })
    if (isUserExist) {
        // 如果用户存在则更新
        user = await userModel.findOneAndUpdate({ openId: user.openId }, {
            $set: {
                nickName: user.nickName,
                gender: user.gender,
                language: user.language,
                city: user.city,
                province: user.province,
                country: user.country,
                avatarUrl: user.avatarUrl,
                sessionKey: user.sessionKey,
                watermark: user.watermark,
                lastVisitTime: user.lastVisitTime,
                skey: user.skey,
                unionId: user.unionId ? user.unionId : ""
            }
        })
    } else {
        user = await userModel.save({
            openId: user.openId,
            nickName: user.nickName,
            gender: user.gender,
            language: user.language,
            city: user.city,
            province: user.province,
            country: user.country,
            avatarUrl: user.avatarUrl,
            sessionKey: user.sessionKey,
            watermark: user.watermark,
            lastVisitTime: user.lastVisitTime,
            skey: user.skey,
            unionId: user.unionId ? user.unionId : ""
        })
    }

    let expires = 7200 * 1000 // 7200s
    if (config.wechat.wxLoginExpires && !isNaN(parseInt(config.wechat.wxLoginExpires))) {
        expires = parseInt(config.wechat.wxLoginExpires) * 1000
    }
    await redis.setAsync(user.skey, JSON.stringify(user), 'EX', expires)

    ctx.state.user = user
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        user: user
    })
    await next()
}

async function decrypteMobile(ctx, next) {

    let iv = ctx.request.body.iv
    let encryptedData = ctx.request.body.encryptedData

    let user = ctx.state.user
    let sessionKey = user.sessionKey

    // 解密手机号
    if (encryptedData) {
        let decryptedData;
        try {
            decryptedData = aesDecrypt(sessionKey, iv, encryptedData)
            decryptedData = JSON.parse(decryptedData);
            let phone = parseInt(decryptedData.phoneNumber)

            if (!phone) {
                throw new Error('phone is null')
            }
            ctx.state.phone = phone
        } catch (error) {
            throw new Error(`${ERRORS.ERR_IN_DECRYPT_DATA}`)
        }
    }
    await next()
}

async function updateUserPhone(ctx, next) {

    let skey = ctx.state.skey
    let user = ctx.state.user
    let phone = ctx.state.phone

    let isUserExist = await userModel.getOneByQuery({ openId: user.openId })
    if (!isUserExist) {
        throw new Error('user not Exist!')
    }

    if (!phone) {
        ctx.state.data = Object.assign({}, ctx.state.data, {
            user: user
        })
        return await next()
    }

    user = await userModel.findOneAndUpdate({ openId: user.openId }, {
        $set: {
            phone: phone
        }
    })

    let expires = 7200 * 1000 // 7200s
    if (config.wechat.wxLoginExpires && !isNaN(parseInt(config.wechat.wxLoginExpires))) {
        expires = parseInt(config.wechat.wxLoginExpires) * 1000
    }
    await redis.setAsync(user.skey, JSON.stringify(user), 'EX', expires)

    ctx.state.user = user
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        user: user
    })
    await next()
}


module.exports = {
    login4MultiMiniProgram,
    login,
    decrypteMobile,
    updateUserPhone,
    decryptePhone4MultiMiniProgram,
    decrypteUserInfo4MultiMiniProgram,
    updateUserPhone4MultiMiniProgram,
    updateUserInfo4MultiMiniProgram,
    loginNotInDB4MultiMiniProgram,
    getUserByPhone,
    linkTwoUsers
}