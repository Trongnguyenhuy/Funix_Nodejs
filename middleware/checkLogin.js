module.exports = (req, res, next) => {
    if (req.session.isLogedIn) {
      return next();
    } else {
      return res.redirect("/login");
    }
  };