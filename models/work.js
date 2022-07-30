const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const workSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    Day: {
      type: String,
      required: true,
    },
    workPlace: {
      type: String,
    },
    start: {
      type: String,
    },
    end: {
      type: String,
    },
    confirm: Boolean,
    totalSessionTime: Number,
  }
);

module.exports = mongoose.model("Work", workSchema);
