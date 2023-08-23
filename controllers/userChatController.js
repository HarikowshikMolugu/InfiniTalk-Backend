const Chat = require('../models/userchat');
const moment = require("moment-timezone");
const UserModel = require('../models/user');
const { Op } = require('sequelize'); // Import Op (operators) from Sequelize
require('dotenv').config({ path: '.env' });
secretKey = process.env.SECRET_KEY;
console.log(secretKey);
console.log("Secret key length:", Buffer.byteLength(secretKey, 'hex'));

const crypto = require('crypto');



function encryptMessage(message, secretKey, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(message, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

exports.addChat = async (req, res) => {
  try {
      const { userId, chattedUserId } = req.params;
      const { message } = req.body;
      
      // Generate a random IV for this message
      const iv = crypto.randomBytes(16).toString('hex');

      // Encrypt the message using the secret key and IV
      const encryptedMessage = encryptMessage(message, secretKey, iv);

      // Store the encrypted message and IV in the database
      await Chat.create({
          userid: userId,
          chatteduserid: chattedUserId,
          message: encryptedMessage,
          iv: iv,
          status:'Unseen',
          createdat: moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss")
      });

      res.status(200).json({ message: "Chat Added successfully" });
  } catch (error) {
      res.status(500).json({ message: "Error occurred in adding chat" });
      console.log(error);
  }
};


exports.getChat = async (req, res) => {
  try {
      const { userId, chattedUserId } = req.params;

      const list1 = await Chat.findAll({ where: { userid: userId, chatteduserid: chattedUserId } });
      const list2 = await Chat.findAll({ where: { userid: chattedUserId, chatteduserid: userId } });

      const formattedList1 = list1.map(item => ({ ...item.dataValues, side: 'right' }));
      const formattedList2 = list2.map(item => ({ ...item.dataValues, side: 'left' }));

      const combinedList = [...formattedList1, ...formattedList2];
      const sortedList = combinedList.sort((a, b) => a.id - b.id);

      // Decrypt the messages and update the combinedList
      const decryptedList = sortedList.map(item => {
          if (item.message && item.iv) {
              const decryptedMessage = decryptMessage(item.message, secretKey, item.iv);
              return { ...item, message: decryptedMessage, iv: undefined };
          }
          return item;
      });

      res.status(200).json({ combinedList: decryptedList });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error occurred in getting chat" });
  }
};

// Decrypt the message using the given secret key and IV
function decryptMessage(encryptedMessage, secretKey, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedMessage, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

  


exports.getChatList = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const chattedUserIds = await Chat.findAll({
        where: { userid: userId },
        attributes: ['id','chatteduserid', 'status','message','createdat','iv'],
        raw: true
      });
     
  
      const UserIds = await Chat.findAll({
        where: { chatteduserid: userId },
        attributes: ['id','userid', 'status','message','createdat','iv'],
        raw: true
      });
      const chattedUserIds1 = chattedUserIds.map(item => ({
        ...item,
        side: 'right'
      }));
      const UserIds1 = UserIds.map(item => ({
        ...item,
        side: 'left'
      }));
      const filteredChattedUserIds1 = chattedUserIds1.reduce((acc, current) => {
        const existingEntry = acc.find(item => item.chatteduserid === current.chatteduserid);
        if (!existingEntry || existingEntry.id < current.id) {
          // If no existing entry or the current entry has a higher id, replace it
          return [...acc.filter(item => item.chatteduserid !== current.chatteduserid), current];
        }
        return acc;
      }, []);
      
      const filteredUserIds1 = UserIds1.reduce((acc, current) => {
        const existingEntry = acc.find(item => item.userid === current.userid);
        if (!existingEntry || existingEntry.id < current.id) {
          // If no existing entry or the current entry has a higher id, replace it
          return [...acc.filter(item => item.userid !== current.userid), current];
        }
        return acc;
      }, []);
      
      // Find and keep the entry with the greater id when chatteduserid matches userid
const combinedData = [...filteredChattedUserIds1, ...filteredUserIds1].reduce((acc, current) => {
    const existingEntry = acc.find(item => item.chatteduserid === current.userid);
    if (existingEntry) {
      if (existingEntry.id < current.id) {
        // If current entry has a higher id, replace the existing entry
        return [...acc.filter(item => item !== existingEntry), current];
      }
    } else {
      // If no match found, add the current entry to the accumulator
      acc.push(current);
    }
    return acc;
  }, []);
  
  // Sort the combinedData in descending order of id
  combinedData.sort((a, b) => b.id - a.id);
  


  const decryptedData = await Promise.all(
    combinedData.map(async (item) => {
      const decryptedMessage = decryptMessage(item.message, secretKey, item.iv);
      const user = await UserModel.findOne({
        where: { id: item.chatteduserid || item.userid },
        attributes: ['username']
      });
      
      return {
        ...item,
        message: decryptedMessage,
        username: user ? user.username : ''
      };
    })
  );
  
  const decryptedDataWithRenamedId = decryptedData.map(item => {
    const { id, userid, chatteduserid, ...rest } = item;
    return {
      id:  chatteduserid || userid,
      ...rest
    };
  });
  
  
  
      res.status(200).json({"data":decryptedDataWithRenamedId });
    } catch (error) {
      res.status(500).json({ message: "Error in getting the chat List" });
      console.log(error);
    }
  };
  
  

exports.searchFunction = async (req, res) => {
  try {
    const { username } = req.params;

    const usersData = await UserModel.findAll({
      where: {
        username: {
          [Op.like]: `${username}%` // Use the LIKE operator
        }
      },
      attributes: ['id', 'username'],
      raw: true
    });

    res.status(200).json(usersData);
  } catch (error) {
    res.status(500).json({ message: "Error in getting the user details based on search" });
    console.log(error);
  }
};


exports.updateMessageSeen = async(req,res)=>{
    const {chattedUserId, userId} = req.params;
    try{
       const updatedData = await Chat.update({status:'Seen'},{where:{userid:chattedUserId,chatteduserid:userId}})

       res.status(200).json({message: "Unseen messages are changed to seen"});

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Error in updating unseen messages to seen"});
    }
}
