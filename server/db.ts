import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "hkjems";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

// Global cache to prevent creating new connections in serverless environments
type Cached = {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: Cached | undefined;
}

const cached: Cached = globalThis._mongooseCache ?? { conn: null, promise: null };
if (!globalThis._mongooseCache) globalThis._mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      // family: 4, // uncomment to force IPv4 if you suspect DNS/IPv6 issues
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => mongooseInstance.connection)
      .catch((err) => {
        // Reset promise so future calls can retry
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
