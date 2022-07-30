const User = require("../models/user");
const utils = require("../utils/util");
const fileHelper = require("../utils/fileHelper");


// Controller xử lý khi get vào trang thông tin cá nhân
exports.getInformation = (req, res, next) => {
  const workerId = req.session.userId;

  return User.findById(workerId)
    .then((user) => {
      return res.render("infor/infor", {
        path: "/information",
        pageTitle: user.name +  " Information",
        doB: user.doB,
        worker: user,
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi get vào trang thông tin chi tiết của từng cá nhân
exports.getEditInformation = (req, res, next) => {
  const workerId = req.params.workerId;

  User.findById(workerId)
    .then((user) => {
      return res.render("infor/edit-infor", {
        path: "/information",
        pageTitle: user.name + ' Edit Information',
        worker: user,
        doB: utils.getFullDate(user.doB),
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

//Controller xử lý khi post từ trang thông tin cá nhân, thay đổi avatar đại diện
exports.postEditInformation = (req, res, next) => {
  const workerId = req.params.workerId;
  const img = req.file;


  User.findById(workerId)
    .then((user) => {
      
        if(img){
          fileHelper.deleteFile(user.imgUrl);
          const imgUrl = img.path;
          user.imgUrl = imgUrl;
        }

        return user.save();
    }).then(result => {
      
        res.redirect('/information');
    })
    .catch((err) => {
        console.log(err);
    });
};
