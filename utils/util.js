const work = require("../models/work");

// Hàm xuất ra chuỗi Ngày-Tháng-Năm
const getFullDate = (date) => {
  let month = date.getUTCMonth() + 1;
  let day = date.getUTCDate();
  let year = date.getUTCFullYear();
  newdate = day + "/" + month + "/" + year;
  return newdate;
};

exports.getFullDate = getFullDate;

// Hàm xuất ra chuỗi Tháng - Năm
exports.getMonthAndYear = (date) => {
  let month = date.getUTCMonth() + 1;
  let year = date.getUTCFullYear();
  newdate = month + "/" + year;
  return newdate;
};

//Hàm tính thời gian giữa 2 mốc start và end, H nếu tính theo giờ, D tính theo ngày, M tính theo phút
exports.totalTime = (startTime, endTime, values) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (values === "H") {
      return parseInt((Math.abs(end - start) / (1000 * 60 * 60)) % 24);
    } else if (values === "D") {
      return parseInt((end - start) / (1000 * 60 * 60 * 24));
    } else {
      return parseInt(
        (Math.abs(end.getTime() - start.getTime()) / (1000 * 60)) % 60
      );
    }
  };

// Hàm so sánh 2 chuỗi giữa chuỗi có ký tự wildcard với chuỗi cần tìm
const Match = (str, pattern, n, m) => {
  if (m == 0) {
    return n == 0;
  }

  let lookup = new Array(n + 1).fill(false).map(() => {
    return new Array(m + 1).fill(false);
  });

  lookup[0][0] = true;

  for (let j = 1; j <= m; j++)
    if (pattern[j - 1] == "*") lookup[0][j] = lookup[0][j - 1];

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {

      if (pattern[j - 1] == "*")
        lookup[i][j] = lookup[i][j - 1] || lookup[i - 1][j];

      else if (pattern[j - 1] == "?" || str[i - 1] == pattern[j - 1])
        lookup[i][j] = lookup[i - 1][j - 1];

      else lookup[i][j] = false;
    }
  }

  return lookup[n][m];
};

exports.Match = Match;

// Hàm search theo field xuất ra mảng cần search
exports.searchProgress = (field, search, array) => {
    let outArray = [];
  
    if (field == "DayTime") {
      outArray = array.filter((item) => {
        return Match(
          item.Day, 
          search.trim(), 
          item.Day.length, 
          search.trim().length);
      });
    }
  
    if (field == "workPlace") {
      for (let i = 0; i < array.length; i++) {
        let updatedSessions = [];
  
        updatedSessions = array[i].sessions.filter((item) => {
          return Match(
            item.workPlace.toLowerCase(), 
            search.trim().toLowerCase(), 
            item.workPlace.toLowerCase().length, 
            search.trim().toLowerCase().length
            );
        });
  
        if (updatedSessions.length >= 1) {
          array[i].sessions = updatedSessions;
          outArray.push(array[i]);
        }
      }
    }
  
    return outArray;
  };


  // Hàm biến đổi results trả về từ database thành mảng với các phiên làm việc theo ngày
  // nếu month == -1 tính hết các month trong tháng
  exports.getDateWork = (results, month) => {
    let monthStart = 0;
    let monthEnd = 11;

    if (month != -1){
        monthStart = month;
        monthEnd = month;
    }

    // Chứa các ngày làm việc trong tháng
    let works = [];

    // Gom results trả về là các phiên làm việc theo ngày, tháng và lưu vào works array:
    for (let j = monthStart; j <= monthEnd; j++) {
      for (let i = 1; i < 31; i++) {
        // Biến lưu các phiên làm việc theo ngày:
        const dayWork = {
          sessions: [],
        };

        // Lọc trong result các phiên làm việc theo ngày tháng:
        let workByDay = results.filter((work) => {
          const start = new Date(work.start);
          return start.getDate() === i && start.getMonth() === j;
        });

        // Nếu như có phiên lamd việc thì tính toán các biến của ngày hôm đó dựa vào các phiên làm việc.
        if (workByDay.length > 0) {
          // Biến chứa tổng thời gian làm việc
          let totalTime = 0;
          // Biến chứa thời gian làm việc vượt mức 8h
          let overTime = 0;
          // Biến chứa thời gian đăng ký nghỉ phép trước đó.
          let hoursLeave = 0;
          // Biến chứa thời gian còn thiếu khi làm việc của một ngày
          let incomplete = 0;

          let dateLeave;

          workByDay.forEach((work) => {
            if(work.end !== null) {
              totalTime += work.totalSessionTime;
            }

            
            dateLeave = workByDay[0].leave.filter(item => {
              const dateLeave = new Date(item.dateLeave);
              const workDay =  new Date(work.Day);

              return dateLeave.toISOString() === workDay.toISOString();
            });
            
            

            if(dateLeave.length >= 1){
              hoursLeave = dateLeave[0].hoursLeave;
            }

            dayWork.sessions.push(work);
          });
          

          if (hoursLeave + totalTime < 8) {
            incomplete = 8 - (totalTime + hoursLeave);
          }

          if (hoursLeave + totalTime > 8) {
            overTime = hoursLeave + totalTime - 8;
          }

          // Lưu các tính chất của một ngày làm việc
          dayWork.Day = workByDay[0].Day;
          dayWork.totalTime = totalTime;
          dayWork.hoursLeave = hoursLeave;
          dayWork.overTime = overTime;
          dayWork.incomplete = incomplete;

          // lưu vào mảng làm việc
          works.push(dayWork);
        }
      }
    }
    return works;
  }

// Hàm nhận vào mảng cần chuck dữ liệu với số item display theo page
exports.getPagination = (item, page, array ) => {
  let arrayDisplay = [];
  const start = (page - 1) * item;
  const end = page * item >= array.length ? array.length : page * item;

  for (let i = start; i < end; i++) {
    arrayDisplay.push(array[i]);
  }

  return arrayDisplay;
}


// Hàm chuyển đổi thời gian cho mảng
exports.timeModified = (progress) => {
  return  progress.map((work) => {
    return {
      Day: work.Day,
      start: new Date(work.start),
      end: new Date(work.end),
      workPlace: work.workPlace,
      totalSessionTime: work.totalSessionTime,
      confirm: work.confirm,
      _id: work._id,
      userId: work.userId._id,
      leave: work.userId.leave,
    }
  });
}