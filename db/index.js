// 引入mongoose
let mongoose = require('mongoose')
//定义数据库名
const DB_NAME='chitChat'
//定义数据库地址
const DB_URL='localhost:27017'


module.exports = new Promise((resolve,reject)=>{
    //连接数据库
    mongoose.set('useCreateIndex', true) //加上这个
    mongoose.connect(`mongodb://${DB_URL}/${DB_NAME}`,{ useNewUrlParser: true ,useUnifiedTopology: true })
    //监听连接状态
    mongoose.connection.on('open',(err)=>{
        if(!err){
            console.log(`位于${DB_URL}上的${DB_NAME}数据库连接成功`)
            resolve()
        }else{
            reject(err)
        }
    })
})
