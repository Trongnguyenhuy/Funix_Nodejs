const User = require("../models/user");
const Admin = require("../models/admin");

exports.getLogin = (req, res, next) => {
    return res.render("index", {
      path: "/login",
      pageTitle: "Login page",
      isAuthenticated: req.session ? req.session.isLogedIn: false,
      isAdmin: req.session ? req.session.userAdmin : false,
    });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        if (user.password.toString() === password.toString()) {
          
          req.session.isLogedIn = true;
          req.session.userId = user._id;
          req.session.userAdmin = user.admin;

          return User.findOne({ admin: true })
            .then(admin => {
              req.session.admin = admin;
            })
            .then(result => {
              return res.redirect("/");
            })
            .catch((err) => {
              console.log(err);
            });
            
        } else {
          return res.redirect("/login");
        }
      } else {
        return res.redirect("/login");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/login");
  });
};
