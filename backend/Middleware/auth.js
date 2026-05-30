const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");

const auth = async (req, res, next) => {
  const authHeader =
    req?.headers?.Authorization ||
    req?.headers?.authorization ||
    req?.headers?.apikey;
  let token = "";
  // console.log({ authHeader });
  if (
    authHeader &&
    (authHeader.startsWith("Bearer ") || authHeader.startsWith("Token "))
  ) {
    const candidate = authHeader.split(" ")[1];
    // console.log({ candidate });
    const user = await User.findOne({ apiToken: candidate });
    // console.log({ user });

    if (user) {
      token = jwt.sign(
        { userId: user._id, userType: user.userType },
        process.env.JWT_SECRET,
      );
    } else {
      token = candidate;
    }
  } else {
    token = req.header("x-auth-token");
  }

  if (!token)
    return res
      .status(401)
      .json({ msg: "No authentication token, authorization denied." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    // console.log({ verified });

    next();
  } catch {
    return res
      .status(401)
      .json({ msg: "Token verification failed, authorization denied." });
  }
};

module.exports = auth;
