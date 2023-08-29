const Sequelize = require("sequelize");
const config = require("../config/config.json");
const pg = require('pg');
const sequelize = new Sequelize('verceldb', 'default', 'A0WNIa9DvLPi', {
  host: 'ep-rough-shape-68710479-pooler.ap-southeast-1.postgres.vercel-storage.com',
  port: 5432,
  dialect: 'postgres',
  ssl: true,
  dialectModule: pg,
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connected to PgAdmin');
  })
  .catch((error) => {
    console.error('Failed to connect to PgAdmin:', error);
  });

module.exports = sequelize;
