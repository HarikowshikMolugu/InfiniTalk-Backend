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
          attributes: ['chatteduserid'],
          raw: true
      });

      const UserIds = await Chat.findAll({
          where: { chatteduserid: userId },
          attributes: ['userid'],
          raw: true
      });

      const allUserIds = [
          ...new Set([...chattedUserIds.map(item => item.chatteduserid), ...UserIds.map(item => item.userid)])
      ];

      const lastmsgs = await Promise.all(
          allUserIds.map(async chattedUserId => {
              const latestMessageEntry = await Chat.findOne({
                  where: {
                      [Op.or]: [
                          { userid: userId, chatteduserid: chattedUserId },
                          { userid: chattedUserId, chatteduserid: userId }
                      ]
                  },
                  order: [['id', 'DESC']], // Get the latest message
                  limit: 1,
                  raw: true
              });

              return latestMessageEntry;
          })
      );

      const chattedUserData = await Promise.all(
          allUserIds.map(async (chattedUserId, index) => {
              const userData = await UserModel.findOne({
                  where: { id: chattedUserId },
                  attributes: ['id', 'username']
              });

              return {
                  ...userData.toJSON(),
                  latestMessage: lastmsgs[index] ? decryptMessage(lastmsgs[index].message, secretKey, lastmsgs[index].iv) : '',
                  latestMessageCreatedAt: lastmsgs[index] ? lastmsgs[index].createdat : ''
              };
          })
      );

      // Order chattedUserData based on the latest message's created time
      chattedUserData.sort((a, b) => {
          const aParts = a.latestMessageCreatedAt.split(/[- :]/);
          const bParts = b.latestMessageCreatedAt.split(/[- :]/);
          
          const aDate = new Date(aParts[2], aParts[1] - 1, aParts[0], aParts[3], aParts[4], aParts[5]);
          const bDate = new Date(bParts[2], bParts[1] - 1, bParts[0], bParts[3], bParts[4], bParts[5]);
          
          return bDate - aDate;
      });

      res.status(200).json({ chattedUserData });
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
