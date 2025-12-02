import db from "../db.js";
import { ObjectId } from "mongodb";

const taskLists = db.collection("TaskLists");

export default class TaskList {
    constructor(name, ids = [], description = "", isPrivate = false) {
        this.Name = name;
        this.ids = ids; // array of task IDs as strings or ObjectIds
        this.Description = description;
        this.Private = isPrivate;
    }

    // Save this TaskList to MongoDB
    async save() {
        const result = await taskLists.insertOne(this);
        this._id = result.insertedId;
        return result;
    }

    // Find by ID
    static async findById(id) {
        return await taskLists.findOne({ _id: new ObjectId(id) });
    }

    // Get all TaskLists
    static async getAll() {
        return await taskLists.find().toArray();
    }

    // Add a task ID to this list
    async addTask(taskId) {
        const taskObjectId = new ObjectId(taskId);
        this.ids.push(taskId);
        await taskLists.updateOne(
            { _id: this._id },
            { $addToSet: { ids: taskId } } // prevents duplicates
        );
    }
}
