module.exports = {
    ERRORS: {
        // 初始化错误
        ERR_WHEN_INIT_SDK: 'ERR_WHEN_INIT_SDK',
        ERR_INIT_SDK_LOST_CONFIG: 'ERR_INIT_SDK_LOST_CONFIG',
        ERR_WHEN_INIT_MYSQL: 'ERR_WHEN_INIT_MYSQL',

        // 腾讯云代小程序登录
        ERR_REQUEST_PARAM: 'ERR_REQUEST_PARAM',

        // 授权模板错误
        ERR_HEADER_MISSED: 'ERR_HEADER_MISSED',
        ERR_GET_SESSION_KEY: 'ERR_GET_SESSION_KEY',
        ERR_IN_DECRYPT_DATA: 'ERR_IN_DECRYPT_DATA',
        ERR_SKEY_INVALID: 'ERR_SKEY_INVALID',

        // COS 模块错误
        ERR_REQUEST_LOST_FIELD: 'ERR_REQUEST_LOST_FIELD',
        ERR_UNSUPPORT_FILE_TYPE: 'ERR_UNSUPPORT_FILE_TYPE',
        ERR_FILE_EXCEEDS_MAX_SIZE: 'ERR_FILE_EXCEEDS_MAX_SIZE',

        // 信道服务错误
        ERR_REMOTE_TUNNEL_SERVER_ERR: 'ERR_REMOTE_TUNNEL_SERVER_ERR',
        ERR_REMOTE_TUNNEL_SERVER_RESPONSE: 'ERR_REMOTE_TUNNEL_SERVER_RESPONSE',
        ERR_UNKNOWN_TUNNEL_ERROR: 'ERR_UNKNOWN_TUNNEL_ERROR',
        ERR_UNLOGIN: 'ERR_UNLOGIN',
        ERR_INVALID_RESPONSE: 'ERR_INVALID_RESPONSE',

        // 数据库错误
        DBERR: {
            ERR_WHEN_INSERT_TO_DB: 'ERR_WHEN_INSERT_TO_DB',
            ERR_NO_SKEY_ON_CALL_GETUSERINFOFUNCTION: 'ERR_NO_SKEY_ON_CALL_GETUSERINFOFUNCTION'
        }
    },
    // SURVEY_STATUS: ['无普查任务', '请打印二维码', '结果分析中', '查看普查结果', '待领取公益补贴券', '已领取公益补贴券'],
    SURVEY_STATUS: ['无普查任务', '请打印二维码', '结果分析中', '查看普查结果', '待领取公益补贴券', '领取普查报告'],
    LOGIN_STATE: {
        SUCCESS: 1, // 登陆成功
        FAILED: 0 // 登录失败
    },
    weapp: { //小程序后端
        survey: { //文件名
            addChildren: { //函数名
                icon: "头像不合法！",
                name: "名字不合法！",
                gender: "性别不合法！",
                // studentCode: "学籍号码不合法！",
                identityCode: "身份证信息不合法！",
                schoolId: "学校id不合法！",
                parentId: "家长id不合法！",
                questionnaireId: "问卷id不合法！",
				questionnaireResult:"问卷结果不合法!"
            },
            deleteChild: {
                childId: "宝贝id不合法！"
            },
            childInfo: {
                childId: "宝贝id不合法！"
            },
			getCheckCount: {
				surveyId: "任务id不合法！"
			}
        },
        collect: {
            addCollect: {
                artile: "收藏的文章id不合法！"
            },
            deleteCollect: {
                collectId: "收藏id不合法！"
            },
            getCollect: {},
            articleInfo: {
                articleId: "文章id不合法！"
            }
        },
        home: {
            getColumnArticle: {
                columnId: "栏目id不合法！"
            }
        }
    }
}