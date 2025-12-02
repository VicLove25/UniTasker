import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error("MONGO_URI not found");
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db = null;

export async function connectDB() {
    if (!db) {
        await client.connect();
        console.log("Connected to MongoDB Atlas!");
        db = client.db("UniTask");
    }
    return db;
}

export function getDB() {
    if (!db) throw new Error("Database not connected. Call connectDB() first.");
    return db;
}


export async function closeDB() {
    if (client) {
        await client.close();
        console.log("Database connection closed");
    }
}
