
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

const comparePassword = async (
  password,
  hashedPassword
) => {
  return bcrypt.compare(
    password,
    hashedPassword
  );
};

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};

