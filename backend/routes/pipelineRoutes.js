const express=require("express");

const router=express.Router();

const {
  getPipeline,
  addLead,
  updateLead,
  deleteLead,
  bulkImport,
} = require("../controllers/pipelineController");

router.get("/",getPipeline);

router.post("/",addLead);

router.post("/import", bulkImport);

router.put("/:id",updateLead);

router.delete("/:id",deleteLead);

module.exports=router;