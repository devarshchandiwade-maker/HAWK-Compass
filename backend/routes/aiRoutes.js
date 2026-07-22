const express = require("express");
const multer = require("multer");

const { extractTasks } = require("../controllers/aiController");

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

module.exports = router;