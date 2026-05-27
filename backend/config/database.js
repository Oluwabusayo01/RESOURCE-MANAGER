import mongoose from "mongoose";

const connectDatabase = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not set in environment variables");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.log(`Error connecting to database: ${error.message}`);
    throw error;
  }
};

export default connectDatabase;
