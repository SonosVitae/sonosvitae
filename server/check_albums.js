const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Album = require('./models/Album');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const fs = require('fs');

const checkAlbums = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const albums = await Album.find();
        let output = "";
        albums.forEach(a => {
            output += `Title: ${a.title} | Date: "${a.productionDate}"\n`;
        });

        fs.writeFileSync('server/album_dates.txt', output);
        process.exit();
    } catch (err) {
        fs.writeFileSync('server/album_dates.txt', 'Error: ' + err.message);
        process.exit(1);
    }
};

checkAlbums();
