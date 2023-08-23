const express = require('express');
const userChatController = require("../controllers/userChatController");

const router = express.Router();

router.post('/chat/addChat/:userId/:chattedUserId',userChatController.addChat);
router.get('/chat/getChat/:userId/:chattedUserId',userChatController.getChat);
router.get('/chat/getChatList/:userId',userChatController.getChatList);
router.get('/chat/search/:username',userChatController.searchFunction);
router.post('/chat/update/messageSeen/:chattedUserId/:userId',userChatController.updateMessageSeen)
module.exports = router;