const express = require('express')
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const admin = require("firebase-admin");
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//ionicwealth
//1WuiL3MeYz8Nfi9a
const uri = "mongodb+srv://ionicwealth:1WuiL3MeYz8Nfi9a@cluster0.7bztq.mongodb.net/ionicWealth_db?retryWrites=true&w=majority";


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

var serviceAccount = require("./ionic-wealth-fa-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// verfiy token
async function verifyToken(req, res, next) {
    const authHeader = req.headers?.authorization;
    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.decodedUserEmail = decodedToken.email;
        req.user = decodedToken;
        next();
    }
    catch (e) {
        res.status(403).json({ message: 'Unauthorized' });
    }


}

async function run() {
    try {
        await client.connect();
        const database = client.db('ionicWealth_db');
        const reviewsCollection = database.collection('reviews');
        const usersCollection = database.collection('users');
        const documentsCollection = database.collection('documents');
        // add a review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        });

        // verify admin
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        }

        // get all reviews
        app.get('/reviews', async (req, res) => {
            const cursor = await reviewsCollection.find({}).toArray();
            res.json(cursor);
        });
        // get all users
        app.get('/users', async (req, res) => {
            const cursor = await usersCollection.find({}).toArray();
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
        // post all uploaded documents

        app.post('/documents', async (req, res) => {
            const document = req.body;
            const result = await documentsCollection.insertOne(document);
            res.json(result);
        });


        // all documents 
        app.get('/documents', verifyToken, async (req, res) => {
            const cursor = await documentsCollection.find({}).toArray();
            res.json(cursor);

        });

        // get single document
        app.get('/documents/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (req.decodedUserEmail === email) {
                const query = { email: email };
                const user = await documentsCollection.findOne(query);
                res.json(user);
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        });
        //post single document
        app.post('/documents/:email', async (req, res) => {
            const email = req.params.email;
            const document = req.body;
            const query = { email: email };
            const updateDoc = { $set: document, $currentDate: { updatedAt: true }, $setOnInsert: { createdAt: new Date() } };
            const options = { upsert: true };
            const result = await documentsCollection.updateOne(query, updateDoc, options);
            res.json(result);
        });
        // update single document
        app.put('/documents/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const updateDoc = { $set: req.body, $currentDate: { updatedAt: true } };
            const options = { upsert: true };
            const result = await documentsCollection.updateOne(query, updateDoc, options);
            res.json(result);
        });
        // delete a document
        app.delete('/documents/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await documentsCollection.deleteOne(query);
            res.json(result);
        });

        // update user to admin role
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        // check an user if admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });

        });

    } catch {
        // await client.close();
    }
}
run().catch(console.dir);












app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
