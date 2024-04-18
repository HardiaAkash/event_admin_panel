const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  register,
  login,
  adminLogin,
  logout,
  forgotPassword,
  resetPassword,
  getallUser,
  getaUser,
  getUserById,
  deleteaUser,
  updatedUser,
  updatePassword,
  fetchEvent,
  uploadImage,
  verifyUser,
  confirmUser
} = require("../controllers/auth");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/fetchEvents").get(fetchEvent);

router.route("/login").post(login);

router.route("/adminLogin").post(adminLogin);

router.route("/logout").get(isAuthenticatedUser, logout);

router.route("/verifyUserToken/:token").get(verifyUser)

// Create User
router.route("/register").post(register);
//
router.route("/confirm/:token").get(confirmUser)
// Update User Password
router.post("/updatePassword", isAuthenticatedUser, updatePassword);

// Update User
router.put("/edit-user", isAuthenticatedUser, updatedUser);

// Get all Users
router.get("/all-users", isAuthenticatedUser, authorizeRoles("admin"), getallUser);

// Get a User
router.route("/getaUser").get(isAuthenticatedUser, getaUser);

// Get user by ID 
router.route("/getUserById").post(isAuthenticatedUser, getUserById);

// Delete a user
router.delete("/deleteaUser/:id",isAuthenticatedUser, authorizeRoles("admin"), deleteaUser);

router.route("/forgotpassword").post(forgotPassword);
router.route("/resetpassword/:resetToken").put(resetPassword);

router.route("/uploadImage").post(isAuthenticatedUser, authorizeRoles("admin"), upload.single('file'),uploadImage)

module.exports = router;