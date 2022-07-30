const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// tạo schema Covid chứa temperature, Vaccine và infection
const covidSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  temperature: [
    {
      temp: {
        type: Number,
      },
      dateAndTime: {
        type: String,
      },
    },
  ],
  vaccination: [
    {
      first: {
        vaccineType: String,
        dateInject: String,
      },
      second: {
        vaccineType: String,
        dateInject: String,
      },
    }
  ],
  infection: [
    {
      howToFind: String,
      date: String,
    },
  ],
});

module.exports = mongoose.model("Covid", covidSchema);
