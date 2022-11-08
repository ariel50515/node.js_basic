const jwt = require('jsonwebtoken');

// 加密 終端機輸入node src\jwt01.js 
// 把加密過一大串數字貼到jwt02.js解密 
const str = jwt.sign({
    sid: 8,
    account: 'ariel'
}, 'lasdkf39485349hflskdfsdklfsk');

console.log(str)