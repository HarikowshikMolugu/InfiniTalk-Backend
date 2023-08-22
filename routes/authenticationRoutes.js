const express = require('express');
const authenticationController = require("../controllers/authenticationController")

const router = express.Router();

router.post('/user/register',authenticationController.createUser);
router.get('/user/login/:username/:password',authenticationController.loginUser);
router.post('/user/updateuserDetails/:id',authenticationController.updateDetails);

module.exports = router;
