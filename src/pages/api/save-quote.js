import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
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
  if (req.method === 'POST') {
    try {
      await dbConnect();

      const { quoteData, anonymousUserId: frontendUserId } = req.body;

      if (!quoteData) {
        return res.status(400).json({ message: 'Missing quoteData' });
      }

      let userIdToUse = frontendUserId;

      if (!frontendUserId) {
        userIdToUse = uuidv4();
      }

      const newQuote = new Quote({
        userId: userIdToUse,
        quote: quoteData,
      });

      const savedQuote = await newQuote.save();

      res.status(200).json({ message: 'Quote saved successfully to MongoDB', savedQuote, anonymousUserId: userIdToUse });

    } catch (error) {
      res.status(500).json({ message: 'Failed to save quote to MongoDB', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
