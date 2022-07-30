const Work = require("../models/work");
const User = require("../models/user");
const utils = require("../utils/util");

// Controller khi get vào index
exports.getIndex = (req, res, next) => {
  const user = req.session.userId;
  
    return res.render("index", {
      pageTitle: "Workers App",
      path: "/",
      isAuthenticated: false,
      isAdmin: false,
    });
};

// Controller khi get vào trang điểm danh
exports.getStart = (req, res, next) => {
  const workerId = req.session.userId;
  let worker = {};

  // Tìm kiếm phiên làm việc theo theo userId mà user chưa kết thúc
  Work.findOne({ userId: workerId, end: null })
    .populate("userId")
    .then((result) => {
      // nếu chưa kết thúc thì render ra giao diện để user kết thúc nó
      if (result) {
        return res.render("works/start", {
          path: "/checking",
          pageTitle: "Working...",
          disabled: true,
          workerName: result.userId.name,
          start: result.start.toLocaleString(),
          workPlace: result.workPlace,
          status: "Working...",
          workId: result._id,
          workerImg: result.userId.imgUrl,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
        });
      } else {
        // nếu không tìm thấy thì render ra giao diện bắt đầu điểm danh cho user điểm danh
        User.findById(workerId)
          .then((user) => {
            return res.render("works/start", {
              pageTitle: "Start Working",
              disabled: false,
              path: "/checking",
              status: "Resting...",
              isAuthenticated: req.session.isLogedIn,
              isAdmin: req.session.userAdmin,
              workerName: user.name,
              workerImg: user.imgUrl,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi bắt đầu điểm danh, lưu phiên làm việc vào database, end time để trống
exports.postStart = (req, res, next) => {
  const workPlace = req.body.workPlace;
  const start = new Date();
  const workerId = req.session.userId;
  let imgUrl = "";
  let workerName = "";
  let admin = false;
  // tìm phiên làm việc theo id và kết thúc nó
  User.findById(workerId)
    .then((user) => {
      const work = new Work({
        userId: user._id,
        workPlace: workPlace,
        start: start.toISOString(),
        end: null,
        confirm: false,
        Day: start.toISOString().split(', ')[0],
      });

      imgUrl = user.imgUrl;
      workerName = user.name;
      admin = user.admin;

      return work.save();
    })
    .then((work) => {
      res.render("works/start", {
        path: "/checking",
        pageTitle: "Working...",
        disabled: true,
        workerName: workerName,
        start: start.toLocaleString(),
        workPlace: workPlace,
        status: "Working...",
        workId: work._id,
        workerImg: imgUrl,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller Kết thúc điểm danh, ghi nhận kết quả
exports.postEnd = (req, res, next) => {
  const workId = req.params.workId; // lưu workId
  const d = new Date();

  //Tìm trong Work và tiến hành kết thúc
  Work.findById({ _id: workId })
    .then((work) => {
      // nếu đã có ghi lại trong database và end đã được điền thì chỉ return work để trả về các phiên
      // làm việc trong ngày
      if (work && work.end !== null) {
        return work;
      } else {
        // nếu chưa kết thúc thì end tại thời điểm hiện tại
        // vì có thể làm thêm giờ nên không nhất thiết end ở 17h
        work.end = d.toISOString();
        work.totalSessionTime = utils.totalTime(work.start, work.end, "H");
        return work.save();
      }
    })
    .then((work) => {
      const url = "/end/" + work.userId;
      return res.redirect(url);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller Kết thúc điểm danh, ghi nhận kết quả
exports.getEnd = (req, res, next) => {
  const workerId = req.params.workerId;
  const d = new Date();
  // Sau đó xuất ra kết quả của User các lần điểm danh trong ngày

  Work.find({ userId: workerId })
    .populate("userId")
    .then((results) => {
      // Nếu không tìm thấy thì redirect về /progress
      if (results.length <= 0) {
        return res.redirect("/");
      }
      // tìm Index  của sesion cuối trong ngày
      const lastSession = results.length - 1;

      // Mảng lưu các lần đăng nhập hôm nay
      let progress = results.filter((work) => {
        return work.Day === d.toLocaleString().split(', ')[1];
      });

      let totalWorking = 0;

      progress.forEach((work) => {
        totalWorking += work.totalSessionTime;
      });

      progress = progress.map((work) => {
        return {
          Day: work.day,
          Start: new Date(work.start),
          End: new Date(work.end),
          WorkPlace: work.workPlace,
          TotalSessionTime: work.totalSessionTime,
        }
      });

      const lastStartTime = new Date(results[lastSession].start);
      const lastEndTime = new Date(results[lastSession].end);

      return res.render("works/end", {
        pageTitle: "Resting...",
        path: "/checking",
        workerName: results[lastSession].userId.name,
        start: lastStartTime.toLocaleString(),
        end: lastEndTime.toLocaleString(),
        total: totalWorking,
        status: "Resting...",
        progress: progress,
        workerImg: results[lastSession].userId.imgUrl,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi đăng ký nghỉ phép, lưu vào database
exports.postLeave = (req, res, next) => {
  const startDay = new Date(req.body.startDay); // mang ngày bắt đầu nghỉ
  const endDay = new Date(req.body.endDay); // mang ngày cuối cùng nghỉ
  const dateLeave = endDay.getDate() - startDay.getDate(); // số ngày nghỉ
  const hoursLeave1 = req.body.hoursLeave1; // số tiếng nghỉ của ngày bắt đầu
  const hoursLeave2 = req.body.hoursLeave2; // số tiếng nghỉ của ngày kết thúc
  const reason = req.body.reason; // nguyên nhân nghỉ
  const workerId = req.params.workerId; // mang Id của worker khác nhau
  let hoursLeave = 0; // số giờ muốn nghỉ

  // tìm, tính toán, cập nhật annualLeave trong database
  User.findById(workerId)
    .then((user) => {
      // Kiểm tra điều kiện nhập của 2 ngày bắt đầu và kết thúc có đúng không
      // nếu ngày bắt đầu lớn hơn ngày kết thúc => sai ngày
      if (endDay < startDay) {
        return res.render("works/leave", {
          path: "/checking",
          pageTitle: "Write Leave",
          message: "Wrong date, please try again!",
          disabled: false,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerName: user.name,
          workerImg: user.imgUrl,
        });
      }
      // nếu ngày bắt đầu rơi vào cuối tuần => sai ngày
      if (startDay.getDay() === 0 || startDay.getDay() === 6) {
        return res.render("works/leave", {
          path: "/checking",
          pageTitle: "Write Leave",
          message: "Wrong date, don't write leave in Weekend!",
          disabled: false,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerName: user.name,
          workerImg: user.imgUrl,
        });
      }
      // nếu ngày  kết thúc rơi vào cuối tuần => sai ngày
      if (endDay.getDay() === 0 || endDay.getDay() === 6) {
        return res.render("works/leave", {
          path: "/checking",
          pageTitle: "Write Leave",
          message: "Wrong date, don't write leave in Weekend!",
          disabled: false,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerName: user.name,
          workerImg: user.imgUrl,
        });
      }
      // nếu nghỉ một ngày thì trường bắt đầu và kết thúc phải trùng cả ngày lẫn giờ đăng ký nghỉ
      if (
        req.body.endDay == req.body.startDay &&
        parseInt(hoursLeave2) != parseInt(hoursLeave1)
      ) {
        return res.render("works/leave", {
          path: "/",
          pageTitle: "Write Leave",
          message: "Wrong date, please try again!",
          disabled: false,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerName: user.name,
          workerImg: user.imgUrl,
        });
      }

      // Tính tổng số giờ đăng ký nghỉ
     

      if (parseInt(dateLeave) === 0) {
        hoursLeave = parseInt(hoursLeave1);
      } else if (parseInt(dateLeave) === 1) {
        hoursLeave = parseInt(hoursLeave1) + parseInt(hoursLeave2);
      } else if (parseInt(dateLeave) >= 2) {
        hoursLeave =
          parseInt(hoursLeave1) +
          parseInt(hoursLeave2) +
          8 * (parseInt(dateLeave) - 1);
      }
      // Kiểm tra trên database có đăng ký trùng ngày đã đăng ký nghỉ phép trước đó không
      let oldLeave = user.leave.filter((item) => {
        return (
          item.dateLeave === utils.getFullDate(startDay) ||
          item.dateLeave === utils.getFullDate(endDay)
        );
      });

      if (oldLeave.length > 0) {
        return user;
      }

      // Kiểm tra điều kiện annualLeave
      let annualLeave = user.annualLeave; // số ngày nghỉ trong năm

      // nếu số ngày nghỉ phép trong năm băng 0
      if (parseFloat(annualLeave) * 8 === 0) {
        return res.render("works/leave", {
          path: "/checking",
          pageTitle: "Write Leave",
          message: "You have zero days left!",
          disabled: false,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerName: user.name,
          workerImg: user.imgUrl,
        });
      }
      // nếu số giờ nghỉ phép còn lại ít hơn số giờ đăng lý
      if (parseFloat(annualLeave) * 8 < hoursLeave) {
        return res.render("works/leave", {
          path: "/checking",
          pageTitle: "Write Leave",
          message: "You have fewer annual Leave than you want!",
          disabled: false,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerName: user.name,
          workerImg: user.imgUrl,
        });
      }

      // Tiến hành cập nhập annualLeave vào database
      annualLeave = (parseFloat(annualLeave) * 8 - hoursLeave) / 8;

      // Tiến hành lưu thông tin của leave theo ngày vào Database theo các trường hợp,
      // Tiến hành render ra dữ liệu khi thành công
      //+ trường hợp trùng ngày bắt đầu và kết thúc
      const leave = [];
      if (
        req.body.endDay == req.body.startDay &&
        parseInt(hoursLeave2) == parseInt(hoursLeave1)
      ) {
        leave.push({
          dateLeave: utils.getFullDate(startDay),
          hoursLeave: hoursLeave1,
          reason: reason,
        });
      }

      //+ trường hợp ngày đầu và ngày kết thúc cách nhau 1 ngày
      if (parseInt(dateLeave) === 1) {
        leave.push({
          dateLeave: utils.getFullDate(startDay),
          hoursLeave: hoursLeave1,
          reason: reason,
        });

        leave.push({
          dateLeave: utils.getFullDate(endDay),
          hoursLeave: hoursLeave2,
          reason: reason,
        });
      }

      //+ trường hợp ngày đầu và ngày kết thúc cách nhau hơn 2 ngày
      if (parseInt(dateLeave) >= 2) {
        leave.push({
          dateLeave: utils.getFullDate(startDay),
          hoursLeave: hoursLeave1,
          reason: reason,
        });

        leave.push({
          dateLeave: utils.getFullDate(endDay),
          hoursLeave: hoursLeave2,
          reason: reason,
        });

        for (let i = 1; i <= parseInt(dateLeave) - 1; i++) {
          let month = startDay.getUTCMonth() + 1;
          let day = startDay.getUTCDate() + i;
          let year = startDay.getUTCFullYear();
          leave.push({
            dateLeave: day + "/" + month + "/" + year,
            hoursLeave: 8,
            reason: reason,
          });
        }
      }

      user.annualLeave = annualLeave;

      leave.forEach((item) => {
        user.leave.push(item);
      });

      return user.save();
    })
    .then((user) => {
      return res.render("works/leave-success", {
        path: "/checking",
        pageTitle: "Leave Success",
        startDay: utils.getFullDate(startDay),
        endDay: utils.getFullDate(endDay),
        reason: reason,
        hoursLeave: hoursLeave,
        remainAnnualLeave: user.annualLeave,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerName: user.name,
        workerImg: user.imgUrl,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi get vào đăng ký nghỉ phép
exports.getLeave = (req, res, next) => {
  const workerId = req.session.userId;
  User.findById(workerId)
    .then((user) => {
      return res.render("works/leave", {
        path: "/checking",
        pageTitle: "Write Leave",
        message: false,
        disabled: false,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerName: user.name,
        workerImg: user.imgUrl,
        annualLeave: user.annualLeave,
        workerId: user._id,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
