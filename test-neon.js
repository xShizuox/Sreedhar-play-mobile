const { Sequelize } = require('sequelize');
const s = new Sequelize('postgresql://neondb_owner:npg_lI7VH4agToGu@ep-restless-tooth-an3a7msh.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});
s.authenticate()
  .then(() => console.log('Successfully connected to Neon.tech!'))
  .catch(e => console.error('Connection failed:', e));
