const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Post = require('./server/models/Post');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        const count = await Post.countDocuments();
        console.log(`Total Posts: ${count}`);
        const posts = await Post.find();
        console.log(JSON.stringify(posts, null, 2));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
