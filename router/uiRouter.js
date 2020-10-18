//该路由是UI路由

let {Router} = require('express')

//引入用户模型
let dbmodel = require('../model/dbmodel')
let User = dbmodel.model('User')
let router = new Router()

//UI路由
//自动登录

/*初始化主页 1.获取未读信息数 2.获取未读群信息数 3.获取好友请求数 4.获取最后一条信息 5.获取群最后一条信息数
  使用聚合管道进行多个表的关联查询
  一.涉及到的表为 1.Friend表 2.Message表 3.GroupMessage表
*/

router.get('/login',async(request,response)=>{
    //取出请求中cookie的id值
    const {_id} = request.session
    // 查询
    let result = await User.findOne({_id})
    if(result){ //如果有
        response.send({code: 0, data: result})
    }else{ //如果没有
        response.send({code: 1, data: '请先登录'})
    }
})

module.exports = router