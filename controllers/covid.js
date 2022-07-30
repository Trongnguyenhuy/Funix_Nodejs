const User = require("../models/user");
const Covid = require("../models/covid");

// Controller xử lý khi get vào trang do nhiệt độ
exports.getTemperature = (req, res, next) => {
  const workerId = req.session.userId;

  User.findById(workerId)
    .then((user) => {
      return res.render("covid/temperature", {
        path: "/covid",
        pageTitle: "Body Temperature",
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerName: user.name,
        workerId: workerId,
        workerImg: user.imgUrl,
        temp: null,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi post vào trang do nhiệt độ
exports.postTemperature = (req, res, next) => {
  const temp = req.body.temp;
  const workerId = req.session.userId;
  
  let dateAndTime = req.body.dateAndTime;
  dateAndTime = new Date(dateAndTime);

  Covid.findOne({ userId: workerId })
    .populate("userId")
    .then((results) => {
      // Nếu như có kết quả, tức có userId trên database trong collection, chỉ cần push dữ liệu vào
      // array theo dõi nhiệt độ
      if (results) {
        results.temperature.push({
          temp: temp,
          dateAndTime: dateAndTime.toISOString(),
        });
        return results.save();
      } else {
        // nếu chưa tạo thì tạo mới
        const covid = new Covid({
          userId: workerId,
          temperature: [
            {
              temp: temp,
              dateAndTime: dateAndTime.toISOString(),
            },
          ],
        });
        return covid.save();
      }
    })
    .then((result) => {
      return Covid.findOne({ userId: workerId }).populate("userId");
    })
    .then((covid) => {

      return res.render("covid/temperature", {
        path: "/covid",
        pageTitle: "Body Temperature",
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerName: covid.userId.name,
        workerId: workerId,
        workerImg: covid.userId.imgUrl,
        temperature: temp,
        temp: covid,
        dateAndTime: dateAndTime.toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh'})
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi get vào trang đăng ký vaccine
exports.getVaccination = (req, res, next) => {
  const workerId = req.session.userId;

  User.findById(workerId)
    .then((user) => {
      return res.render("covid/vaccination", {
        path: "/covid",
        pageTitle: "Vaccination",
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerName: user.name,
        workerId: workerId,
        workerImg: user.imgUrl,
        vaccination: null,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi post từ trang vaccine vào server, tiến hành lưu dữ liệu vào database
exports.postVaccination = (req, res, next) => {
  const type1 = req.body.type1;
  const type2 = req.body.type2;
  const date1 = new Date(req.body.date1);
  const date2 = new Date(req.body.date2);
  const workerId = req.session.userId;

  Covid.findOne({ userId: workerId })
    .populate("userId")
    .then((result) => {
      // Nếu như có kết quả, tức có userId trên database trong collection, chỉ cần push dữ liệu vào
      if (result) {
        // Nếu như có dữ liệu covid nhưng chưa lưu vaccine thì tiến hành lưu
        // Nếu đã có dữ liệu thì không lưu
        if (result.vaccination.length === 0) {
          const vaccination = {
            first: {
              vaccineType: type1,
              dateInject: date1.toISOString(),
            },
            second: {
              vaccineType: type2,
              dateInject: date2.toISOString(),
            },
          };
          
          result.vaccination = vaccination;
          return result.save();
        } else {
          return res.redirect('/covid/vaccination');
        }
      } else {
        // nếu chưa có thì tạo mới
        const covid = new Covid({
          userId: workerId,
          vaccination: [
            {
              first: {
                vaccineType: type1,
                dateInject: date1.toISOString(),
              },
              second: {
                vaccineType: type2,
                dateInject: date2.toISOString(),
              },
            },
          ],
        });
        return covid.save();
      }
    })
    .then((covid) => {
      if(covid){
        let vaccination = covid.vaccination;

        vaccination = vaccination.map(item => {
          return {
            first: {
              type: item.first.vaccineType,
              date: new Date(item.first.dateInject)
            },
            second: {
              type: item.second.vaccineType,
              date: new Date(item.second.dateInject)
            },
          }
        });
        return res.render("covid/vaccination", {
          path: "/covid",
          pageTitle: "Vaccination",
          isAuthenticated: req.session.isLogedIn,
          isAdmin: req.session.userAdmin,
          workerName: covid.userId.name,
          workerId: workerId,
          workerImg: covid.userId.imgUrl,
          vaccination: vaccination[0],
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi post dữa liệu từ trang nhiễm bệnh vào server, tiến hành lưu thông tin vào database
exports.postInfection = (req, res, next) => {
  const howToFind = req.body.howToFind;
  const date = new Date(req.body.date);
  const workerId = req.session.userId;

  Covid.findOne({ userId: workerId })
    .populate("userId")
    .then((result) => {
      // Nếu như có kết quả, tức có userId trên database trong collection, chỉ cần push dữ liệu vào
      if (result) {
        result.infection.push({
          howToFind: howToFind,
          date: date.toISOString(),
        });
        return result.save();
      } else {
        // nếu chưa có thì tạo mới
        const covid = new Covid({
          userId: workerId,
          infection: [
            {
              howToFind: howToFind,
              date: date.toISOString(),
            },
          ],
        });
        return covid.save();
      }
    })
    .then((covid) => {
      return res.render("covid/infection", {
        path: "/covid",
        pageTitle: "Covid Infection",
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerName: covid.userId.name,
        workerId: workerId,
        workerImg: covid.userId.imgUrl,
        infection: covid,
        howToFind: howToFind,
        date: date.toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh'}).split(', ')[0]
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Controller xử lý khi get vào trang đăng ký nhiễm bệnh
exports.getInfection = (req, res, next) => {
  const workerId = req.session.userId;

  User.findById(workerId)
    .then((user) => {
      return res.render("covid/infection", {
        path: "/covid",
        pageTitle: "Covid Infection",
        isAuthenticated: req.session.isLogedIn,
        isAdmin: req.session.userAdmin,
        workerName: user.name,
        workerId: workerId,
        workerImg: user.imgUrl,
        infection: null,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
