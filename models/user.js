const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  admin: Boolean,
  doB: {
    type: Date,
    required: true,
  },
  salaryScale: {
    type: Number,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  annualLeave: {
    type: Number,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  leave: [
    {
      dateLeave: {
        type: String,
        required: true,
      },
      hoursLeave: {
        type: Number,
        required: true,
      },
      reason: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
