let dbmodel = require('../model/dbmodel')
// let User = dbmodel.model('User')
let Friend = dbmodel.model('Friend')
let Message = dbmodel.model('Message')
module.exports = {
    //是否朋友
    isfriend: async function({userID,friendsID}){
        try{
            let result = await Friend.findOne({userID,friendsID})
            if(result && result.state == 0){//是好友
                    console.log('是好友')
                    return true
                }else{//不是好友
                    console.log('不是好友')
                    return false
                }
            }
        catch(err){
            console.log(err)
            errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
            response.send('阿偶，网络不稳定，稍后重试')
        }
    },
    //未读消息数
    unreadCount: async function({userID,friendsID}){
            try{
                let result = await Message.find({userID,friendsID,state:1})
                return result.length
            }catch(err){
                console.log(err)
                errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
                response.send('阿偶，网络不稳定，稍后重试')
            }
    },
    //好友请求数
    applyCount: async function({userID}){
        try{
            let result = await Message.find({userID,state:2})
            return result.length
        }catch(err){
            console.log(err)
            errMsg.networkErr = '阿偶，网络不稳定，稍后重试'
            response.send('阿偶，网络不稳定，稍后重试')
        }
    }
}
