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
        // await client.connect();
        db = client.db("taskDB");
        console.log("Connected to MongoDB successfully!");
        // await db.command({ ping: 1 });
        // console.log("MongoDB Ping Successful!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

const usersCollection = client.db("taskTracker").collection("users");
const tasksCollection = client.db("taskTracker").collection("tasks");

run();

app.get("/", (req, res) => {
    res.send("task-tracker server is running!");
});

app.post("/users", async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);
    if (existingUser) {
        return;
    }
    const result = await usersCollection.insertOne(user);
    res.send(result);
});

app.get("/users", async (req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
});

app.post("/tasks", async (req, res) => {
    try {
        const task = {
            ...req.body,
            order: 0,
            addedBy: req.body.addedBy,
            timestamp: new Date(),
        };

        if (!task.addedBy) {
            return res.status(400).send({ error: "User email is required" });
        }

        const result = await tasksCollection.insertOne(task);
        res.send(result);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).send({ error: "Failed to create task" });
    }
});

app.get("/tasks", async (req, res) => {
    try {
        const { addedBy } = req.query;
        if (!addedBy) {
            return res.status(400).send({ error: "User email is required" });
        }

        const query = { addedBy: addedBy };

        const tasks = await tasksCollection.find(query).toArray();
        res.send(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send({ error: "Failed to fetch tasks" });
    }
});

app.get("/tasks/:id", async (req, res) => {
    const taskId = req.params.id;
    const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
    res.send(task);
});

app.delete("/tasks/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { addedBy } = req.query;

        const query = {
            _id: new ObjectId(id),
            addedBy: addedBy,
        };

        const result = await tasksCollection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).send({ error: "Task not found" });
        }

        res.send(result);
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).send({ error: "Failed to delete task" });
    }
});

app.put("/tasks/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { addedBy } = req.query;

        const filter = {
            _id: new ObjectId(id),
            addedBy: addedBy,
        };

        const options = { upsert: false };
        const updatedTask = req.body;

        const updateDoc = {
            $set: {
                ...updatedTask,
                order: parseInt(updatedTask.order || 0),
                addedBy: addedBy,
            },
        };

        const result = await tasksCollection.updateOne(
            filter,
            updateDoc,
            options
        );
        res.send(result);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).send({ error: "Failed to update task" });
    }
});

app.put("/tasks/reorder", async (req, res) => {
    try {
        const { tasks } = req.body;

        const updatePromises = tasks.map((task) => {
            return tasksCollection.updateOne({ _id: new ObjectId(task.id) }, { $set: { order: task.order } });
        });

        await Promise.all(updatePromises);
        res.status(200).json({ message: "Tasks reordered successfully" });
    } catch (error) {
        console.error("Error reordering tasks:", error);
        res.status(500).json({ message: "Failed to reorder tasks" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});