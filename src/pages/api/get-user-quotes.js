import mongoose from 'mongoose';
import { Quote } from './model/QuoteSchema';

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGO?.toString();

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await dbConnect();

      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' });
      }

      const userQuotes = await Quote.find({ userId: userId }).sort({ timestamp: -1 }).limit(10);

      res.status(200).json({ message: 'User quotes fetched successfully', quotes: userQuotes });

    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user quotes from MongoDB', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
