const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middlewares/errorMiddleware");

// ১. কনফিগ লোড
dotenv.config();

// ২. ডাটাবেস কানেক্ট
connectDB();

const app = express();

// ৩. কোর মিডলওয়্যার
app.use(cors());
app.use(express.json());

// ৪. বেসিক চেক
app.get("/", (req, res) => {
  res.send("CRM API is running...");
});

// ৫. এপিআই রাউটস লিঙ্ক করা
// এখানে আমরা /api/auth প্রিফিক্স ব্যবহার করছি
app.use("/api/auth", require("./src/routes/authRoutes"));
// Routes ইমপোর্ট
const clientRoutes = require("./src/routes/admin/clientRoutes");
const projectRoutes = require("./src/routes/admin/projectRoutes");
const developerRoutes = require("./src/routes/admin/developerRoutes");
const jobRoutes = require("./src/routes/admin/jobRoutes");
// পেমেন্ট রাউট ইম্পোর্ট
const paymentRoutes = require("./src/routes/admin/paymentRoutes");


// Routes ব্যবহার করা
app.use("/api/admin/clients", clientRoutes);
app.use("/api/admin/projects", projectRoutes);
app.use("/api/admin/developers", developerRoutes);
app.use("/api/admin/jobs", jobRoutes);
app.use("/api/admin/payments", paymentRoutes);



app.use(errorHandler);

// ৭. সার্ভার পোর্ট সেটআপ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});
