exports.dateTime = function(d){
        let old = new Date(d)
        let now = new Date()
        //获取时间戳
        let oldTime = old.getTime()
        let nowTime = now.getTime()
        //定义分钟 小时 天
        let mm = 1000 * 60
        let hh = mm * 60
        let DD = hh * 24
        // 获取老的时间
        let Y = old.getFullYear()
        let M = old.getMonth()
        let D = old.getDate()
        let h = old.getHours()
        
        let m = old.getMinutes()
        let w = old.getDay()
         // 获取新的时间
        let NY = now.getFullYear()
        let NM = now.getMonth()
        let ND = now.getDate()
         //逻辑部分
         //计算时间差
         let timeDifferent = nowTime - oldTime
        //  console.log(timeDifferent+ '时间差')
         if(Y === NY && M === NM && D === ND){ // 一天以内
            if(h<10){
                h = '0' + h
            }
            if(m<10){
                m = '0' + m
            }
            if(h<12){
                
                return '上午' + h + ':' + m
            }else{
                return '下午' + (h-12) + ':' + m
            }
         }
         //计算当前时间当天的时间戳
         let timeAera = now.getTimezoneOffset()*1000*60
         let todayTimeStamp = nowTime%DD - timeAera
        //  console.log(nowTime + ' 现在时间戳')
        //  console.log(todayTimeStamp + ' 当天时间戳')
        //  console.log(timeAera)
         //计算相差一天,用时间差减去当天的时间戳再减去一天的时间戳
        //  console.log(DD + ' 一天的时间戳')
         let oneDayDif = timeDifferent - todayTimeStamp - DD
        //  console.log(oneDayDif + ' 昨天')
         //计算相差七天，用时间差减去当天的时间戳再减去六天的时间戳（相差大于一天小于七天）
         let weekDif = timeDifferent - todayTimeStamp - DD*6
        //  console.log(weekDif)
         if(todayTimeStamp<timeDifferent && oneDayDif <= 0){ //昨天
            return '昨天'
         }else if(weekDif <= 0){ //相差七天以内
             switch(w){
                case 0:
                    return '星期天'
                case 1:
                    return '星期一'
                case 2:
                    return '星期二'
                case 3:
                    return '星期三'
                case 4:
                    return '星期四'
                case 5:
                    return '星期五'
                case 6:
                    return '星期六'
             }
         }else{ // 相差七天以上
            return Y + '/' + (M+1) + '/' + D
         }
    }
