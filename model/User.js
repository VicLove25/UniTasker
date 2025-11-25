import { getDB, connectDB } from "../db.js";
import { ObjectId } from "mongodb";

export default class User {
    constructor(_id, username, password, email, fName, lName, groupList = [], taskLists = []) {
        this._id = _id;
        this.Username = username;
        this.Password = password;
        this.Email = email;
        this.First = fName;
        this.Last = lName;
        this.Groups = groupList;
        this.TaskLists = taskLists;
    }

    static get collection() {
        const db = getDB();
        return db.collection("Users");
    }

    async save() {
        const result = await User.collection.insertOne(this);
        this._id = result.insertedId;
        return result;
    }

    static async findByUsername(username) {
        return await User.collection.findOne({ Username: username });
    }

    static async findById(id) {
        return await User.collection.findOne({ _id: new ObjectId(id) });
    }

    async addTaskList(listId) {
        if (!this._id) throw new Error("User _id not set.");
        await User.collection.updateOne(
            { _id: this._id },
            { $addToSet: { TaskLists: listId } }
        );
        if (!this.TaskLists.includes(listId)) this.TaskLists.push(listId);
    }

    async getAllTasks() {
        if (!this._id) throw new Error("User _id not set.");

        const db = getDB();
        const taskListsCol = db.collection("TaskLists");
        const tasksCol = db.collection("Tasks");

        const userTaskLists = await taskListsCol
            .find({ _id: { $in: this.TaskLists.map(id => new ObjectId(id)) } })
            .toArray();

        const allTasks = {};
        for (const list of userTaskLists) {
            const listTasks = await tasksCol
                .find({ _id: { $in: list.ids.map(id => new ObjectId(id)) } })
                .toArray();
            allTasks[list.Name] = listTasks;
        }
        return allTasks;
    }
}
