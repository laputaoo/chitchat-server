//引入用户模型
let dbmodel = require('../model/dbmodel')
let Message = dbmodel.model('Message')
let GroupUser = dbmodel.model('GroupUser')
let GroupMessage = dbmodel.model('GroupMessage')

module.exports = function(io,client_list){
io.on('connection', function(socket){
    /*用户连接
    1.接收用户发送的信息
    2.判断client_list中是否已经存在该用户的记录，存在的话替换该条记录
    3.将发送者的id和socket存入client_list
    */    
//    console.log(socket.id)
    socket.on('login', function (userID) {    
        console.log('ID为'+userID+'的用户登录了');
        //判断该用户是否已经存在记录
        let index = client_list.findIndex(item=> item.userID == userID)
        if(index == -1){//不存在 将发送者的id和socket存入client_list
            client_list.push({
                userID,
                socket
            })
        }else{//存在 替换原有记录
            client_list.splice(index,1,{userID,socket})
        }
        // console.log(client_list.length)
    });
        /* 接收聊天信息
        1.将信息存入数据库
        2.在client_list中找接受者的socket
        3.将信息发送给接受者 */    
    socket.on('chat',function(msg){
        console.log(msg)
        let client = client_list.find(item => item.userID == msg.friendsID)
        if(client){//在client_list中发现,说明用户是存在的
            let chatMsg
            // console.log(msg.sender)
            chatMsg = {
                userID: msg.userID,
                friendsID: msg.friendsID,
                message: msg.message,
                types: msg.types,
                state: '1',
            }
            // console.log(chatMsg)
            Message.create(chatMsg,function(err,result){//将这条聊天信息的id存下来
                if(err){
                    response.send('阿偶，网络不稳定，稍后重试') 
                }else{
                    // console.log(result)
                    let reciverSK = client.socket
                    msg.msgID = result._id
                    // console.log('msg最终版  ' + msg)
                    reciverSK.emit('getChat',msg)
                }
            })
        }else{
            console.log('该用户未登录')
        }
    });

    socket.on('readed',function(msg){
        let _id = msg //取出已读信息的id
        // console.log('msgID  ' + _id)
        Message.updateOne({_id},{state: 0},function(err){
            if(err){
                response.send('阿偶，网络不稳定，稍后重试')
                console.log('更新出错') 
            }
            console.log('更新完毕')
        })
    });

    socket.on('groupChat',async function(msg){
        /*
        1.通过groupID拿到群内的成员的ID
        2.用成员的ID(除自己外)将存在client_list中的socketID拿出来,存入数组member中
        3.对数组member进行forEach遍历,将信息发出去
        */
        // console.log(msg)
        let groupID = msg.groupID
        let chatMsg
        // console.log(msg.sender)
        chatMsg = {
            userID: msg.userID,
            groupID,
            message: msg.message,
            types: msg.types,
            state: '1',
        }
        GroupMessage.create(chatMsg,async function(err,result){
            if(err){
                response.send('阿偶，网络不稳定，稍后重试') 
            }
            if(result){
                let memberDetail =await GroupUser.find({groupID})  //这里找出群中的所用成员的数据
                // memberDetail = memberDetail.filter(function(item){  //这里把群中发送者自己排除
                //     return item.userID != msg.userID
                // })
                //如果不排除自己
                // console.log(memberDetail)
                memberDetail.forEach(function(friendsMsg){ 
                    let client = client_list.find(item => item.userID == friendsMsg.userID)
                    if(client){
                        msg.msgID = result._id
                        msg.nick_name = friendsMsg.nick_name
                        let reciverSK = client.socket
                        reciverSK.emit('getGroupChat',msg)  
                        // console.log(chatMsg)
                    }else{
                        console.log('该用户不存在')
                    }
                })  
                }              
            })
    })
});    
}

