import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  dbName: process.env.DB_NAME || 'job_portal_db',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_2026'
};