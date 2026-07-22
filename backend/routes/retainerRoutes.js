const express=require("express");

const router=express.Router();
const {
  getRetainers,
  addRetainer,
  updateRetainer,
  deleteRetainer,
  clearRetainers,
} = require("../controllers/retainerController");

const auth = require("../middleware/authMiddleware");

router.get("/", auth, getRetainers);
router.post("/", auth, addRetainer);
router.delete("/all", auth, clearRetainers);
router.put("/:id", auth, updateRetainer);
router.delete("/:id", auth, deleteRetainer);

module.exports=router;