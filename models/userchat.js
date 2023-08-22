const { DataTypes } = require('sequelize');
const pool = require('../database/connection');
const User = require('./user'); // Assuming you have a User model defined

const UserChat = pool.define('userchat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  chatteduserid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  iv:{
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status:{
    type: DataTypes.STRING,
    allowNull: true
  },
  createdat: {
    type: DataTypes.STRING,
    allowNull: true // Allow null values for createdAt
  }
}, {
  tableName: 'userchat',
  timestamps: false
});

module.exports = UserChat;
