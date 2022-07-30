const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);

const workRoutes = require('./routes/work');
const adminRoutes = require('./routes/admin');
const covidRoutes = require('./routes/covid');
const inforRoutes = require('./routes/infor');
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');

const uploadFile = require('./middleware/uploadFile');


const MONGODB_URI = "mongodb+srv://nguyenhuytrong:yf1PGyescm7705cF@cluster0.boagr.mongodb.net/test";

const app = express();
const store = MongoDbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(uploadFile.single('image'));

app.use(express.static(path.join(__dirname, "public")));
app.use('/images',express.static(path.join(__dirname, "images")));

app.use(session({
  secret: "npm start",
  resave: false,
  saveUninitialized: false,
  store: store,
}));


app.use('/admin',adminRoutes);
app.use(workRoutes);
app.use('/covid',covidRoutes);
app.use(inforRoutes);  
app.use(progressRoutes);
app.use(authRoutes);


//Kết nối với mongodb bằng mongoose
mongoose
  .connect(
    MONGODB_URI
  )
  .then((result) => {
    console.log('connect success!');
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });