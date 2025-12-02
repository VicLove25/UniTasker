// authController.js
import bcrypt from 'bcryptjs';
import User from '../model/User.js';
import Task from '../model/Task.js'; // Import Task model

const SALT_ROUNDS = 10;

// Default Roadmap Tasks to give every new user
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

export async function accRegister(uName, secret, email, fName, lName) {
    try {
        // 1. Check if username exists
        const existingUser = await User.findByUsername(uName);
        if (existingUser) {
            console.log("Account with that username already exists");
            return null;
        }

        // 2. Hash password and create User
        const hashedPassword = await bcrypt.hash(secret, SALT_ROUNDS);
        const newUser = new User(undefined, uName, hashedPassword, email, fName, lName, [], []);
        await newUser.save(); 

        console.log(`Successfully created user profile for ${uName}!`);

        // 3. === NEW: Create Default Tasks for this User ===
        const tasksToInsert = ROADMAP_TASKS.map(t => ({
            description: t.description,
            isCompleted: false,
            createdBy: uName,   // Assign to the new user
            createdAt: new Date(),
            dueDate: new Date() // Set default due date to today
        }));

        if (tasksToInsert.length > 0) {
            await Task.collection.insertMany(tasksToInsert);
            console.log(`✅ Assigned ${tasksToInsert.length} roadmap tasks to ${uName}`);
        }

        return newUser;

    } catch (error) {
        console.error("Error registering user:", error);
        return null;
    }
}

export async function authLogin(uName, secret) {
    try {
        const user = await User.findByUsername(uName);
        if (!user) return null;

        const isValid = await bcrypt.compare(secret, user.Password);
        if (!isValid) return null;

        return user;
    } catch (error) {
        console.error("Error logging in:", error);
    }
}