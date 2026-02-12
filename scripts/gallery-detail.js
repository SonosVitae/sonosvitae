// Gallery Detail Page Logic

// Shared Data Source (Ideally this would be a separate JSON or exported module)
// Matching the IDs from gallery.js
const galleryData = [
    {
        id: 0,
        title: "Studio Update: Vocals",
        date: "JAN 28, 2026",
        location: "Home Studio, Krakow",
        mainImage: "https://placehold.co/1200x800/222/FFF?text=Vocals+Main+Setup",
        mainText: "Finally laying down the final vocal tracks for the opening track. The acoustics in the new booth are incredible. We spent about 10 hours today just getting the harmonies right.",
        sections: [
            {
                subtitle: "The Setup",
                text: "We used a Neumann U87 paired with a vintage Avalon preamp. The warmth is undeniable.",
                images: [
                    "https://placehold.co/600x400/333/FFF?text=Mic+Close+Up",
                    "https://placehold.co/600x400/444/FFF?text=Mixing+Board"
                ]
            },
            {
                subtitle: "Break Time",
                text: "It wasn't all work. We stopped for some legendary Krakow pizza.",
                images: [
                    "https://placehold.co/600x400/555/FFF?text=Pizza+Time",
                    "https://placehold.co/600x400/666/FFF?text=View+From+Studio"
                ]
            }
        ],
        attachments: [
            { name: "Vocal_Demo_Snippet.mp3", link: "#" }
        ]
    },
    {
        id: 1,
        title: "Live Performance 2025",
        date: "OCT 20, 2025",
        location: "The Underground Club",
        mainImage: "assets/images/featured-live.jpg",
        mainText: "First live show in over a year. The energy was electric. Played a mix of old classics and teased 'Ashes of Epiphany'.",
        sections: [
            {
                subtitle: "Soundcheck",
                text: "Getting the levels right was tricky in this basement venue, but the bass response was massive.",
                images: [
                    "https://placehold.co/600x400/111/FFF?text=Soundcheck",
                    "https://placehold.co/600x400/222/FFF?text=Guitar+Rig"
                ]
            },
            {
                subtitle: "The Show",
                text: "The crowd reaction to the new drop was everything we hoped for.",
                images: [
                    "https://placehold.co/600x400/333/FFF?text=Crowd+Surfing",
                    "https://placehold.co/600x400/444/FFF?text=Lights+Show",
                    "https://placehold.co/600x400/555/FFF?text=Final+Bow"
                ]
            }
        ],
        attachments: []
    },
    {
        id: 2,
        title: "Album Concept Art",
        date: "DEC 15, 2025",
        location: "Digital Workspace",
        mainImage: "assets/gallery/toothless-art.webp",
        mainText: "Working with @TheHGamer on the cover art for 'Ashes of Epiphany'. We're going for a dark, gritty aesthetic that matches the mod's atmosphere.",
        sections: [
            {
                subtitle: "Initial Sketches",
                text: "The 'Toothless' concept started as a raw charcoal sketch.",
                images: [
                    "https://placehold.co/600x800/222/FFF?text=Sketch+V1",
                    "https://placehold.co/600x800/333/FFF?text=Sketch+V2"
                ]
            },
            {
                subtitle: "Color Grading",
                text: "Finding the right shade of toxic green took iterations. We settled on #b2c982 as the primary accent.",
                images: [
                    "assets/images/art-1.jpg",
                    "assets/images/art-2.jpg",
                    "https://placehold.co/600x600/000/FFF?text=Dark+Palette"
                ]
            }
        ],
        attachments: [
            { name: "Concept_Brief.pdf", link: "#" },
            { name: "Wallpaper_4K.jpg", link: "#" }
        ]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));

    // 2. Load Data
    const data = galleryData.find(p => p.id === id);

    if (!data) {
        document.querySelector('.detail-container').innerHTML = '<h1>Post not found</h1><a href="gallery.html">Back to Gallery</a>';
        return;
    }

    // 3. Populate Header
    document.title = `${data.title} - Sonos Vitae`;
    document.getElementById('detail-title').innerText = data.title;
    document.getElementById('detail-date').innerText = data.date;
    document.getElementById('detail-location').innerText = data.location || "Unknown";
    document.getElementById('detail-main-text').innerHTML = `<p>${data.mainText}</p>`;

    // Main Image
    const mainImg = document.getElementById('detail-main-image');
    mainImg.src = data.mainImage;
    mainImg.onclick = () => openLightbox(data.mainImage); // Click main to zoom

    // 4. Render Sections
    const sectionsContainer = document.getElementById('detail-sections');
    data.sections.forEach(section => {
        // Create Section HTML
        const sectionEl = document.createElement('div');
        sectionEl.className = 'detail-section';

        let imagesHtml = '';
        if (section.images && section.images.length > 0) {
            imagesHtml = `<div class="section-gallery">
                ${section.images.slice(0, 6).map(src => // Limit to 6
                `<img src="${src}" class="section-img" onclick="openLightbox('${src}')" alt="Gallery Image">`
            ).join('')}
            </div>`;
        }

        sectionEl.innerHTML = `
            <h2 class="section-subtitle">${section.subtitle} <div class="glowing-line"></div></h2>
            ${section.text ? `<p class="section-text">${section.text}</p>` : ''}
            ${imagesHtml}
        `;
        sectionsContainer.appendChild(sectionEl);
    });

    // 5. Render Downloads
    const downloadsContainer = document.getElementById('detail-downloads');
    if (data.attachments && data.attachments.length > 0) {
        downloadsContainer.innerHTML = '<h3>Downloads</h3>';
        data.attachments.forEach(file => {
            const link = document.createElement('a');
            link.href = file.link;
            link.className = 'download-link';
            link.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> ${file.name}`;
            downloadsContainer.appendChild(link);
        });
    } else {
        downloadsContainer.style.display = 'none';
    }

    // 6. Spawn Particles
    initParticles();

    // 7. Lightbox Init
    collectImages(data); // Pre-calculate image list
    initLightbox();
});

// --- Particle System ---
function initParticles() {
    const container = document.querySelector('.particles-container');
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'wind-particle';

        // Random delays and positions
        const delay = Math.random() * 4; // 0-4s delay
        const top = Math.random() * 100; // 0-100% height
        const duration = 3 + Math.random() * 2; // 3-5s speed

        p.style.top = `${top}%`;
        p.style.animationDelay = `${delay}s`;
        p.style.animationDuration = `${duration}s`;

        container.appendChild(p);
    }
}

// --- Lightbox Carousel System ---
let lightbox, lbImg, lbPrevImg, lbNextImg, lbFarLeftImg, lbFarRightImg;
let allImages = []; // Array of {src, type?}
let currentIndex = 0;
let currentZoom = 1, isDragging = false, startX, startY, translateX = 0, translateY = 0;

function initLightbox() {
    lightbox = document.getElementById('lightbox');
    lbImg = document.getElementById('lightbox-img');
    lbPrevImg = document.getElementById('lb-img-prev');
    lbNextImg = document.getElementById('lb-img-next');
    lbFarLeftImg = document.getElementById('lb-img-far-left');
    lbFarRightImg = document.getElementById('lb-img-far-right');

    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.getElementById('lb-prev-btn');
    const nextBtn = document.getElementById('lb-next-btn');

    // Controls
    closeBtn.onclick = closeLightbox;
    prevBtn.onclick = (e) => { e.stopPropagation(); changeImage(-1); };
    nextBtn.onclick = (e) => { e.stopPropagation(); changeImage(1); };

    // Close on background click
    lightbox.onclick = (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-track')) closeLightbox();
    };

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') changeImage(-1);
            if (e.key === 'ArrowRight') changeImage(1);
        }
    });

    // Zoom Controls
    document.getElementById('lb-zoom-in').onclick = (e) => { e.stopPropagation(); setZoom(currentZoom + 0.2); };
    document.getElementById('lb-zoom-out').onclick = (e) => { e.stopPropagation(); setZoom(currentZoom - 0.2); };

    // Wheel Zoom
    lightbox.addEventListener('wheel', (e) => {
        if (e.target === lbImg) { // Only zoom if hovering main image
            e.preventDefault();
            setZoom(currentZoom + (e.deltaY < 0 ? 0.2 : -0.2));
        }
    });

    // Panning (Mouse) - Only for main image
    lbImg.addEventListener('mousedown', (e) => {
        if (currentZoom <= 1) return; // Only drag if zoomed in

        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        lbImg.style.cursor = 'grabbing';

        // Reverted: lbImg.classList.add('no-transition'); 
        // User prefers transition behavior or transition is handled otherwise.

        e.preventDefault(); // Prevent default drag
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        lbImg.style.cursor = 'grab';
    });

    let rafId = null;
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        // Use RAF to throttle updates (Fixes Lag)
        if (rafId) return;

        rafId = requestAnimationFrame(() => {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
            rafId = null;
        });
    });

    // --- Touch Support (Mobile Pan) ---
    lbImg.addEventListener('touchstart', (e) => {
        if (currentZoom <= 1) return; // Only drag if zoomed
        if (e.touches.length !== 1) return; // Single finger pan

        isDragging = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;

        // e.preventDefault(); // Might block scroll/zoom gestures if not careful
    }, { passive: false });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        if (e.touches.length !== 1) return;

        e.preventDefault(); // Prevent scrolling while panning

        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            updateTransform();
            rafId = null;
        });
    }, { passive: false });
}

function collectImages(data) {
    // Gather all images in order
    allImages = [];
    if (data.mainImage) allImages.push(data.mainImage);

    if (data.sections) {
        data.sections.forEach(sec => {
            if (sec.images) {
                sec.images.forEach(img => allImages.push(img));
            }
        });
    }
}

function openLightbox(src) {
    // Find index
    currentIndex = allImages.indexOf(src);
    if (currentIndex === -1) currentIndex = 0; // Fallback

    updateLightboxUI();

    // Reset Classes ensures correct start state
    lbFarLeftImg.className = 'lb-anim-img pos-out-left';
    lbPrevImg.className = 'lb-anim-img pos-left';
    lbImg.className = 'lb-anim-img pos-center';
    lbNextImg.className = 'lb-anim-img pos-right';
    lbFarRightImg.className = 'lb-anim-img pos-out-right';

    // Clear inline transforms
    lbFarLeftImg.style.transform = '';
    lbPrevImg.style.transform = '';
    lbImg.style.transform = '';
    lbNextImg.style.transform = '';
    lbFarRightImg.style.transform = '';

    lightbox.style.display = 'flex';
    resetZoom();
}

function closeLightbox() {
    lightbox.style.display = 'none';
    resetZoom();
}

function changeImage(dir) {
    if (!allImages.length) return;

    // Reset Zoom/Pan/Transition before animating
    resetZoom();
    // Force transition to be enabled for the slide
    lbImg.classList.remove('no-transition');

    // Clear inline transforms so CSS classes can drive the animation (Fixes Snap)
    lbFarLeftImg.style.transform = '';
    lbPrevImg.style.transform = '';
    lbImg.style.transform = '';
    lbNextImg.style.transform = '';
    lbFarRightImg.style.transform = '';

    // Determine Animation Direction
    if (dir === 1) {
        // NEXT
        // FarRight -> Right
        lbFarRightImg.className = 'lb-anim-img pos-right';
        // Right -> Center
        lbNextImg.className = 'lb-anim-img pos-center';
        // Center -> Left
        lbImg.className = 'lb-anim-img pos-left';
        // Left -> OutLeft
        lbPrevImg.className = 'lb-anim-img pos-out-left';
        // FarLeft -> OutLeft (Stay/Hidden)
        lbFarLeftImg.className = 'lb-anim-img pos-out-left';
    } else {
        // PREV
        // FarLeft -> Left
        lbFarLeftImg.className = 'lb-anim-img pos-left';
        // Left -> Center
        lbPrevImg.className = 'lb-anim-img pos-center';
        // Center -> Right
        lbImg.className = 'lb-anim-img pos-right';
        // Right -> OutRight
        lbNextImg.className = 'lb-anim-img pos-out-right';
        // FarRight -> OutRight (Stay/Hidden)
        lbFarRightImg.className = 'lb-anim-img pos-out-right';
    }

    // Wait for animation (300ms matches CSS)
    setTimeout(() => {
        // Update Index
        currentIndex += dir;
        // Loop
        if (currentIndex < 0) currentIndex = allImages.length - 1;
        if (currentIndex >= allImages.length) currentIndex = 0;

        // "Teleport" Reset: Update sources and reset positions instantly
        const allImgs = [lbFarLeftImg, lbPrevImg, lbImg, lbNextImg, lbFarRightImg];
        allImgs.forEach(img => img.classList.add('no-transition'));

        // 2. Update Sources
        updateLightboxUI();

        // 3. Reset Classes to Physical Positions
        lbFarLeftImg.className = 'lb-anim-img pos-out-left no-transition';
        lbPrevImg.className = 'lb-anim-img pos-left no-transition';
        lbImg.className = 'lb-anim-img pos-center no-transition';
        lbNextImg.className = 'lb-anim-img pos-right no-transition';
        lbFarRightImg.className = 'lb-anim-img pos-out-right no-transition';

        // 4. Re-enable Transition (Force Reflow first)
        void lbImg.offsetWidth;

        allImgs.forEach(img => img.classList.remove('no-transition'));

        resetZoom();

    }, 300);
}

function updateLightboxUI() {
    // 5-Image Carousel Logic
    const getIdx = (offset) => {
        let i = currentIndex + offset;
        while (i < 0) i += allImages.length;
        while (i >= allImages.length) i -= allImages.length;
        return i;
    };

    lbImg.src = allImages[getIdx(0)];
    lbPrevImg.src = allImages[getIdx(-1)];
    lbNextImg.src = allImages[getIdx(1)];
    lbFarLeftImg.src = allImages[getIdx(-2)];
    lbFarRightImg.src = allImages[getIdx(2)];
}

function resetZoom() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;

    // Re-enable interface transitions
    lbImg.classList.remove('no-transition');

    updateTransform();
}

function setZoom(val) {
    currentZoom = Math.max(0.5, Math.min(val, 4));

    // Auto-Reset if close to 1 (Fixes "Stuck" Zoom Out)
    if (currentZoom < 1.1) {
        currentZoom = 1;
        translateX = 0;
        translateY = 0;
    }

    updateTransform();
}

function updateTransform() {
    // Must preserve the centering translate(-50%, -50%)
    lbImg.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}
