const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer'); // Import multer
const app = express();

// Enable CORS
app.use(cors());

// Use body-parser middleware

app.use(express.static("upload"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for handling file uploads
const upload = multer();

// Use multer middleware for handling file uploads
app.use(upload.any()); // This handles all file uploads

// Import route files

const authenticationRoutes = require('./routes/authenticationRoutes');
const userChatRoutes = require('./routes/userChatRoutes');

app.use(authenticationRoutes);
app.use(userChatRoutes);

const User = require('./models/user')
const UserChat = require('./models/userchat')

//create tables
User.sync().then(() => {
  console.log("User Model synced");
});

UserChat.sync().then(() => {
  console.log("UserChat Model synced");
});
const port = process.env.PORT || 9000;

// Listen on `port` and 0.0.0.0
app.listen(port, ()=> 
    console.log('Server is running on port 9000')
);
