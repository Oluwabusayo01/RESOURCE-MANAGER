import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const normalizeMongoUri = (rawUri) => {
  if (!rawUri) {
    throw new Error("MONGODB_URL is missing in environment variables");
  }

  let uri = rawUri.trim().replace(/^['\"]|['\"]$/g, "");

  // Common Atlas copy/paste issue: password wrapped like <password>
  uri = uri.replace(/:\<([^\>]+)\>@/, ":$1@");

  try {
    const parsed = new URL(uri);

    const decodeSafe = (value) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    parsed.username = decodeSafe(parsed.username);
    parsed.password = decodeSafe(parsed.password);

    return parsed.toString();
  } catch {
    return uri;
  }
};

const connectDatabase = async () => {
  try {
    const mongoUri = normalizeMongoUri(process.env.MONGODB_URL);
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.log(`Error connecting to database: ${error.message}`);
  }
};

export default connectDatabase;
