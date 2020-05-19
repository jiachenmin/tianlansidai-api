const { STS } = require('ali-oss')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

async function getSts(ctx, next) {

    let policy;
    if (config.aliyun.oss.PolicyFile) {
      policy = fs.readFileSync(path.resolve(__dirname, '../../', config.aliyun.oss.PolicyFile)).toString('utf-8');
    }
 
    const client = new STS({
      accessKeyId: config.aliyun.oss.AccessKeyId,
      accessKeySecret: config.aliyun.oss.AccessKeySecret
    });
  
    let result = await client.assumeRole(config.aliyun.oss.RoleArn, policy, config.aliyun.oss.TokenExpireTime)
    ctx.state.code = 1
    ctx.state.message = ""
    ctx.state.data = Object.assign({}, ctx.state.data, {
        AccessKeyId: result.credentials.AccessKeyId,
        AccessKeySecret: result.credentials.AccessKeySecret,
        SecurityToken: result.credentials.SecurityToken,
        Expiration: result.credentials.Expiration
    })
}

module.exports = { getSts }