import mongoose from 'mongoose';

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required for the worker MongoDB connection.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    const dbName = process.env.MONGODB_DB_NAME;

    connectionPromise = mongoose
      .connect(uri, {
        ...(dbName ? { dbName } : {}),
      })
      .then((instance) => {
        console.log(
          `[worker] connected to MongoDB${dbName ? ` database '${dbName}'` : ''}.`,
        );
        return instance;
      })
      .catch((error: unknown) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

export async function disconnectFromDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  connectionPromise = null;
  console.log('[worker] disconnected from MongoDB.');
}
