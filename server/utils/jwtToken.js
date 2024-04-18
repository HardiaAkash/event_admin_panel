// Create Token and saving in cookie

const sendToken = (user, statusCode, res, isMail) => {
  const token = user.getSignedToken();

  // options for cookie
  const options = {
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
    isMail,
  });
};

module.exports = sendToken;
