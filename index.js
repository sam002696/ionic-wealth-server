const express = require('express')
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//ionicwealth
//1WuiL3MeYz8Nfi9a
const uri = "mongodb+srv://ionicwealth:1WuiL3MeYz8Nfi9a@cluster0.7bztq.mongodb.net/ionicWealth_db?retryWrites=true&w=majority";


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('ionicWealth_db');
        const reviewsCollection = database.collection('reviews');
        const usersCollection = database.collection('users');

        // add a review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        });

        // get all reviews
        app.get('/reviews', async (req, res) => {
            const cursor = await reviewsCollection.find({}).toArray();
            res.json(cursor);
        });

        // add an user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const user1 = {
                email: user.email,
                displayName: user.displayName,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            const result = await usersCollection.insertOne(user1);
            res.json(result);
        });

        // upsert (insert or update) an user
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user, $currentDate: { updatedAt: true }, $setOnInsert: { createdAt: new Date() } };

            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
    } catch {
        // await client.close();
    }
}
run().catch(console.dir);












app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
