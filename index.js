require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const moment = require('moment-timezone');
const db = require(__dirname + '/modules/db_connect2');
const sessionStore = new MysqlStore({}, db);
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

express.ariel = '哈囉';
// const multer = require('multer');
// const upload = multer({dest: 'tmp_uploads/'});
const upload = require(__dirname + '/modules/upload-img');
const fs = require('fs').promises;

const app = express();

app.set('view engine', 'ejs');

// top-level middleware
const corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
        console.log({origin});
        callback(null, true);
    }
};
app.use(cors(corsOptions));

app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'dkddtgHSFDFJG045', //sever端的加密解密，長度不要太短
    store: sessionStore,
    cookie:{
        maxAge: 1_200_000
    }
}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(async (req, res, next)=>{
    // 自己定義的 template helper functions
    res.locals.toDateString = (d)=> moment(d).format('YYYY-MM-DD');
    res.locals.toDatetimeString = (d)=> moment(d).format('YYYY-MM-DD  HH:mm:ss');
    
    res.locals.title = '艾瑞兒的網站';
    res.locals.session = req.session;
    res.locals.auth = {}; // 預設值

    let auth = req.get('Authorization');

    if(auth && auth.indexOf('Bearer ')===0){
        auth = auth.slice(7);
        try{
            const payload = await jwt.verify(auth, process.env.JWT_SECRET);
            res.locals.auth = payload;
        }catch(ex){}
    }
    
    next();
});

// routes
app.get('/', (req, res) => {
    // res.send(`<h2>泥好</h2>`);
    res.render('main', { name: 'ariel' })
});

app.get('/sales-json', (req, res) => {
    const sales = require(__dirname + '/data/sales');
    console.log(sales);
    res.render(`sales-json`, {sales});
});

app.get('/json-test', (req, res) => {
    // res.send({ name: 'oreo', age: 30 });
    res.json({ name: 'Ariel', age: 30 });
});

app.get('/try-qs', (req, res) => {
    res.json(req.query);
});

app.post('/try-post', (req, res) => {
    res.json(req.body);
});

app.get('/try-post-form', (req, res) => {
    // res.render('try-post-form', {email:'', password:''});
    res.render('try-post-form');
});

app.post('/try-post-form', (req, res) => {
    res.render('try-post-form', req.body);
});

app.post('/try-upload', upload.single('avatar'), async (req, res) => {
    res.json(req.file);
    /*
    if(req.file && req.file.originalname){
        await fs.rename(req.file.path, `public/imgs/${req.file.originalname}`);
        res.json(req.file);
    } else {
        res.json({msg:'沒有上傳檔案'});
    }
    */
});

app.post('/try-upload2', upload.array('photos'), async (req, res) => {
    res.json(req.files);
});

app.get('/my-params1/:action?/:id?', async (req,res) => {
    res.json(req.params);
});

app.use(express.static('public'));
app.use(express.static('node_modules/bootstrap/dist'));

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
    let u = req.url.slice(3);
    u = u.split('?')[0]; // 去掉 query string
    u = u.split('-').join('');
    res.json({mobile: u});
});

app.use('/admin2', require(__dirname + '/routes/admin2'));

const myMiddle = (req, res, next) => {
    res.locals = {...res.locals, ariel:'hello'};
    res.locals.derrr = 567;
    // res.myPersonal = {...res.locals, shinder:'哈囉'}; // 不建議
    next();
};

app.get('/try-middle', [myMiddle], (req, res) => {
    res.json(res.locals);
});

app.get('/try-session', (req, res)=>{
    req.session.aaa ||= 0; // 預設值 php會是布林值，JS不是
    req.session.aaa++;
    res.json(req.session);
});

app.get('/try-date', (req, res) => {
    const now = new Date;
    const m = moment();

    res.send ({
        t1: now,
        t2: now.toString(),
        t3: now.toDateString(),
        t4: now.toLocaleString(),
        m:m.format('YYYY-MM-DD HH:mm:ss')
    });
});

app.get('/try-moment', (req, res)=>{
    const fm = 'YYYY-MM-DD HH:mm:ss';
    const m = moment('06/10/22', 'DD/MM/YY');
    res.json({
        m,
        m1: m.format(fm),
        m2: m.tz('Europe/London').format(fm)
    });
});

app.get('/try-db', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM address_book LIMIT 5')
    res.json(rows);
});

app.get('/try-db-add', async (req, res)=>{
    const name = '艾瑞兒';
    const email = 'ariel@gmail.com';
    const mobile = '0918555666';
    const birthday = '2005-10-27';
    const address = '台北市';
    const sql = 'INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?, ?, ?, ?, ?, NOW())';

    const [result] = await db.query(sql, [name, email, mobile, birthday, address]);
    res.json(result);

    // const [result] = await db.query(sql, [name, email, mobile, birthday, address]);
    // res.json({insertId, affectRows});
});

app.get('/try-db-add2', async (req, res)=>{
    const name = 'yonna';
    const email = 'link@gmail.com';
    const mobile = '0918555666';
    const birthday = '1998-10-27';
    const address = '宜蘭縣';
    const sql = 'INSERT INTO `address_book` SET ?';

    const [result] = await db.query(sql, [{name, email, mobile, birthday, address, created_at: new Date()}]);
    res.json(result);
});

app.use('/ab',  require(__dirname + '/routes/address-book') );

app.get('/fake-login', (req, res) => {
    req.session.admin = {
        id: 12,
        account: 'ariel',
        nickname: 'oreo'
    };
    res.redirect('/');
});
app.get('/logout', (req, res) => {
    delete req.session.admin;
    res.redirect('/');
});

app.get('/yahoo', async (req, res)=>{
    const response = await axios.get('https://tw.yahoo.com/');
    res.send(response.data);
});

app.get('/cate', async (req, res)=>{
    const [rows] = await db.query('SELECT * FROM categories');

    const firsts = [];
    for(let i of rows){
        if(i.parent_sid===0){
            firsts.push(i);
        }
    }

    for(let f of firsts){
        for(let i of rows){
            if(f.sid===i.parent_sid){
                f.children ||= [];
                f.children.push(i)
            }
        }
    }


    res.json(firsts);
});


app.get('/cate2', async (req, res)=>{
    const [rows] = await db.query('SELECT * FROM categories');

    const dict = {};
    // 編輯字典
    for(let i of rows){
        dict[i.sid] = i;
    }

    for(let i of rows){
        if(i.parent_sid!=0){
            const p = dict[i.parent_sid];
            p.children ||= [];
            p.children.push(i);
        }
    }

    // 把第一層拿出來
    const firsts = [];
    for(let i of rows){
        if(i.parent_sid===0){
            firsts.push(i);
        }
    }

    res.json(firsts);
});

app.post('/login-api', async (req, res) => {
    const output = {
        success: false,
        error: '密碼錯誤',
        postData: req.body, //除錯用
        auth: {}
    };

    const sql = "SELECT * FROM admins WHERE account=?";
    const [rows] = await db.query(sql, [req.body.account]);

    if(! rows.length){
        return res.json(output);
    }
    const row = rows[0];

    output.success = await bcrypt.compare(req.body.password, row['password_hash']);
    if(output.success){
        output.error = '';
        const {sid, account, admin_group} = row;
        const token = jwt.sign({sid, account, admin_group}, process.env.JWT_SECRET);
        output.auth = {
            sid,
            account,
            token
        }
    } 
    res.json(output);
});

// ------------------------------------------------
app.use(express.static('public'));
app.use(express.static('node_modules/bootstrap/dist'));
// ------------------------------------------------

app.use((req, res) => {
    // res.type('text/plain'); // 純文字
    res.status(404).render('404')
});

const port = process.env.SERVER_PORT || 3002;
app.listen(port, () => {
    console.log(`server started, port: ${port}`);
});