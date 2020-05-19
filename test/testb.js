const moment = require('moment')

let date1 = moment().subtract(1, 'days').toDate();
console.log(date1);
console.log(new Date());
