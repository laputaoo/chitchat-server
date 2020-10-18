//该路由是业务路由器，目前管理的业务有：登录，注册
let {Router} = require('express')
let mongoose = require('mongoose')
//引入用户模型
let dbmodel = require('../model/dbmodel')
let dbfunction = require('../db/dbfunction')
let User = dbmodel.model('User')
let Friend = dbmodel.model('Friend')
let Message = dbmodel.model('Message')
let Group = dbmodel.model('Group')
let GroupUser = dbmodel.model('GroupUser')
let GroupMessage = dbmodel.model('GroupMessage')
let time = require('../util/time')

//引入发短信文件
const sms_util = require('../util/sms_util')
const users = {}


let router = new Router()

//注册
router.post('/register', async(request,response)=>{
    //获取用户输入
    const {nick_name,phone,password} = request.body
    try{
        //检查改手机号是否注册过了
        let findResult = await User.findOne({phone})
        if(findResult){
            response.send('注册失败，手机号已被注册')
        }else{
            //创建用户
            let result = await User.create({nick_name,phone,password})
            request.session._id = result._id
            console.log(`昵称为：${nick_name},手机号为：${phone}的用户注册成功了`)
            response.send({'code': 0,'msg': '注册成功'})
        }
    }
    catch(err){
        console.log(err)
        response.send('阿偶，网络不稳定，稍后重试')
    }
}),

//密码登录
router.post('/login', function(request,response){
    //获取用户输入
    const {phone,password} = request.body
    // console.log('有人尝试登陆')      
        //检查改手机号是否注册过了
        User.findOne({phone,password},'nick_name imgUrl',function(err,result){
            if(err){
                console.log(err)
                errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                response.send('阿偶，网络不稳定，稍后重试') 
            }
            if(!result){
               //手机号不存在
                response.send({code: 1,msg: '手机号或密码不正确'}) 
            }else{
                request.session._id = result._id
                response.send({code: 0,data:result})
                console.log('昵称为:' + result.nick_name + '的用户登录成功')
            }
        })  
}),

//发送短信验证码
router.post('/message',async function(request,response){
    const{phone} = request.body
    try{
        //检查改手机号是否注册过了
        let findResult = await User.findOne({phone})
        if(findResult){
            //手机号存在，发送短信
            //生成6位验证码
            let code = sms_util.randomCode(6)
            //向指定手机发送短信
            console.log(`向${phone}发送短信验证码:${code}`)
            sms_util.sendCode(phone,code,function(success){
                if(success){
                    users[phone]  = code
                    console.log('保存验证码',phone,code)
                    response.send({code :0, msg: '短信验证码发送成功'})
                }else{
                    response.send({code: 1, msg: '短信验证码发送失败'})
                }
            })
        }else{
            //手机号不存在
            response.send({code: 1,msg: '该手机号未注册'})
        }
    }
    catch(err){
        console.log(err)
        errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
        response.send('阿偶，网络不稳定，稍后重试')
    }
}),

//短信登录
router.post('/msgLogin', async function(request,response){
    //获取用户输入
    const {phone,verifyCode} = request.body      
    try{
        //检查改手机号是否注册过了
        let findResult = await User.findOne({phone},'nick_name imgUrl')
        if(users[phone] == verifyCode){ 
            //验证码正确
            request.session._id = findResult._id
            response.send({code: 0, data: findResult})
            console.log('昵称为' + findResult.nick_name + '的用户登录成功')
            delete users[phone]
        }else{
            //验证码不正确
            response.send({code: 1,msg: '验证码错误，请重新输入'})
        }
    }
    catch(err){
        console.log(err)
        errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
        response.send('阿偶，网络不稳定，稍后重试')
    }
}),

//搜索用户并判断是否好友
router.post('/search', function(request,response){
    //获取用户输入
    const {phone,userID} = request.body   
    // console.log(phone,userID)   
        //搜索手机号
        User.findOne({phone},'nick_name imgUrl',async function(err,result){
            if(err){//数据库操作出错
                console.log(err)
                errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                response.send('阿偶，网络不稳定，稍后重试') 
            }
            if(!result){//未搜索到该用户
                response.send({code: 1,msg: '用户不存在'})
                console.log('用户不存在')
            }else{//搜索到该用户 1。取出搜索到用户的ID，2.判断是不是自己，3.判断是否好友     0(非好友) 1(是好友) 2(是自己)
                let data = JSON.parse(JSON.stringify(result))
                let friendsID = data._id
                if(userID == friendsID){//是自己，返回state为 2，
                    console.log('是自己')
                    response.send({code: 0,data: {state: 2}})
                }else{//不是自己，判断是否好友
                    // console.log({userID,friendsID})
                    let yesOrNot = await dbfunction.isfriend({userID,friendsID})
                    // console.log(yesOrNot)
                    if(yesOrNot){//是好友,返回state为1和搜索到的结果
                        data['state'] = 1
                        // console.log(data)
                        response.send({code: 0,data})
                        console.log('该用户是好友')
                    }else{//不是好友
                        data['state'] = 0
                        // console.log(data)
                        response.send({code: 0,data})
                        console.log('该用户不是好友')
                    }
                }
            }
        })
}),

//搜索用户信息
router.post('/searchApplyMsg', function(request,response){
    //获取用户输入
    const {_id} = request.body  
    // console.log({_id}) 
    User.findOne({_id},'nick_name imgUrl',function(err,result){
        if(err){//数据库操作出错
            console.log(err)
            errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
            response.send('阿偶，网络不稳定，稍后重试') 
        }
        // console.log(result)
        if(result){//搜索到该用户
            response.send({code: 0,data: result})
        }else{//未搜索到该用户
             response.send({code: 1,msg: '用户搜索出错'})
            console.log('用户搜索出错')
        }
    })
}),

//申请好友
router.post('/applyFriend', function(request,response){
    //获取用户输入
    const {userID,friendsID,application,markName} = request.body   
    // console.log({userID,friendsID,application,markName})   
        /*查询数据库
            1.查询userId和targetId，若已经存在，删除原来的两条记录，创建两条新的记录，一条设置state的状态为 1（发送中），另一条设置state的状态为 2（被请求中）
            2.若不存在，创建一条新记录
        */
       Friend.findOne({userID,friendsID},function(err,result){
            if(err){
                errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                response.send('阿偶，网络不稳定，稍后重试') 
            }
            if(!result){//未搜索到，创建两条新纪录
                console.log('未搜索到')
                let createSend = {userID,friendsID,state:1,markName}
                let createAccept = {userID:friendsID,friendsID:userID,state:2,application}
                Friend.create(createSend,function(err,result){
                    if(err){
                        response.send('阿偶，网络不稳定，稍后重试') 
                    }
                })
                Friend.create(createAccept,function(err,result){
                    if(err){
                        response.send('阿偶，网络不稳定，稍后重试') 
                    }
                })
                response.send({code: 0, msg: '已发送'}) 
                
            }else{//搜索到，更新已有记录
                console.log('已搜索到')
                let sendCondition = {userID,friendsID}
                let acceptCondition = {userID: friendsID,friendsID: userID}
                //将发送方的状态改为 1，时间更新，备注更新
                // console.log(sendCondition,acceptCondition)
                Friend.updateOne(sendCondition,{state: 1,time: new Date(),markName},function(err){
                    if(err){
                        errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                        response.send('阿偶，网络不稳定，稍后重试') 
                    }
                })
                //将接收方的状态改为 2，时间更新，申请词更新
                Friend.updateOne(acceptCondition,{state: 2,time: new Date(),application},function(err){
                    if(err){
                        errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                        response.send('阿偶，网络不稳定，稍后重试') 
                    }
                })
                response.send({code: 0, msg: '已重新发送'})    
            }
        })
}),

//搜索请求好友列表
router.post('/searchApplyFriend', function(request,response){
    //获取用户输入
    const {userID} = request.body   
    // console.log(userID) 
/*查询数据库 
    需要使用聚合管道 同时使用两个表 1.Friend表 2.用户表
    1. 先操作Friend表，通过userID,state:2,进行$match操作
    2.然后进行 $sort操作，对数组按时间倒序排列
    3.
    结构如下
    data[
        {
            userID:{}
            friendsID:{}
            application:{}
            time:{}
            friendsInfo: {
                nick_name:{}
                imgUrl: {}
            }
        },
    ] */
    Friend.aggregate([
    {
        $match: {
            'userID': mongoose.Types.ObjectId(userID),//这里ID要进行操作
            'state': '2'
        }
    },
    {
        $sort: {'time':-1}
    },
    {
        $lookup: {
            from: 'users', //这里的 User并不是数据库的表名，数据库的表名为小写加s
            localField: 'friendsID',
            foreignField: '_id',
            as: 'friendInfo'
        } 
    },
    {
        $project:{
            friendsID:1,
            application:1,
            friendInfo: 1,
            time:1,
        }
    }
    ],function(err,result){
        // console.log(result)
        if(err){
            errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
            response.send('阿偶，网络不稳定，稍后重试') 
        }else if(result != null){
            response.send({code: 0, data:result})    
        }else{
            response.send({code: 1, msg: '没有好友申请'}) 
        }
    })
}),

//接受好友请求
router.post('/confirmFriend', function(request,response){
    //获取用户输入
    const {userID,friendsID,markName} = request.body   
    // console.log({userID,friendsID,markName})   
        /*查询数据库      通过状态(0已为好友,1申请中,2被申请，3已拒绝)
            1.查询userId,targetId,state:2（被请求中），获取符合条件的结果，若没有则返回空
            2.更新userId,targetId和userID = targetID,targetID = userID 的state值，改为 0
        */
       Friend.findOne({userID,friendsID},function(err,result){
            if(err){
                errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                response.send('阿偶，网络不稳定，稍后重试') 
            }
            if(!result){//未搜索到
                console.log('未搜索到')
                response.send({code: 1, msg: '没有好友请求'})
            }else{//搜索到，更新已有记录
                console.log('已搜索到')
                let acceptCondition = {userID,friendsID}
                let sendCondition = {userID: friendsID,friendsID: userID}
                //将接受者的状态改为 0，时间更新，创建备注
                Friend.updateOne(acceptCondition,{state: 0,time: new Date(),markName},function(err){
                    if(err){
                        errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                        response.send('阿偶，网络不稳定，稍后重试') 
                    }
                })
                //将发送者的状态改为 0，时间更新
                Friend.updateOne(sendCondition,{state: 0,time: new Date()},function(err){
                    if(err){
                        errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                        response.send('阿偶，网络不稳定，稍后重试') 
                    }else{
                        response.send({code: 0, msg: '已加为好友'})  
                        console.log('已加为好友')  
                    }
                })
            }
        })
}),

//获取好友列表
router.post('/getFriendList', function(request,response){
    //获取用户输入
    const {userID} = request.body  
    // console.log({userID}) 
    Friend.aggregate([
        {
            $match: {
                'userID': mongoose.Types.ObjectId(userID),//这里ID要进行操作
                'state': '0'
            }
        },
        {
            $lookup: {
                from: 'users', //这里的 User并不是数据库的表名，数据库的表名为小写加s
                localField: 'friendsID',
                foreignField: '_id',
                as: 'friendInfo'
            }
        },
        {
            $project:{
                friendInfo: 1,
                _id: 0
            }
        }
        ],function(err,result){
            if(err){
                errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                response.send('阿偶，网络不稳定，稍后重试') 
            }else if(result != null){
                //使用reduce，生成标准数组传递前端
                let data = JSON.parse(JSON.stringify(result))
                .reduce((customers,line)=>{
                    // console.log(line.friendInfo[0])
                    customers.push(line.friendInfo[0])
                    return customers
                },[])
                // console.log(data)
                response.send({code: 0, data})    
            }else{
                response.send({code: 1, msg: '没有好友'}) 
            }
            
        })
}),

//获取个人聊天信息
router.post('/getChatMsg', async function(request,response){
    //获取用户输入
    const {userID,friendsID,page} = request.body
    let userC = userID
    let friendsC = friendsID
    let result = await Message.find({$or:[
        {userID,friendsID},
        {userID:friendsC,friendsID:userC}
    ]}).sort({'_id': -1}).limit(12).skip(12*page)
    if(result){//搜索到聊天信息
        response.send({code: 0,data: result})
    }else{//未搜索到聊天信息
        response.send({code: 1,msg: '用户搜索出错'})
        console.log('用户搜索出错')
    }
}),


//创建群
router.post('/createGroup', async function(request,response){
    //获取用户输入
    const {selectedListMsg,userMsg} = request.body
    try{
        /*检查该群是否已经创建
        1.查出userMsg._id所在的群有哪些
        2.分别取出这些群中所有的成员的id
        3.用includes方法比较这些群的成员id数组和selectedList中的id数组一致 
        */
        let userID = userMsg._id
        let grouplist = await GroupUser.find({userID},'groupID') // 查出userMsg._id所在的群有哪些
        selectedListMsg.push(userMsg)        
        // console.log(grouplist)
        if(grouplist.length > 0){//如果该用户有加群的记录
            let selectedList = []
            selectedListMsg.forEach((item)=>{
                selectedList.push(parseInt(item._id,16))
            })
            selectedList.sort(function(a,b){
                return a-b
            })            
            // console.log('selectedList------------------',selectedList) //选中用户的id
            let equalOrNot = 0  //1表示相等, 0表示不相等
            let count = grouplist.length
            grouplist.forEach(async (item)=>{//每个群
                let userList = await GroupUser.find({groupID:item.groupID},'userID') //搜索每个群中有哪些成员，把这些成员的id取出来
                let users = []
                userList.forEach((item)=>{
                    users.push(parseInt(item.userID.toString(),16)) //需要把16进制转换成十进制才能用sort排序，注意，需要把数组转换成字符串
                }) 
                users.sort(function(a,b){
                    return a-b
                })
                // console.log('users---------------------',users)
                //标记一下，此处挖坑 
                if(selectedList.length === users.length){//如果选中用户的个数等于群中用户的个数
                    let a = 0  //记录几次相等
                    for(let i=0; i<selectedList.length;i++){
                        if(selectedList[i] === users[i]){//如果选中的每一个用户id等于群中每一个用户id
                            // equalOrNot = 0       
                            a += 1                     
                        }
                    }
                    if(a === selectedList.length){ //如果相等的次数等于成员的个数，表明全等
                        equalOrNot = 1
                    }
                }else{//个数不一样
                    equalOrNot = 0
                }
                count --   
                if(count === 0){//遍历结束
                    console.log(equalOrNot)
                    if(equalOrNot){//表示之前已经创建过了
                        console.log('该群已经存在')
                        response.send('该群已经创建')
                    }else{//还没有创建过
                        console.log('可以创建')
                        //创建群表
                        let userID = userMsg._id
                        let result = await Group.create({userID})
                        // console.log(result)
                        console.log('群创建成功了')            
                        let groupID = result._id
                        let groupName
                        if(result.name == '未命名'){
                            groupName = '群聊(' + selectedListMsg.length + ')'
                        }else{
                            groupName = result.name
                        }
                        //创建群成员表
                        selectedListMsg.forEach(function(userMsg){
                            let userID = userMsg._id 
                            let name = userMsg.nick_name
                            GroupUser.create({groupID,userID,name},function(err){
                                if(err){
                                    console.log('网络错误')
                                }
                            })
                        });
                        response.send({'code': 0,'data': {groupID,groupName}})                    
                    }
                }                 
            })            
        }else{//还没有创建过
            console.log('可以创建')
            //创建群表
            let userID = userMsg._id
            let result = await Group.create({userID})
            // console.log(result)
            console.log('群创建成功了')            
            let groupID = result._id
            let groupName
            if(result.name == '未命名'){
                groupName = '群聊(' + selectedListMsg.length + ')'
            }else{
                groupName = result.name
            }
            //创建群成员表
            selectedListMsg.forEach(function(userMsg){
                let userID = userMsg._id 
                let name = userMsg.nick_name
                GroupUser.create({groupID,userID,name},function(err){
                    if(err){
                        console.log('网络错误')
                    }
                })
            });
            response.send({'code': 0,'data': {groupID,groupName}})                    
        }
    }
    catch(err){
        console.log(err)
        errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
        response.send('阿偶，网络不稳定，稍后重试')
    }
}),

//获取群消息
router.post('/getGroupChatMsg', async function(request,response){
    //获取用户输入
    const {groupID,page} = request.body
    let oldResult = await GroupMessage.find({groupID}).sort({'_id': -1}).limit(12).skip(12*page)
    let result = JSON.parse(JSON.stringify(oldResult))
    let count = result.length
    result.forEach(async (item)=>{
        let userImg = await User.findOne({_id:item.userID},'imgUrl')
        item.imgUrl = userImg.imgUrl
        count --
        if(count === 0){
            // console.log(result)    
            if(result){//搜索到聊天信息
                response.send({code: 0,data: result})
            }else{//未搜索到聊天信息
                response.send({code: 1,msg: '用户搜索出错'})
                console.log('用户搜索出错')
            }            
        }
    })

}),

//获取单聊最新信息，和未读消息数
router.post('/getSingle',function(request,response){
    /*
    1.接收前端localstorage中记录的单聊记录
    2.将每一条单聊记录中双方之间的聊天记录中state为1的全取出来，若取出的值为空，表明没有未读消息，将localstorage中没有未读消息的传入新的arr
    3.若有新的未读消息，计算出tip值，并存入新arr中
    */
    const {singleNews} = request.body
    let singleNewsList = JSON.parse(JSON.stringify(singleNews))
    let num = singleNewsList.length
    let newList = []   
    // console.log('singleNewsList-------------',singleNewsList)   
    singleNewsList.forEach(async (item)=>{
        console.log(item.friendsID,item.userID)
        let unreadNewsList = await Message.find( //搜索所有未读消息，把有未读消息的好友聊天记录下来
        {userID:item.friendsID,friendsID:item.userID,state: 1}).sort({'time': -1})                          //未读消息肯定是对方发过来的
         //这里的sort后面需要修改
        // console.log('unreadNewsList-----------',unreadNewsList)        
        if(unreadNewsList.length>0){//说明有未读消息
            let tip = unreadNewsList.length   //取出未读消息数
            // console.log('tip----------',tip)
            let lastNews =JSON.parse(JSON.stringify(unreadNewsList[0])) //取出最新未读消息
            lastNews.tip = tip   //将未读消息数放入最新未读消息中
            lastNews.time = time.dateTime(lastNews.time)
            // console.log('lastNews------------',lastNews)
            if(lastNews){
                newList.push(lastNews)  //将所有未读消息存入数组
            }
        }else{//没有未读消息，将原来localstorage中的值存入数组
            newList.push(item)
        }
        num -- 
        if(num === 0){
            // console.log(newList)
            response.send({code: 0,data: newList})
        }
    }) 
}),
//获取群聊最新信息，和未读消息数
router.post('/getGroup',function(request,response){
    /*
    1.获取用户,搜索好友表，查看该用户有多少好友,
    2.搜索单聊表，查看与每个好友的最新一条聊天信息，取出未读的信息
    */
    const {groupNews} = request.body
    let groupNewsList = JSON.parse(JSON.stringify(groupNews))
    let num = groupNewsList.length
    let newList = []
    groupNewsList.forEach(async (item)=>{
        let groupID = item.groupID
        let GMList = await GroupMessage.find({groupID}).sort({'time': -1})//查询该群所有消息
        let result = JSON.parse(JSON.stringify(GMList))
        // console.log('result------',result[0])
        // console.log('item.msgID---------',item)
        if(result){
            if(item.msgID && item.msgID != result[0]._id){//localstorage中存的消息不是最后一条，即有最新消息
                //这里msgID有可能不存在
                let oldTip = item.tip
                let index = result.findIndex(function(unit){
                    return unit._id == item.msgID
                })
                // console.log(index)
                let tip = oldTip + index  //更新tip
                item = result[0]           //将最新消息取出来
                item.time = time.dateTime(item.time)
                item.tip = tip
                newList.push(item)              
            }else{//localstorage中存的消息是最后一条，即没有最新消息
                newList.push(item) 
            }
        }else{
            console.log('网络出错')
            response.send({code: 1,msg: '网络出错'})
        }
        num -- 
        if(num === 0){
            // console.log(newList)
            response.send({code: 0,data: newList})
        }
    })
}),

//搜索群详情
router.post('/searchGroupDetail', function(request,response){
    //获取用户输入
    const {_id} = request.body  
    // console.log({_id}) 
    Group.findOne({_id},'name imgUrl',async function(err,result){
        if(err){//数据库操作出错
            console.log(err)
            errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
            response.send('阿偶，网络不稳定，稍后重试') 
        }
        if(result){//搜索到该群
            if(result.name === '未命名'){//当取出的群名是未命名时，取出该群中前五个成员的名字，组成一个群名
                let nameOrign = await GroupUser.find({groupID:_id},'name').limit(8)
                let nameList = []
                nameOrign.forEach((item)=>{
                    nameList.push(item.name)
                })
                let name = nameList.join('、')
                // console.log(name)
                result.name = name
                // console.log(result)
                response.send({code: 0,data: result})
            }else{
                response.send({code: 0,data: result})
            }
        }else{//未搜索到该群
            response.send({code: 1,msg: '群搜索出错'})
            console.log('群搜索出错')
        }
    })
}),

//清除未读消息数
router.post('/clearTip',function(request,response){
    const {userID,friendsID} = request.body
    Message.updateMany({$and:[{$or:[ //搜索所有未读消息，把有未读消息的好友聊天记录下来
        {userID:friendsID,friendsID:userID}   //未读消息肯定是对方发过来的
    ]},{state: 1}]},{state: 0},function(err,result){
        if(err){
            errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
            response.send('阿偶，网络不稳定，稍后重试') 
        }else{
            response.send({code: 0, msg: '已清除未读消息数'})  
            console.log('已清除未读消息数')  
        }
    })   
}),

//获取群列表
router.post('/getGroupList', function(request,response){
    //获取用户输入
    const {userID} = request.body 
    // console.log({userID}) 
    GroupUser.aggregate([
        {
            $match: {
                'userID': mongoose.Types.ObjectId(userID),//这里ID要进行操作,找出该用户所在那些群内
            }
        },
        {
            $lookup: {
                from: 'groups', //这里的 User并不是数据库的表名，数据库的表名为小写加s
                localField: 'groupID',
                foreignField: '_id',
                as: 'groupInfo'
            }
        },
        {
            $project:{
                groupInfo: 1,
                _id: 0
            }
        }
        ],function(err,result){
            if(err){
                response.send('阿偶，网络不稳定，稍后重试') 
            }else if(result != null){
                //使用reduce，生成标准数组传递前端
                let data = JSON.parse(JSON.stringify(result))
                .reduce((customers,line)=>{
                    // console.log(line.friendInfo[0])
                    customers.push(line.groupInfo[0])
                    return customers
                },[])
                let count = data.length
                //这里data为用户所在的所有群的详情，
                data.forEach(async (item)=>{//群表中的信息
                    let groupID = item._id
                    let groupUsers = await GroupUser.find({groupID})//群中有多少用户
                    let num = groupUsers.length - 1
                    let nameArr = []                 
                    if(item.name == '未命名'){
                        groupUsers.filter((user)=>{ //除去用户自己
                            return user.userID != userID
                        }).forEach((item)=>{//将名字推入一个数组
                            nameArr.push(item.name)
                        })
                    }
                    let name = nameArr.join('、') //将名字堆在一起
                    item.name = name
                    item.num = num
                    count -- 
                    if(count == 0){
                        // console.log(data)
                        response.send({code: 0, data})                            
                    }
                })
            }else{
                response.send({code: 1, msg: '没有好友'}) 
            }
        })
}),
module.exports = router