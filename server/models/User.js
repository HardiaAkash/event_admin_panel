const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "Please Enter Firstname"],
    },
    lastname: {
      type: String,
      // required: [true, "Please Enter Lastname"],
    },
    email: {
      type: String,
      // required: [true, "Please Enter Email Address"],
      unique: true,
    },
    mobile: {
      type: String,
    },
    password: {
      type: String,
      // required: [true, "Please Enter Password"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      default: "user",
    },
    refreshToken: {
      type: String,
    },
    provider: {
      type: String,
      default: "local",
    },
    provider_ID: {
      type: String,
    },
    activeToken: {
      type: String
    },
    isConfirmed:{
      type:Boolean,
      default:true
    },
    appleId:{
      type:String,
      default:null
    },
    confirmationToken: {
      type: String,
      default:null
    },
    favoriteEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FavoriteEvent", // Reference to the FavoriteEvent model
      },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPasswords = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.passwordResetToken = resetToken;
  this.passwordResetExpires = Date.now() + 25 * 60 * 1000; // 25 minutes
  return resetToken;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
