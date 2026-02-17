const mongoose = require('mongoose');
const Album = require('./models/Album');
require('dotenv').config({ path: './server/.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const album = await Album.findOne({ title: { $regex: 'Crystal Clear', $options: 'i' } });
        if (album) {
            console.log('Found Album:', album.title);
            console.log('ID:', album.id);
            console.log('Bandcamp ID:', album.bandcampId);
            console.log('Bandcamp Link:', album.bandcampLink);
            console.log('Type:', album.type);
        } else {
            console.log('Album "Crystal Clear" not found.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
