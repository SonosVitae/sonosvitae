const dotenv = require('dotenv');
const Post = require('./models/Post');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables from the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to Database
connectDB();

// Real Data from scripts/gallery-data.js
const galleryPosts = [
    {
        id: "24-02-14-valentine",
        title: "VALENTINE'S DAY",
        year: 2024,
        date: "14.02",
        location: "Kraków, Poland",
        text: "Just us, good food, and great vibes. A perfect Valentine's in Kraków.",
        featuredImage: "assets/images/gallery/valentine/v1.jpg",
        stackImages: [
            "assets/images/gallery/valentine/v2.jpg",
            "assets/images/gallery/valentine/v3.jpg"
        ],
        attachments: [],
        sections: [
            {
                title: "Dinner Date",
                text: "We went to a lovely spot in the old town. The atmosphere was incredibly romantic.",
                images: ["assets/images/gallery/valentine/vcat.jpg"]
            }
        ]
    },
    {
        id: "new-studio-session",
        year: 2026,
        date: "FEB 10",
        location: "Krakow, PL",
        title: "New Studio Session",
        text: "Spent the entire day setting up the new recording booth. The acoustics are finally starting to sound right. Looking forward to recording the vocals for \"Eternal Bloom\" next week. The vibe is immaculate...",
        stackImages: [],
        featuredImage: "", // Empty string instead of empty array for string type
        attachments: [
            { name: "Vocal_Take_3_Demo.mp3", link: "#", size: "4.2 MB" }
        ],
        sections: [
            {
                title: "Acoustic Treatment",
                text: "We started by placing bass traps in the corners and diffusers on the back wall. The difference in sound clarity was immediate.",
                images: [],
            },
            {
                title: "Mic Setup",
                text: "Testing out the new Neumann microphone. The warmth it captures is exactly what we needed for the new track.",
                images: [],
            }
        ]
    },
    {
        id: "live-at-the-venue",
        year: 2026,
        date: "JAN 22",
        title: "Live at The Venue",
        location: "Warsaw, PL", // Added placeholder location
        text: "What an incredible night! The energy from the crowd was absolutely electric. Played a sneak peek of the new album and the reaction was wild. Thank you to everyone who came out!",
        stackImages: [
            "assets/images/live-1.jpg",
            "assets/images/live-2.jpg"
        ],
        featuredImage: "assets/images/featured-live.jpg",
        attachments: [],
        sections: []
    },
    {
        id: "album-concept-art",
        year: 2025,
        date: "DEC 15",
        title: "Album Concept Art",
        location: "Home Studio", // Added placeholder location
        text: "Working with @TheHGamer on the cover art for \"Ashes of Epiphany\". We're going for a dark, gritty aesthetic that matches the mod's atmosphere. Here are some early sketches.",
        stackImages: [
            "assets/images/art-1.jpg",
            "assets/images/art-2.jpg"
        ],
        featuredImage: "assets/gallery/toothless-art.webp",
        attachments: [
            { name: "Concept_Brief_v2.pdf", link: "#", size: "1.5 MB" },
            { name: "Wallpaper_4K.jpg", link: "#", size: "8.4 MB" }
        ],
        sections: []
    },
    {
        id: "rule-ripper-ost",
        year: 2025,
        date: "Dec 13",
        location: "Poland",
        title: "Beyond R: Rule Ripper Soundtrack Release!",
        text: `Today marks the release of my first seriously composed game soundtrack for *Beyond R: Rule Ripper*, also known as “the Spaniards” game.

        It’s a project I worked on for about four years starting in 2021, creating the music, sound design, drawing assets, and handling various other tasks. It’s a visual novel in the death game genre. The story takes place in a bar, and getting to know the other players is the only way to survive. Each person holds one of several game rules—uncover them through their past, their preferences, and hidden clues. Confront them in open discussion, because only three people can survive—unless you defend yourself.

        Overall, I’d like to thank everyone who contributed to the creation of this soundtrack:

        * The best guitarist I know, who played on several tracks: Marek Szorc
        * My family for their constant support
        * My friends who helped me refine the project
        * And, of course, the creator of the game

        Over the years, I made significant improvements to the quality of the tracks, so some pieces kept evolving. For example, the version of “Prodding Cues” featured in the game is already its fourth iteration. In general, I didn’t want to completely change the original compositions. When recreating them toward the end, my goal was to preserve the core idea and structure while improving the instrumentation.

        I hope you enjoy both the music and the game!`,
        stackImages: [],
        featuredImage: "https://f4.bcbits.com/img/a3088671399_10.jpg",
        attachments: [],
        sections: []
    }
];

const seedData = async () => {
    try {
        console.log('Clearing existing posts...');
        await Post.deleteMany();

        console.log('Inserting new posts...');
        await Post.insertMany(galleryPosts);

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (err) {
        console.error('Error with data import:', err);
        process.exit(1);
    }
};

seedData();
