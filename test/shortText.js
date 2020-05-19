const stringUtil = require('../common/stringUtil')
const moment = require('moment')
var str = '5cbfd153246b2c6fe0a6a87e'

const str64 = stringUtil.str16ToStr64(str)

console.log(str.length, str);
console.log(str64.length, str64);

const infoFromObjectId = stringUtil.getInfoFromObjectId(str);


console.log(infoFromObjectId)