const bcrypt = require("bcryptjs");
const User = require("./models/User");
const mongoose = require("mongoose");
require("dotenv").config();

const populateDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const defaultUsers = [
    { username: "user1", password: await bcrypt.hash("password1", 10) },
    { username: "user2", password: await bcrypt.hash("password2", 10) },
  ];

  await User.insertMany(defaultUsers);
  console.log("Default users added to database");
  mongoose.connection.close();
};

populateDB();
