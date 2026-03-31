const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
// If running from root, path is '.env.local'. Adjust if running from scripts folder.
require('dotenv').config({ path: '.env.local' }); 

async function seedUser() {
    const uri = process.env.MONGODB_URI; 
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("WebCrawlerPortal");
        const collection = db.collection("users");

        const plainPassword = "1234";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const newUser = {
            name: "Avee",
            email: "avaneendra@arcubus.in",
            password: hashedPassword,
            role: "user",
            login_secret: "", 
            createdAt: new Date()
        };

        const result = await collection.insertOne(newUser);
        console.log(`✅ User created successfully with ID :`);
    } catch (error) {
        console.error("❌ Error seeding user:", error);
    } finally {
        await client.close();
    }
}

seedUser();