const express = require("express");
const multer = require("multer");

const { extractTasks } = require("../controllers/aiController");
const { generateInsight } = require("../controllers/aiInsightController");

const router = express.Router();

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

router.post(
    "/extract",
    upload.single("image"),
    extractTasks
);

router.post("/salary-insight", salaryInsight);

module.exports = router;