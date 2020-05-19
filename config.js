const env = process.env;
let config = {
    name: 'azureRibbonApi',
    host: '0.0.0.0',
    port: 3000,
    jwt: {
        secret: 'XZ*@7xi3^aSfd',
        expires: 60 * 60 * 24 // 24小时过期
    },
    wechat: {
        // TLSD普查报告小程序
        "wx91bf0f7a528dafe5": {
            appSecret: 'b74c2cf16437af6c5eefaa2046a0a029',
        },
        // 微信小程序 App ID
        appId: 'wx16cdc62d6cb425b9',
        // 微信小程序 App Secret
        appSecret: '2922af4df9f5f799cd42c17967afdf6d',
        // 微信登录态有效期
        wxLoginExpires: 7200,
    },
    offiaccount: {
        // 微信公众号 App ID
        appId: 'wxb5d799965c32b6af',
        // 微信公众号 App Secret
        appSecret: 'ab17fe9ed4c24e5edae24f9fe447b510',
        token: "TLSD0OFFICIAL0ACCOUNT",
        // 微信登录态有效期
        wxLoginExpires: 7200,
    },
}


if (process.env.NODE_ENV === 'prod') {

    config = Object.assign({}, config, {
        consul: {
            host: 'localhost',
            port: 8500
        },
        mongodb: {
            connStr: "mongodb://azureRibbon:BbBb123456@dds-uf6d081e3dd296341.mongodb.rds.aliyuncs.com:3717,dds-uf6d081e3dd296342.mongodb.rds.aliyuncs.com:3717/azureRibbon?replicaSet=mgset-13153713",
            options: {
                useNewUrlParser: true
            }
        },
        redis: {
            host: 'r-uf6eb7aa1d273bc4.redis.rds.aliyuncs.com',
            port: 6379,
            password: 'BbBb123456',
            db: 0,
            no_ready_check: true,
        },
        aliyun: {
            AccessKeyId: 'LTAIqL2eMNfHguIX',
            AccessKeySecret: 'jBrOqvHZzfxt4nJqQPajBlxX0REywE',
            oss: {
                AccessKeyId: 'LTAIqL2eMNfHguIX',
                AccessKeySecret: 'jBrOqvHZzfxt4nJqQPajBlxX0REywE',
                RoleArn: 'acs:ram::1921452913146669:role/oss-sts',
                // 建议 Token 失效时间为 1 小时
                TokenExpireTime: '3600',
                PolicyFile: 'policy/all_policy.txt',
                region: 'oss-cn-shanghai',
                bucket: 'azure-ribbon-images',
                visitUrl: 'https://images.tianlansidai.com/'
            },
            log: {
                AccessKeyId: 'LTAIqL2eMNfHguIX',
                AccessKeySecret: 'jBrOqvHZzfxt4nJqQPajBlxX0REywE',
                region: 'cn-shanghai',
                project: 'azure-ribbon',
                logstore: 'azure-ribbon',
            }
        },
    })
} else if (process.env.NODE_ENV === 'test') {
    config = Object.assign({}, config, {
        mongodb: {
            connStr: "mongodb://azureRibbon:BbBb123456@dds-uf691895e84d76c41.mongodb.rds.aliyuncs.com:3717,dds-uf691895e84d76c42.mongodb.rds.aliyuncs.com:3717/azureRibbon?replicaSet=mgset-14978635",
            options: {
                useNewUrlParser: true
            }
        },
        redis: {
            host: 'r-uf6przw38mikykm8fo.redis.rds.aliyuncs.com',
            port: 6379,
            password: 'BbBb123456',
            db: 0,
            no_ready_check: true,
        },
        aliyun: {
            AccessKeyId: 'LTAIgOczS5gdzo54',
            AccessKeySecret: 'RDlGdh5is9WZzAag0pL53YgKZITXEF',
            oss: {
                AccessKeyId: 'LTAIgOczS5gdzo54',
                AccessKeySecret: 'RDlGdh5is9WZzAag0pL53YgKZITXEF',
                RoleArn: 'acs:ram::1921452913146669:role/oss-sts',
                // 建议 Token 失效时间为 1 小时
                TokenExpireTime: '3600',
                PolicyFile: 'policy/all_policy.txt',
                region: 'oss-cn-shanghai',
                bucket: 'azure-ribbon-images-test',
                visitUrl: 'https://images-test.tianlansidai.com/'
            },
            log: {
                AccessKeyId: 'LTAIgOczS5gdzo54',
                AccessKeySecret: 'RDlGdh5is9WZzAag0pL53YgKZITXEF',
                region: 'cn-shanghai',
                project: 'azure-ribbon-test',
                logstore: 'azure-ribbon-test',
            }
        },
    })
} else if (process.env.NODE_ENV === 'dev') {
    config = Object.assign({}, config, {
        mongodb: {
            connStr: "mongodb://azureRibbon:BbBb123456@101.132.105.233:3717/azureRibbon",
            options: {
                useNewUrlParser: true
            }
        },
        redis: {
            host: '101.132.105.233',
            port: 6379,
            password: 'BbBb123456',
            db: 0,
            no_ready_check: true,
        },
        aliyun: {
            AccessKeyId: 'LTAIgOczS5gdzo54',
            AccessKeySecret: 'RDlGdh5is9WZzAag0pL53YgKZITXEF',
            oss: {
                AccessKeyId: 'LTAIgOczS5gdzo54',
                AccessKeySecret: 'RDlGdh5is9WZzAag0pL53YgKZITXEF',
                RoleArn: 'acs:ram::1921452913146669:role/oss-sts',
                // 建议 Token 失效时间为 1 小时
                TokenExpireTime: '3600',
                PolicyFile: 'policy/all_policy.txt',
                region: 'oss-cn-shanghai',
                bucket: 'azure-ribbon-images-test',
                visitUrl: 'https://images-test.tianlansidai.com/'
            },
            log: {
                AccessKeyId: 'LTAIgOczS5gdzo54',
                AccessKeySecret: 'RDlGdh5is9WZzAag0pL53YgKZITXEF',
                region: 'cn-shanghai',
                project: 'azure-ribbon-test',
                logstore: 'azure-ribbon-test',
            }
        },
    })
}

module.exports = config


