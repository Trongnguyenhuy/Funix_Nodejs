const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const User = require("../models/user");
const Work = require("../models/work");
const Covid = require("../models/covid");

const utils = require("../utils/util");
const ITEMS_PER_PAGE = 2;

// Controller xử lý khi get vào trang add User của admin
exports.getAddUser = (req, res, next) => {
  const userId = req.session.userId;

  User.findById(userId)
    .then((user) => {
      return res.render("admin/add-User", {
        path: "/admin/add-user",
        pageTitle: "Add User",
        isAdmin: req.session.userAdmin,
        isAuthenticated: req.session.isLogedIn,
        user: user,
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

// Controller xử lý khi post dữ liệu từ trang add user và tiến hành lưu vào database
exports.postAddUser = (req, res, next) => {
  const name = req.body.employee;
  const salaryScale = req.body.salaryScale;
  const department = req.body.department;
  const annualLeave = req.body.annualLeave;
  const img = req.file;
  
  let doB = req.body.doB;
  doB = new Date(doB);

  const user = new User({
    name: name,
    doB: doB.toISOString(),
    salaryScale: salaryScale,
    department: department,
    annualLeave: annualLeave,
    imgUrl: img.path,
    admin: false,
    email: "",
    password: "",
  });
  user
    .save()
    .then((result) => {
      console.log(result);
      res.redirect("/admin/add-user");
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xác nhận giờ làm việc
exports.getConfirm = (req, res, next) => {
  const confirmId = req.query.confirmId;
  const workerId = req.params.workerId;

  Work.findById(confirmId)
    .then((work) => {
      if (work.confirm === false) {
        work.confirm = true;
        return work.save();
      } else {
        return work;
      }
    })
    .then((result) => {
      const url = "/admin/progress-manager/" + workerId;
      res.redirect(url);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xoá phiên làm việc
exports.getDelete = (req, res, next) => {
  const confirm = req.query.confirm;
  const workerId = req.params.workerId;
  const deleteId = req.query.deleteId;

  if (confirm === "false") {
    Work.findByIdAndDelete(deleteId)
      .then((result) => {
        const url = "/admin/progress-manager/" + workerId;
        return res.redirect(url);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    const url = "/admin/progress-manager/" + workerId;
    return res.redirect(url);
  }
};


// Controller xử lý khi admin muốn xem ngày làm việc theo tháng
exports.postAdminMonthView = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const workerId = req.params.workerId;
  const month = req.body.month - 1;
  const page = +req.query.page || 1;
  let totalItems = 0;

  // tìm trong Database và tìm kiếm theo search string
  Work.find({ userId: workerId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let works = utils.timeModified(results);
      // Xuất ra mảng có các ngày làm việc với các phiên làm việc chung theo ngày
      works = utils.getDateWork(works, parseInt(month));

      // tính tổng số phần tử ngày trong progress để display ra page
      totalItems = works.length;

      // tính số phân tử sẽ được display ra page tương ứng với số item cho trước
      works = utils.getPagination(ITEMS_PER_PAGE, page, works);

      // Trả kết quả
      return res.render("progress/progress", {
        path: "/progress",
        pageTitle: results[0].userId.name,
        result: works,
        workerName: results[0].userId.name,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerId: results[0].userId._id,
        workerImg: results[0].userId.imgUrl,
        adminName: adminName,
        adminId: adminId,
        sort: false,
        search: true,
        field: month,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        prevPage: page - 1,
        nextPage: page + 1,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi admin muốn xem phiên làm việc theo tháng bằng linhk pagination ở chân trang
exports.getAdminMonthView = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const workerId = req.params.workerId;
  let month = req.query.field;
  const page = +req.query.page || 1;
  let totalItems = 0;

  // tìm trong Database và tìm kiếm theo search string
  Work.find({ userId: workerId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let works = utils.timeModified(results);
      // Xuất ra mảng có các ngày làm việc với các phiên làm việc chung theo ngày
      works = utils.getDateWork(works, parseInt(month));

      // tính tổng số phần tử ngày trong progress để display ra page
      totalItems = works.length;

      // tính số phân tử sẽ được display ra page tương ứng với số item cho trước
      works = utils.getPagination(ITEMS_PER_PAGE, page, works);

      // Trả kết quả
      return res.render("progress/progress", {
        path: "/progress",
        pageTitle: results[0].userId.name,
        result: works,
        workerName: results[0].userId.name,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerId: results[0].userId._id,
        workerImg: results[0].userId.imgUrl,
        adminName: adminName,
        adminId: adminId,
        sort: false,
        search: true,
        field: month,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        prevPage: page - 1,
        nextPage: page + 1,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi admin muốn xem dữ liệu covid
exports.getCovidManager = (req, res, next) => {
  Covid.find()
    .populate("userId")
    .then((results) => {
      return res.render("covid/covid-manager", {
        path: "/covid",
        pageTitle: "Covid Manager",
        users: results,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCovidManagerReport = (req, res, next) => {
  const userId = req.params.workerId;
  const reportName = "report-" + userId + ".pdf";
  const reportPath = path.join("data", "reports", reportName);

  Covid.findOne({ userId: userId })
    .populate("userId")
    .then((covid) => {
      if (!covid) {
        return res.redirect("/covid-manager");
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename:"' + reportName + '"'
      );

      const pdfdoc = new PDFDocument();

      pdfdoc.pipe(fs.createWriteStream(reportPath));
      pdfdoc.pipe(res);

      pdfdoc
        .font("fonts/VNTIME.TTF")
        .fontSize(26)
        .text("Covid Report: " + covid.userId.name);

      pdfdoc.text("---------------------------------------------");

      pdfdoc.moveDown().fontSize(14).text("Vaccination: ", {
        underline: true,
      });

      if (covid.vaccination.length > 0) {
        pdfdoc
          .moveDown()
          .text("Fist vaccine type: " + covid.vaccination[0].first.vaccineType);
        pdfdoc.text(
          "Fist Injected Date: " +
            covid.vaccination[0].first.dateInject.toLocaleString()
        );
        pdfdoc.text(
          "Second vaccine type: " + covid.vaccination[0].second.vaccineType
        );
        pdfdoc.text(
          "Second Injected Date: " +
            covid.vaccination[0].second.dateInject.toLocaleString()
        );
      } else {
        pdfdoc.moveDown().text("Fist vaccine type: NaN");
        pdfdoc.text("Fist Injected Date: NaN");
        pdfdoc.moveDown().text("Second vaccine type: NaN");
        pdfdoc.text("Second Injected Date: NaN");
      }

      pdfdoc.fontSize(20).text("---------------------------------------------");

      pdfdoc.moveDown().fontSize(14).text("Body Temperature Checkin: ", {
        underline: true,
      });

      if (covid.temperature.length > 0) {
        covid.temperature.forEach((item, index) => {
          index += 1;
          pdfdoc.moveDown().text("Checkin " + index + " :");
          pdfdoc.text("Temperature: " + item.temp + "oC");
          pdfdoc.text("Checkin Date: " + item.dateAndTime.toLocaleString());
        });
      } else {
        pdfdoc.moveDown().text("Checkin: NaN");
        pdfdoc.text("Temperature: NaN");
        pdfdoc.text("Checkin Date: NaN");
      }

      pdfdoc.fontSize(20).text("---------------------------------------------");

      pdfdoc.moveDown().fontSize(14).text("Covid Infection: ", {
        underline: true,
      });

      if (covid.infection.length > 0) {
        covid.infection.forEach((item, index) => {
          index += 1;
          pdfdoc.moveDown().text("Checkin " + index + " :");
          pdfdoc.text("Find At: " + item.howToFind);
          pdfdoc.text("Found Date: " + item.date.toLocaleString());
        });
      } else {
        pdfdoc.moveDown().text("Checkin: NaN");
        pdfdoc.text("Find At: NaN");
        pdfdoc.text("Found Date: NaN");
      }

      pdfdoc.end();
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller kiểm soát xuất ra dữ liệu khi get vào trang tiến trình làm việc (progress)
exports.getProgressManager = (req, res, next) => {
  User.find()
    .then((users) => {
      return res.render("progress/progress-manager", {
        path: "/progress-manager",
        pageTitle: "Progress Managerment",
        workers: users,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProgressManagerDetail = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const workerId = req.params.workerId;
  const page = +req.query.page || 1;
  let totalItems = 0;

  //get các phiên làm việc từ database và sắp xếp theo ngày
  Work.find({ userId: workerId })
    .populate("userId")
    .then((results) => {
      // Kiểm tra kết quả trả về nếu không có redirect về '/'
      if (results.length < 1) {
        return res.redirect("/admin/progress-manager");
      }

      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let works = utils.timeModified(results);
      // Biến lưu các phiên làm việc được sắp xếp theo ngày tháng
      // kèm theo các đặc tính của ngày

      works = utils.getDateWork(works, -1);

      // tính tổng số phần tử ngày trong progress để display ra page
      totalItems = works.length;

      // tính số phân tử sẽ được display ra page tương ứng với số item cho trước
      works = utils.getPagination(ITEMS_PER_PAGE, page, works);

      return res.render("progress/progress", {
        path: "/progress-manager",
        pageTitle: results[0].userId.name,
        result: works,
        workerId: results[0].userId._id,
        workerImg: results[0].userId.imgUrl,
        workerName: results[0].userId.name,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        adminName: adminName,
        adminId: adminId,
        sort: false,
        search: false,
        field: null,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        prevPage: page - 1,
        nextPage: page + 1,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
