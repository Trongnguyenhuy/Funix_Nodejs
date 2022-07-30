module.exports = (req, res, next) => {
  if (req.session.userAdmin) {
    return next();
  } else {
    return res.redirect("/");
  }
};
