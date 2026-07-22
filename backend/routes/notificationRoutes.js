const express=require("express");

const router=express.Router();

const auth=require("../middleware/authMiddleware");

const{

    getNotificationSettings,

    updateNotificationSettings

}=require("../controllers/notificationController");

router.get("/",auth,getNotificationSettings);

router.put("/",auth,updateNotificationSettings);

module.exports=router;