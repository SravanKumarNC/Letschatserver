import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allMessages, sendMessage } from "../controller/messageController.js";

const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, allMessages);

export default router;
