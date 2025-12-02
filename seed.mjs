import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// The same list of tasks
const ROADMAP_TASKS = [
  { description: "[Freshman] Complete General Education (Gen Ed) courses" },
  { description: "[Freshman] Meet with academic advisor (Fall)" },
  { description: "[Freshman] Meet with academic advisor (Spring)" },
  { description: "[Freshman] Maintain minimum GPA ≥ 2.0" },
  { description: "[Freshman] Review Financial Aid SAP requirements" },
  { description: "[Soph/Jr] Begin major foundation courses" },
  { description: "[Soph/Jr] Ensure 50% of major credits are upper‑level (300–400)" },
  { description: "[Soph/Jr] Explore internships & career prep" },
  { description: "[Soph/Jr] Track major requirements in catalog" },
  { description: "[Senior] Finish all major, minor, and elective requirements" },
  { description: "[Senior] Confirm total credit‑hour requirements (120–128)" },
  { description: "[Senior] Review the Senior Graduation Checklist" },
  { description: "[Graduation] Log into UNA Portal and select 'Apply for Graduation'" },
  { description: "[Graduation] Submit degree audit & review progress" },
  { description: "[Graduation] Pay graduation fee" }
];

async function seedAllUsers() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");

    const db = client.db("UniTask");
    const usersCollection = db.collection("Users");
    const tasksCollection = db.collection("Tasks");

    // 1. Get ALL users
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users in the database.`);

    // 2. Loop through each user
    for (const user of users) {
        const username = user.Username; 
        console.log(`Processing user: ${username}...`);

        // Optional: Clear old tasks for this user to avoid duplicates?
        // Uncomment the next line if you want to wipe their tasks first:
        // await tasksCollection.deleteMany({ createdBy: username });

        // Prepare tasks
        const userTasks = ROADMAP_TASKS.map(task => ({
            description: task.description,
            isCompleted: false,
            createdBy: username,
            createdAt: new Date(),
            dueDate: new Date()
        }));

        // Insert
        if (userTasks.length > 0) {
            await tasksCollection.insertMany(userTasks);
            console.log(`   -> Added ${userTasks.length} tasks for ${username}`);
        }
    }
    
    console.log("\n✅ Global Seed Complete!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await client.close();
    console.log("🔌 Database connection closed");
  }
}

seedAllUsers().catch(console.dir);