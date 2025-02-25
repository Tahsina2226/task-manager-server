require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1jen4.mongodb.net/taskDB?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db;

async function run() {
    try {
        await client.connect();
        db = client.db("taskDB");
        console.log("Connected to MongoDB successfully!");
        await db.command({ ping: 1 });
        console.log("MongoDB Ping Successful!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

run();

app.get("/", (req, res) => {
    res.send("task-tracker server is running!");
});

app.get("/tasks", async(req, res) => {
    try {
        const tasksCollection = db.collection("tasks");
        const tasks = await tasksCollection.find().toArray();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tasks", error });
    }
});

app.post("/tasks", async(req, res) => {
    try {
        const task = req.body;
        const tasksCollection = db.collection("tasks");
        const result = await tasksCollection.insertOne(task);
        res.status(201).json({ message: "Task added successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding task", error });
    }
});

app.put("/tasks/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const updatedTask = req.body;
        const tasksCollection = db.collection("tasks");

        const result = await tasksCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedTask });

        res.status(200).json({ message: "Task updated successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error updating task", error });
    }
});

app.delete("/tasks/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const tasksCollection = db.collection("tasks");

        const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });

        res.status(200).json({ message: "Task deleted successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error deleting task", error });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});