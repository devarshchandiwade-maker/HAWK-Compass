const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
    login,
    getUsers,
    getUser,
    updatePermissions,
    addUser
} = require("../controllers/adminController");

router.post("/login", login);

router.get("/users", adminAuth, getUsers);

router.get("/users/:id", adminAuth, getUser);

router.put("/users/:id/permissions", adminAuth, updatePermissions);
router.post("/users", adminAuth, addUser);

module.exports = router;