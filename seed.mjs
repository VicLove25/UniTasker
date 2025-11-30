import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGO_URI;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const OWNER_USERNAME = "Red"; // <--- CHANGE "User" TO YOUR ACTUAL USERNAME
// UNA Academic Roadmap Tasks
const roadmapTasks = [
  // Freshman Year
  { description: "[Freshman] Complete General Education (Gen Ed) courses", isCompleted: false },
  { description: "[Freshman] Meet with academic advisor (Fall)", isCompleted: false },
  { description: "[Freshman] Meet with academic advisor (Spring)", isCompleted: false },
  { description: "[Freshman] Maintain minimum GPA ≥ 2.0", isCompleted: false },
  { description: "[Freshman] Review Financial Aid SAP requirements", isCompleted: false },

  // Sophomore & Junior Years
  { description: "[Soph/Jr] Begin major foundation courses", isCompleted: false },
  { description: "[Soph/Jr] Ensure 50% of major credits are upper‑level (300–400)", isCompleted: false },
  { description: "[Soph/Jr] Explore internships & career prep", isCompleted: false },
  { description: "[Soph/Jr] Track major requirements in catalog", isCompleted: false },

  // Senior Year
  { description: "[Senior] Finish all major, minor, and elective requirements", isCompleted: false },
  { description: "[Senior] Confirm total credit‑hour requirements (120–128)", isCompleted: false },
  { description: "[Senior] Review the Senior Graduation Checklist", isCompleted: false },
  
  // Graduation Process
  { description: "[Graduation] Log into UNA Portal and select 'Apply for Graduation'", isCompleted: false },
  { description: "[Graduation] Submit degree audit & review progress", isCompleted: false },
  { description: "[Graduation] Pay graduation fee", isCompleted: false }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB Atlas!");

    const db = client.db("UniTask");
    const collection = db.collection("Tasks");

    // Optional: Delete existing tasks to start fresh
    // Comment this out if you want to keep old tasks
    console.log("Cleaning up old tasks...");
    await collection.deleteMany({}); 

    console.log("Inserting roadmap tasks...");
    const result = await collection.insertMany(roadmapTasks);
    console.log(`✅ Successfully seeded ${result.insertedCount} tasks from the Academic Roadmap!`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    // Close the connection
    await client.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the seed function
seedDatabase().catch(console.dir);