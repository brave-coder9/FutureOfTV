const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const muxuploadRoutes = require("./routes/muxupload");
const webhookRoutes = require("./routes/webhook");
require("dotenv").config();

const app = express();
connectDB();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/muxupload", muxuploadRoutes);
app.use("/api/webhook", webhookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
