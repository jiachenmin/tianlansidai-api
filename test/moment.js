
const moment = require('moment')

console.log(moment().format())
console.log((moment().add(1, 'd')).format())

const expireSeconds = moment(1575003865000).diff(moment(1574744665000).add(1, 'd'), "second")
console.log(expireSeconds)