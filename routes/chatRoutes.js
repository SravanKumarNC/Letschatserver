import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { accessChat, fetchChats, createGroup, renameGroup, removeFromGroup, addToGroup } from "../controller/chatControllers.js";

const router = express.Router();

router.route('/').post(protect, accessChat);
router.route('/').get(protect, fetchChats);
router.route('/group').post(protect, createGroup);
router.route('/rename').put(protect, renameGroup);
router.route('/removeFromGroup').put(protect, removeFromGroup);
router.route('/addToGroup').put(protect, addToGroup);

export default router;