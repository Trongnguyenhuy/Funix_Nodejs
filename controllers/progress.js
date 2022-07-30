const User = require("../models/user");
const Work = require("../models/work");
const utils = require("../utils/util");
const ITEMS_PER_PAGE = 2;

// Controller xuất ra dữ liệu khi get vào một progress của một user cụ thể
exports.getProgress = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const workerId = req.session.userId;
  const page = +req.query.page || 1;
  let totalItems = 0;

  //get các phiên làm việc từ database và sắp xếp theo ngày
  Work.find({ userId: workerId })
    .populate("userId")
    .then((results) => {
      // kiểm tra kết quả trả về nếu không có thì redirect về '/'
      if(results.length < 1) {
        return res.redirect('/');
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
        path: "/progress",
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

// Controller xử lý khi chọn lựa xem các salary theo tháng
exports.postSalary = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  let month = req.body.month;
  month = month - 1;
  const workerId = req.params.workerId;

  Work.find({ userId: workerId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let monthWork = utils.timeModified(results);
      // Biến lưu thời gian làm việc theo ngày trong Tháng tương ứng của từng worker
      monthWork = utils.getDateWork(monthWork, month);

      // Nếu không thấy kết quả redirect về tháng hiện tại.
      // Nếu tìm thấy thì tính salary
      if (monthWork.length === 0) {
        return res.redirect("/salary/" + workerId);
      } else {
        let totalOverTime = 0;
        let totalIncomplete = 0;

        monthWork.forEach((work) => {
          totalOverTime += work.overTime;
          totalIncomplete += work.incomplete;
        });

        const salaryScale = results[0].userId.salaryScale;
        const salary =
          salaryScale * 3000000 + (totalOverTime - totalIncomplete) * 200000;

        return res.render("progress/salary", {
          path: "/progress",
          pageTitle: "Salary Page",
          salary: salary,
          totalOverTime: totalOverTime,
          totalIncomplete: totalIncomplete,
          month: month + 1,
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerId: results[0].userId._id,
          workerImg: results[0].userId.imgUrl,
          workerName: results[0].userId.name,
          adminName: adminName,
          adminId: adminId,
          sort: false,
          search: false,
          field: null,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller khi get vào trang salary, xuất ra salary tháng hiện tại
exports.getSalary = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const d = new Date();
  const month = d.getMonth();
  const userId = req.params.workerId;

  Work.find({ userId: userId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let monthWork = utils.timeModified(results);
      // Biến lưu thời gian làm việc theo ngày trong Tháng tương ứng của từng worker
      monthWork = utils.getDateWork(monthWork, month);

      // lưu tổng thời gian làm thêm của 1 tháng
      let totalOverTime = 0;
      // Lưu tổng thời gian bị thiếu của một tháng
      let totalIncomplete = 0;

      monthWork.forEach((work) => {
        totalOverTime += work.overTime;
        totalIncomplete += work.incomplete;
      });

      // Tính toán salary của tháng
      const salaryScale = results[0].userId.salaryScale;
      const salary =
        salaryScale * 3000000 + (totalOverTime - totalIncomplete) * 200000;

      return res.render("progress/salary", {
        path: "/progress",
        pageTitle: "Salary Page",
        salary: salary,
        totalOverTime: totalOverTime,
        totalIncomplete: totalIncomplete,
        month: month + 1,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerId: results[0].userId._id,
        workerImg: results[0].userId.imgUrl,
        workerName: results[0].userId.name,
        adminName: adminName,
        adminId: adminId,
        sort: false,
        search: false,
        field: null,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller Search
exports.postSearch = (req, res, next) => {
  const userId = req.params.workerId;
  let search = req.body.search;
  const field = req.body.field;
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const page = +req.query.page || 1;
  let totalItems = 0;

  //Xử lý search string khi tìm kiếm bằng datetime:
  search = search.replace("/0", "/");

  if (search.startsWith("0")) {
    search = search.substring(1, search.length);
  }

  // tìm trong Database và tìm kiếm theo search string
  Work.find({ userId: userId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let works = utils.timeModified(results);
      // Xuất ra mảng có các ngày làm việc với các phiên làm việc chung theo ngày
      works = utils.getDateWork(works, -1);

      // lọc mảng làm việc theo search string có field định sẵn
      works = utils.searchProgress(field, search, works);

      // tính tổng số phần tử ngày trong progress để display ra page
      totalItems = works.length;

      // tính số phân tử sẽ được display ra page tương ứng với số item cho trước
      works = utils.getPagination(ITEMS_PER_PAGE, page, works);


      // Trả kết quả
      return res.render("progress/progress", {
        path: "/progress",
        pageTitle: "Search Page",
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
        field: field + '&search=' + search,
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
// controllers xử lý khi get vào các trang của search theo pagination link ở chân trang
exports.getSearch = (req, res, next) => {
  const userId = req.params.workerId;
  let search = req.query.search;
  const field = req.query.field;
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const page = +req.query.page || 1;
  let totalItems = 0;

  //Xử lý search string khi tìm kiếm bằng datetime:
  search = search.replace("/0", "/");

  if (search.startsWith("0")) {
    search = search.substring(1, search.length);
  }

  // tìm trong Database và tìm kiếm theo search string
  Work.find({ userId: userId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let works = utils.timeModified(results);
      // Xuất ra mảng có các ngày làm việc với các phiên làm việc chung theo ngày
      works = utils.getDateWork(works, -1);

      // lọc mảng làm việc theo search string có field định sẵn
      works = utils.searchProgress(field, search, works);

      // tính tổng số phần tử ngày trong progress để display ra page
      totalItems = works.length;

      // tính số phân tử sẽ được display ra page tương ứng với số item cho trước
      works = utils.getPagination(ITEMS_PER_PAGE, page, works);


      // Trả kết quả
      return res.render("progress/progress", {
        path: "/progress",
        pageTitle: "Search Page",
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
        field: field + '&search=' + search,
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


// Controller xử lý khi sort các phiên làm việc
exports.postSort = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const userId = req.params.workerId;
  const field = req.body.field;
  const page = +req.query.page || 1;
  let totalItems = 0;


  Work.find({ userId: userId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let works = utils.timeModified(results);

      // sort mảng làm việc theo field DayTime
      if (field === 'DayTime') {
        works = works.sort((a, b) => {
          let x = a.start;
          let y = b.start;
  
          if (x < y) {
            return -1;
          }
          if (x  > y ) {
            return 1;
          }
          return 0;
        });
      }

      // sort mảng làm việc theo field Workplace
      if(field === 'workPlace'){
        works = works.sort((a, b) => {
          let x = a.workPlace.toLowerCase();
          let y = b.workPlace.toLowerCase();
  
          if (x < y) {
            return -1;
          }
          if (x  > y ) {
            return 1;
          }
          return 0;
        });
      }


      // tính tổng số phần tử ngày trong progress để display ra page
      totalItems = works.length;

      // tính số phân tử sẽ được display ra page tương ứng với số item cho trước
      works = utils.getPagination(ITEMS_PER_PAGE, page, works);

      // Trả kết quả
      return res.render("progress/progress", {
        path: "/progress",
        pageTitle: "Sort Page",
        works: works,
        workerName: results[0].userId.name,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerId: results[0].userId._id,
        workerImg: results[0].userId.imgUrl,
        adminName: adminName,
        adminId: adminId,
        sort: true,
        search: false,
        field: field,
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

// Controller xử lý khi get vào sort theo link pagination ở chân trang.
exports.getSort = (req, res, next) => {
  const adminName = req.session.admin.name;
  const adminId = req.session.admin._id;
  const userId = req.params.workerId;
  const field = req.query.field;
  const page = +req.query.page || 1;
  let totalItems = 0;


  Work.find({ userId: userId })
    .populate("userId")
    .then((results) => {
      // biến lưu các phiên làm việc đã xử lý để thuận tiện cho việc làm việc với mảng
      let works = utils.timeModified(results);

      // sort mảng làm việc theo field DayTime
      if (field === 'DayTime') {
        works = works.sort((a, b) => {
          let x = a.start;
          let y = b.start;
  
          if (x < y) {
            return -1;
          }
          if (x  > y ) {
            return 1;
          }
          return 0;
        });
      }

      // sort mảng làm việc theo field Workplace
      if(field === 'workPlace'){
        works = works.sort((a, b) => {
          let x = a.workPlace.toLowerCase();
          let y = b.workPlace.toLowerCase();
  
          if (x < y) {
            return -1;
          }
          if (x  > y ) {
            return 1;
          }
          return 0;
        });
      }

      // tính tổng số phần tử ngày trong progress để display ra page
      totalItems = works.length;

      // tính số phân tử sẽ được display ra page tương ứng với số item cho trước
      works = utils.getPagination(ITEMS_PER_PAGE, page, works);

      // Trả kết quả
      return res.render("progress/progress", {
        path: "/progress",
        pageTitle: "Sort Page",
        works: works,
        workerName: results[0].userId.name,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerId: results[0].userId._id,
        workerImg: results[0].userId.imgUrl,
        adminName: adminName,
        adminId: adminId,
        sort: true,
        search: false,
        field: field,
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