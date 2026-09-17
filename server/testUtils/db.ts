import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;
let connectionPromise: Promise<void> | null = null;

export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = (async () => {
    if (process.env.TEST_MONGODB_URI) {
      await mongoose.connect(process.env.TEST_MONGODB_URI, { dbName: 'srms_test' } as any);
      return;
    }

    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'srms_test' } as any);
  })();

  await connectionPromise;
};

export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongod) {
    await mongod.stop();
    mongod = null;
  }

  connectionPromise = null;
};

export const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    await connectTestDB();
  }

  const collections = await mongoose.connection.db!.listCollections().toArray();
  for (const coll of collections) {
    await mongoose.connection.db!.collection(coll.name).deleteMany({});
  }
};
