//该模块负责用户模型

//
let mongoose = require('mongoose')

//
let Schema = mongoose.Schema

//用户表
let userSchema = new Schema({ 
    nick_name:{
        type: String,
        required: true,
    },
    phone:{
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    birth: {//生日
        type: Date
    },
    time: {//注册时间
        type: Date,
        default: Date.now
    },
    sex: {
        type: String,
    },
    imgUrl: { //头像
        type: String,
        default: 'user.png'
    },
    enable_flag: {
        type: String, 
        default: 'Y'
    }
})

//好友表
let friendsSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId, //用户ID
    },
    friendsID: {
        type: Schema.Types.ObjectId,  //好友ID
    },
    markName: {                                  //备注名
        type:String
    },
    state:{                                      //通过状态(0已为好友,1申请中,2被申请，3已拒绝)
        type: String, 
    },
    application: {                               //申请词
        type: String,
    },
    time: {//注册时间
        type: Date,
        default: Date.now
    },
})

//一对一消息表
let messageSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,  //发送ID
    },
    friendsID: {
        type: Schema.Types.ObjectId,  //接收ID
    },
    message: {                                   //消息
        type: String
    },
    types:{                                      //消息类型(0文字，1图片，2音频)
        type: String,
    },
    time: {                                      //发送时间
        type: Date,
        default: Date.now
    },
    state: {
        type: Number,                            //发送状态(0 已读,1 未读)
    }
})

//群表
let groupSchema = new Schema({
    userID: { 
        type: Schema.Types.ObjectId,  //群主ID
    },
    name: {                                      //群名
        type: String,
        default: '未命名'
    },
    imgUrl: {                                    //群头像
        type: String,
        default: 'group.png'
    },
    notice:{                                      //群公告
        type: String,
        default: '未设置公告'
    },
    time: {                                      //创建时间
        type: Date,
        default: Date.now
    },
})

//群成员表
let groupUserSchema = new Schema({
    groupID: {
        type: Schema.Types.ObjectId,  //群ID
    },
    userID: {
        type: Schema.Types.ObjectId, //成员ID
    },
    name: {                                      //群内名
        type: String,
    },
    time: {                                      //加入时间
        type: Date,
        default: Date.now
    },
    tip: {
        type: Number,                             //未读消息数
        default: 0
    },
    shield: {                                     //是否屏蔽该群(0 不屏蔽 ，1 屏蔽)
        type: Number,
        default: 0
    }
})

//群消息表
let groupMessageSchema = new Schema({
    groupID: {
        type: Schema.Types.ObjectId,  //群ID
    },
    userID: {
        type: Schema.Types.ObjectId,  //发送者ID
    },
    message: {                                   //消息
        type: String
    },
    types:{                                      //消息类型(0文字，1图片，2音频)
        type: String,
    },
    time: {                                      //发送时间
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('User',userSchema)
module.exports = mongoose.model('Friend',friendsSchema,)
module.exports = mongoose.model('Message',messageSchema,)
module.exports = mongoose.model('Group',groupSchema,)
module.exports = mongoose.model('GroupUser',groupUserSchema,)
module.exports = mongoose.model('GroupMessage',groupMessageSchema,)