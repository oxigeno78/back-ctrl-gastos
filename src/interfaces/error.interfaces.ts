import type { Error as MongooseError } from 'mongoose';

export interface CustomError extends MongooseError {
  statusCode?: number;
  isOperational?: boolean;
}
