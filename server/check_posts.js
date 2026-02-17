const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('./models/Post');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Post.countDocuments();
        console.log(`POST COUNT: ${count}`);
        if (count > 0) {
            const first = await Post.findOne();
            console.log('SAMPLE POST:', JSON.stringify(first, null, 2));
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
