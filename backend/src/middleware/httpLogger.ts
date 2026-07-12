import morgan, { StreamOptions } from 'morgan';
import logger from '../config/logger';

const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};

const httpLogger = morgan('combined', { stream });

export default httpLogger;
