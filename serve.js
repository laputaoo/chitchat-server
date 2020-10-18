//引入express
let express = require('express')
//引入数据库连接模块
let db = require('./db/index')
//引入express-session用于在express中操作session
let session =require('express-session')
//引入业务路由
let businessRouter = require('./router/businessRouter')
//引入UI路由
let uiRouter = require('./router/uiRouter')
//创建app服务对象
let app = express()

//设置允许跨域
app.all('*', function(req, res, next) {  
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    // res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials","true");    
    res.header("X-Powered-By",' 3.2.1')
    next();  
});


let http = require('http').createServer(app);

let io = require('socket.io')(http);



//引入connect-mongo用于session持久化
const MongoStore = require('connect-mongo')(session)

//配置cookie和session组合使用的配置对象
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: '12345', //参与加密的字符串(又称签名)
    cookie: {
        maxAge: 1000*60*60*24 //设置cookie的过期时间
    },
}))

let client_list = []

//数据库连接成功后，注册路由
db.then(()=>{
    //express没有解析json字符串的功能，加上下面这条
    app.use(express.json())
    //使用内置中间件用于获取post请求体参数
    app.use(express.urlencoded({extended: true}))
    //使用UI路由中间件
    app.use(uiRouter)
    //使用业务路由中间件
    app.use(businessRouter)
    //使用websocket
    require('./socket/socket')(io,client_list)

}).catch((error)=>{
    console.log(error)
})

//设置监听
http.listen(3000,(err)=>{
    if(!err) console.log('服务器启动成功')
    else console.log(err)
})