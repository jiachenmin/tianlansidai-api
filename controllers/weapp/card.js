const childProxy = require('../../models/child')
const surveyResultProxy = require('../../models/survey_result')
const checkupTermProxy = require('../../models/checkup_term')
const moment = require('moment')

async function getCard(ctx, next) {
    let parent = ctx.state.user //|| {_id: "5ca496e6deaea140b4a5eecc"}
    let children = await childProxy.getByQuery({parentId: parent._id, status: 1})
    let childIds = []
    children.forEach(function (item) {
        childIds.push(item._id)
    })
    let surveyResults = await surveyResultProxy.getByQueryPopulate({status: 1, child: {$in: childIds}, businessStatus: {$gt: 3}})
    let returnResult = []
    for (let i = 0; i < surveyResults.length; i++) {
        let currentResult = surveyResults[i]
        let resultObj = {}
        for (let i = 0; i < currentResult.result.length; i++) {
            let oneCheck = currentResult.result[i]
            let termObj = await checkupTermProxy.getOneByQueryPopulate({_id: oneCheck.checkupTerm})
            if (!termObj) {
                continue;
            }
            if (!resultObj[termObj.name]) {
                resultObj[termObj.name] = []
            }
            resultObj[termObj.name].push({
                checkupTermName: termObj.name,
                checkupTermPart: termObj.part,
                value: oneCheck.value
            })
        }
        let resultArr = []
        for (let key in resultObj) {
            let left = 0.0;
            let right = 0.0;
            resultObj[key].forEach((s) => {
                if (s.checkupTermPart == 1) {
                    left = s.value;
                }
                if (s.checkupTermPart == 2) {
                    right = s.value;
                }
            })
            resultArr.push({
                checkupTermName: key,
                values: resultObj[key],
                left: left,
                right: right
            })
        }
        returnResult.push({
            time: moment(currentResult.createAt).format("YYYY年MM月DD日"),
            checkResult: resultArr,
            childName: currentResult.child.name,
            checkupType: currentResult.type
        })
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = returnResult
    return await next()
}

module.exports = {
    getCard
}