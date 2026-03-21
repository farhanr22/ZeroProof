import 'dotenv/config';
import app from './app.js';
import { connectDB } from './core/db.js';
import { logger } from './core/logger.js';

import './models/User.js';
import './models/Campaign.js';
import './models/Contact.js';
import './models/BlindToken.js';
import './models/Response.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
