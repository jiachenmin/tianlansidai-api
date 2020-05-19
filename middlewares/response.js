const LOG = require('../common/log.js') 
const errorModel = require('../models/error.js')
/**
 * 响应处理模块
 */
module.exports = async function (ctx, next) {
    try {
        // 调用下一个 middleware
        await next()

        // 处理响应结果
        // 如果直接写入在 body 中，则不作处理
        // 如果写在 ctx.body 为空，则使用 state 作为响应
        ctx.body = ctx.body ? ctx.body : {
            code: ctx.state.code !== undefined ? ctx.state.code : -1,
            message: ctx.state.message !== undefined ? ctx.state.message : "",
            data: ctx.state.data !== undefined ? ctx.state.data : {}
        }
        // await LOG.Info({
        //     code: String(ctx.body.code),
        //     message: String(ctx.body.message),
        //   }, [__filename, ['response']])
        
    } catch (error) { // catch 住全局的错误信息
        
        let errorMessage = error && error.message ? error.message : error.toString()
        // 输出详细的错误信息
        console.log(`Catch Error: ${error} ${errorMessage} ${error.stack}`)
        ctx.status = 200
        ctx.body = {
            code: ctx.state.code !== undefined ? ctx.state.code : -1,
            message: ctx.state.message !== undefined ? ctx.state.message : errorMessage,
        }

        await LOG.Info({
            message: ctx.body.message,
            method: String(ctx.method),
            error: error.toString(),
            uuid: String(ctx.state.uuid),
            path: String(ctx.path),
            originalUrl: String(ctx.originalUrl),
            errorMessage: error.message,
            errorStack: error.stack, 
            code: String( ctx.body.code),
            query: JSON.stringify(ctx.request.query || {}),
            requestBody: JSON.stringify(ctx.request.body || {}),
            status: String(ctx.status),
            body: JSON.stringify(ctx.body)
        }, [{'fileName': __filename}])
    }
}
