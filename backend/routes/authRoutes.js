const express = require("express");
const router = express.Router();

const { googleLogin, getPermissions } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/google", googleLogin);
router.get("/permissions", authMiddleware, getPermissions);

module.exports = router;