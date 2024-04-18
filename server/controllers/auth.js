const User = require("../models/User");
const Event = require("../models/Event");
const Category = require("../models/Category");
const SubCategory = require("../models/subCategory");
const ErrorResponse = require("../utils/errorRes");
const sendEmail = require("../utils/sendEmail");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateToken, verifyToken } = require("../config/jwtToken");
const sendToken = require("../utils/jwtToken");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const cheerio = require("cheerio");
const jwt = require("jsonwebtoken");
const uploadOnS3 = require("../utils/uploadImage");
const HttpStatus = {
  OK: 200,
  INVALID: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500,
  NOT_FOUND: 404,
};
const StatusMessage = {
  INVALID_CREDENTIALS: "Invalid credentials.",
  INVALID_EMAIL_PASSWORD: "Please provide email and password.",
  USER_NOT_FOUND: "User not found.",
  SERVER_ERROR: "Server error.",
  MISSING_DATA: "Please provide all necessary user details.",
  DUPLICATE_DATA: "Data already exists.",
  DUPLICATE_EMAIL: "Email already exists.",
  DUPLICATE_CONTACT: "Contact number already exists.",
  USER_DELETED: "Deleted successfully.",
  UNAUTHORIZED_ACCESS: "Unauthorized access.",
  USER_UPDATED: "User updated successfully.",
  MISSING_PAGE_PARAMS: "Please provide page number and limit.",
  SAVED_SUCC: "Saved Successfully!",
  NOT_FOUND: "Data not found.",
};
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Invalid request" });
    }

    let fileName = req.file.originalname;

    let url = await uploadOnS3(req.file.buffer, fileName);
    console.log("URL:::=>", url);
    return res.status(200).json({ status: true, url: url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.register = async (req, res, next) => {
  const { email, password, role, provider_ID, appleId } = req.body;
  if (!appleId && (!email || (!password && !provider_ID))) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ success: false, message: StatusMessage.MISSING_DATA });
  }
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res
      .status(203)
      .json({ error: "User with this email already exists." });
  }
  if (appleId) {
    const isDuplicate = await User.find({ appleId });
    //   console.log(isDuplicate);
    if (isDuplicate.length > 0) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: "Apple Id already exist." });
    }
  }

  const userData = {
    email,
    provider_ID: req.body.provider_ID,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    provider: req.body.provider,
    role,
    appleId,
  };

  if (password) {
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    userData.password = password;
  }
let isMail = false
  try {
    if (!appleId && (!provider_ID || provider_ID === "local")) {
      userData.isConfirmed = false;
      let token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      userData.confirmationToken = token;
      const resetUrl = `http://100.24.75.181:4000/auth/confirm-user/${token}`;
      const message = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  border: 1px solid #e0e0e0;
                  border-radius: 5px;
              }
              .header {
                  background-color: #f5f5f5;
                  padding: 10px;
                  border-radius: 5px 5px 0 0;
              }
              .content {
                  padding: 20px;
              }
              .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #4CAF50;
                  color: white !important;
                  text-decoration: none;
                  border-radius: 5px;
              }
              .footer {
                  background-color: #f5f5f5;
                  padding: 10px;
                  border-top: 1px solid #e0e0e0;
                  border-radius: 0 0 5px 5px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>Hell</h2>
              </div>
              <div class="content">
                  <p>Thank you for registering on Sterna platform.</p>
                  <p>In order to access your account, please click on the following link to confirm your email address:</p>
                  <p><a class="button" href="${resetUrl}">Confirm Account</a></p>
                  <p>This link will expire in <strong>7 days</strong> for security reasons.</p>
              </div>
              <div class="footer">
                  <h3>Thank you,</h3>
                  <h3>Sterna Team</h3>
              </div>
          </div>
      </body>
      </html>
      `;
      await sendEmail({
        to: userData.email,
        subject: "Account verification link",
        text: message,
      });
      isMail = true
    }
    const newUser = await User.create(userData);

    sendToken(newUser, 201, res,isMail);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
exports.confirmUser = async (req, res) => {
  const token = req.params.token;  // Ensure the route parameter name is 'token'

  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required." });
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decodedData.email, confirmationToken: token });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found or token mismatch." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { isConfirmed: true, confirmationToken: null },
      { new: true }
    );

    return res.status(200).json({ success: true, message: "User confirmed successfully.", user: updatedUser });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Attempt to delete the user if the token has expired
      try {
        const userToDelete = await User.findOneAndDelete({ confirmationToken: token });
        if (userToDelete) {
          return res.status(410).json({ success: false, message: "Confirmation period expired and account has been deleted." });
        } else {
          return res.status(404).json({ success: false, message: "No user found with the provided token." });
        }
      } catch (deleteError) {
        console.error("Error deleting user:", deleteError);
        return res.status(500).json({ success: false, message: "Failed to delete user." });
      }
    } else if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ success: false, message: "Invalid token." });
    } else {
      console.error("Confirmation error:", error);
      return res.status(500).json({ success: false, message: "An error occurred during confirmation." });
    }
  }
};



exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide an email." });
  }

  try {
    const findUser = await User.findOne({ email }).select(
      "+password +isConfirmed"
    );
    console.log(findUser);
    // Check if user is confirmed
    if (!findUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found , please register." });
    }
    if (findUser && !findUser.isConfirmed) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Please confirm your email to login.",
        });
    }

    // If user exists and is authenticated via a third-party provider
    if (findUser && !findUser.password) {
      const token = generateToken({ id: findUser._id });

      await User.findByIdAndUpdate(
        findUser._id,
        { activeToken: token },
        { new: true }
      );

      const user = {
        success: true,
        user: {
          _id: findUser._id,
          firstname: findUser.firstname,
          lastname: findUser.lastname,
          email: findUser.email,
          provider: findUser.provider,
        },
        token: token,
      };

      return res.status(200).json(user);
    }

    // If user exists and has a password, continue with password-based authentication
    if (findUser && (await findUser.matchPasswords(password))) {
      const token = generateToken({ id: findUser._id });

      await User.findByIdAndUpdate(
        findUser._id,
        { activeToken: token },
        { new: true }
      );

      const user = {
        success: true,
        user: {
          _id: findUser._id,
          firstname: findUser.firstname,
          lastname: findUser.lastname,
          email: findUser.email,
          provider: findUser.provider,
        },
        token: token,
      };

      return res.status(200).json(user);
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const findAdmin = await User.findOne({ email }).select("+password");

    if (!findAdmin) {
      throw new Error("Admin not found");
    }

    if (findAdmin.role !== "admin") {
      throw new Error("Not Authorized");
    }

    if (await findAdmin.matchPasswords(password)) {
      // sendToken(findAdmin, 201, res);
      const token = generateToken({ id: findAdmin._id });
      await User.findByIdAndUpdate(
        { _id: findAdmin._id?.toString() },
        { activeToken: token },
        { new: true }
      );
      const user = {
        success: true,
        user: {
          _id: findAdmin._id,
          firstname: findAdmin.firstname,
          lastname: findAdmin.lastname,
          email: findAdmin.email,
        },
        token: token,
      };

      return res.status(200).json(user);
    } else {
      throw new Error("Invalid Credentials");
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      token = authHeader;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Please login to access this resource" });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const userData = await User.findOne({ _id: decodedData?.id });

    if (userData.activeToken && userData.activeToken === token) {
      const user = await User.findOneAndUpdate(
        { _id: decodedData.id, activeToken: token },
        { $unset: { activeToken: "" } }, // Unset the token
        { new: true }
      );
      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid session or token, please login again" });
      }
      return res.status(200).json({
        message: `${userData._id} is Logout Successfully`,
      });
    } else {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      console.error("Other error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
  // // Clear the token cookie
  // res.clearCookie('token');

  // // Send a response indicating successful logout
  // res.status(200).json({ success: true, message: 'Logout successful' });
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json(`${email} this email is not registered`);
    }
    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `http://100.24.75.181:4000/auth/reset-password/${resetToken}`;

    const message = `
    <!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
        }
        .header {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 10px;
            border-top: 1px solid #e0e0e0;
            border-radius: 0 0 5px 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Hello ${user.firstname},</h2>
        </div>
        <div class="content">
            <p>We have received a request to reset your password for your account on <strong>Sterna</strong>. If you did not request this change, you can ignore this email and your password will not be changed.</p>
            
            <p>To reset your password, please click on the following link and follow the instructions:</p>
            
            <p><a class="button" href="${resetUrl}">Reset Password</a></p>
            
            <p>This link will expire in <strong>15 minutes</strong> for security reasons. If you need to reset your password after this time, please make another request.</p>
        </div>
        <div class="footer">
            <h3>Thank you,</h3>
            <h3>Sterna Team </h3>
        </div>
    </div>
</body>
</html>
    `;
    try {
      await sendEmail({
        to: user.email,
        subject: "Account Password Reset Link",
        text: message,
      });
      res.status(200).json({
        success: true,
        data: "Password Reset Email Sent Successfully",
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      return res
        .status(500)
        .json({ success: false, data: "Email could not be sent" });
    }
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({
      passwordResetToken: req.params.resetToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    console.log(user);
    if (!user) {
      return next(new ErrorResponse("Invalid Reset Token", 400));
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    console.log(user);
    await user.save();
    res.status(201).json({
      success: true,
      data: "Password Reset Successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyUser = async (req, res) => {
  const { token } = req.params;

  try {
    const decodedData = verifyToken(token);

    if (!decodedData) {
      return res.status(401).json({ message: "Unauthorized Access" });
    }

    const { id } = decodedData;

    const LoggedUser = await User.findOne({
      _id: id,
      activeToken: token,
    }).select("-password -activeToken");

    if (!LoggedUser) {
      return res.status(401).json({ message: "Unauthorized Access" });
    }

    return res
      .status(200)
      .json({ data: LoggedUser, message: "Verification Successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updatedUser = async (req, res) => {
  const { _id } = req.user._id;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
};

exports.getallUser = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const searchQuery = req.query.search;

    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(limit, 10);

    const userQuery = User.find();

    if (searchQuery) {
      userQuery.or([
        { firstname: { $regex: new RegExp(searchQuery, "i") } },
        { lastname: { $regex: new RegExp(searchQuery, "i") } },
        { email: { $regex: new RegExp(searchQuery, "i") } },
        { mobile: { $regex: new RegExp(searchQuery, "i") } },
      ]);
    }

    // Count total items
    const totalItems = await User.countDocuments(userQuery);

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // // Check if requested page exists
    // if (currentPage > totalPages) {
    //   throw new Error("This Page does not exist");
    // }

    const skip = (currentPage - 1) * itemsPerPage;
    const users = await userQuery
      .sort({ firstname: 1 })
      .skip(skip)
      .limit(itemsPerPage)
      .exec();

    res.json({
      totalItems,
      totalPages,
      currentPage,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getaUser = async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const getaUser = await User.findById(_id);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
};

exports.getUserById = async (req, res) => {
  const { _id } = req.body;
  validateMongoDbId(_id);

  try {
    const user = await User.findById(_id);
    res.status(200).json({
      user,
    });
  } catch (error) {
    throw new Error(error);
  }
};

exports.deleteaUser = async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { _id } = req.user._id;

    const user = await User.findById(_id).select("+password");
    // Verify the current password
    const isPasswordMatch = await user.matchPasswords(oldPassword);
    if (!isPasswordMatch) {
      return res.status(404).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Password change failed" });
  }
};

exports.fetchEvent = async (req, res) => {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    // Extract start and end dates from query parameters
    let { startDate, endDate } = req.query;

    // Default startDate to the current date if not provided
    startDate = startDate ? new Date(startDate) : new Date();

    // Default endDate to one month after the current date if not provided
    endDate = endDate ? new Date(endDate) : new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Fetch events data
    const response = await axios.get(
      "https://app.ticketmaster.com/discovery/v2/events.json",
      {
        params: {
          apikey: apiKey,
          size: 200,
        },
        headers: {
          Accept: "application/json",
          Host: "app.ticketmaster.com",
          "X-Target-URI": "https://app.ticketmaster.com",
          Connection: "Keep-Alive",
        },
      }
    );

    const events = response.data._embedded.events;

    // Filter events based on Start and End Dates
    const filteredEvents = events.filter((event) => {
      const eventStartDate = new Date(event.dates.start.dateTime);
      const eventEndDate = new Date(event.sales.public.endDateTime);

      return eventStartDate >= startDate && eventEndDate <= endDate;
    });

    let eventsAdded = 0;

    // Process and save each filtered event to the database
    for (const event of filteredEvents) {
      // Check if the event with the same name already exists
      const existingEvent = await Event.findOne({ name: event.name });

      if (!existingEvent) {
        // Extract relevant venue information
        const venueInfo = {
          country: event._embedded.venues[0].country.name,
          city: event._embedded.venues[0].city.name.trim(),
          address: event._embedded.venues[0].address.line1,
          location: event._embedded.venues[0].name,
          latitude: event._embedded.venues[0].location.latitude,
          longitude: event._embedded.venues[0].location.longitude,
        };

        // Extract segment and genre information
        // const segmentName = event.classifications[0].segment.name;
        const genreName = event.classifications[0].genre.name;

        // Save segmentName as category and genreName as subCategory
        // const category = segmentName || "Other";
        const subCategory = genreName || "Other";

        // Save to Category model if not exists
        // const categoryDocument = await Category.findOneAndUpdate({ title: category }, { title: category }, { upsert: true, new: true });

        // Save to SubCategory model if not exists
        // First, check if there's a synonym for the genre
        const findSynonyms = await Synonyms.findOne({ title: subCategory });
        let subCategoryDocument;

        if (findSynonyms) {
          subCategoryDocument = await SubCategory.findById(
            findSynonyms.subCategory
          );
        } else {
          subCategoryDocument = await SubCategory.findOneAndUpdate(
            { name: genreName },
            { $setOnInsert: { name: genreName } },
            { upsert: true, new: true }
          );
        }

        const imagesArray = event.images.map((image, index) => ({
          url: image.url,
          position: index,
        }));
        // Extract relevant event information
        const eventData = {
          name: event.name,
          description: event.info,
          startDate: event.dates.start.dateTime,
          endDate: event.sales.public.endDateTime,
          images: imagesArray,
          resource_url: event.url,
          ...venueInfo,
          event_provider: "Ticketmaster",
          category: subCategoryDocument.category,
          subCategory: subCategoryDocument._id,
          sourceCategory: segmentName,
        };

        // Save the event to the database
        await Event.create(eventData);
        console.log(`Event ${event.name} saved successfully.`);
        eventsAdded++;
      } else {
        console.error(`Event ${event.name} already exists. Skipping...`);
      }
    }

    res.status(200).json({
      message: `Filtered events saved successfully. ${eventsAdded} event(s) added.`,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
};
