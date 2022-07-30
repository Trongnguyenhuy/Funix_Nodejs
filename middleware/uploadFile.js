const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "images"));
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

module.exports = multer({ storage: fileStorage, fileFilter: fileFilter });

// module.exports = multer({ dest: 'images'});
