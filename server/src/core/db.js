import mongoose from 'mongoose';
import { logger } from './logger.js';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zerotrust';
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    const models = mongoose.models;
    for (const modelName in models) {
      await models[modelName].syncIndexes({ background: true });
      logger.info(`Synced indexes for ${modelName}`);
    }
  } catch (error) {
    logger.error(error, `Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
