import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/clickvibe";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose || { conn: null, promise: null };

if (!global._mongoose) {
  global._mongoose = cached;
}

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(DATABASE_URL, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
