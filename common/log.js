const SLS = require('./sls.js')
const config = require('../config.js')


class Log {
    async Info(content = {}, tags = []) {
        let projectName = config.aliyun.log.project
        let logstoreName = config.aliyun.log.logstore
        let options = {}
        let data = {
            logs: [{
                timestamp: Math.floor(new Date().getTime()/1000),
                content: Object.assign({}, {
                    __NODE_ENV__: String(process.env.NODE_ENV || ''),
                    __from__: 'azure-ribbon-api',
                }, content)
            }],
            // env: process.env.NODE_ENV?String(process.env.NODE_ENV):"",
            tags: tags.concat([{'appName': 'azure-ribbon-api'}])
        }
        await SLS.postLogStoreLogs(projectName, logstoreName, data, options)
    }
}

module.exports = new Log()