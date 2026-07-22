const express = require("express");
const cors = require("cors");
require("dotenv").config();
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/aiRoutes");
const retainerRoutes=require("./routes/retainerRoutes");
const pipelineRoutes=require("./routes/pipelineRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes=require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const notificationRoutes=require("./routes/notificationRoutes");
require("./cron/reminderCron");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/retainers",retainerRoutes);
app.use("/api/pipeline",pipelineRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications",notificationRoutes);



const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("API Running...");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});