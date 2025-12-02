import db from "../db.js";
import { ObjectId } from "mongodb";

const groups = db.collection("Groups");

export default class Group {
    constructor(name, admins = [], members = [], isPublic = true, moto = "", description = "", priLists = [], pubLists = []) {
        this.Name = name;
        this.Admins = admins;       
        this.Members = members;     
        this.Public = isPublic;
        this.Moto = moto;
        this.Description = description;
        this.PriLists = priLists;   
        this.PubLists = pubLists;   
    }

    // Save a new group
    async save() {
        const result = await groups.insertOne(this);
        this._id = result.insertedId;
        return result;
    }

    // Find group by ID
    static async findById(id) {
        return await groups.findOne({ _id: new ObjectId(id) });
    }

    // Add a member
    async addMember(userId) {
        if (!this.Members.includes(userId)) this.Members.push(userId);
        await groups.updateOne(
            { _id: this._id },
            { $addToSet: { Members: userId } }
        );
    }

    // Add a task list to private or public lists
    async addTaskList(listId, isPublic = false) {
        const field = isPublic ? "PubLists" : "PriLists";
        await groups.updateOne(
            { _id: this._id },
            { $addToSet: { [field]: listId } }
        );
        this[field].push(listId);
    }

    // Get all groups
    static async getAll() {
        return await groups.find().toArray();
    }
}
