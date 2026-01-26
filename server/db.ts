import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "hkjems";

  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  // Avoid multiple connections in serverless environments
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  try {
    const options: mongoose.ConnectOptions & { serverSelectionTimeoutMS?: number } = {
      dbName,
      serverSelectionTimeoutMS: 10_000,
    };

    await mongoose.connect(uri, options);
    isConnected = true;
    console.log(`Connected to MongoDB database: ${dbName}`);
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection error", err);
    throw err;
  }
}
