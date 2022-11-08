const jwt = require('jsonwebtoken');

// 終端機node src\jwt02.js 執行後解密字串
const myToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOjgsImFjY291bnQiOiJhcmllbCIsImlhdCI6MTY2NzgwOTM3MX0.O1dGQWdjd2zQUuoRAzUcqCm1KFB05YzBPaSXXpqq5Pg';

const payload = jwt.verify(myToken, 'lasdkf39485349hflskdfsdklfsk');

console.log(payload);