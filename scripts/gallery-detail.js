// Gallery Detail Page Logic

// Gallery Detail Page Logic

// Gallery Detail Page Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log("Init Gallery Detail Called");

    // 1. Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); // ID is string now

    // 2. Fetch Data from API
    // Dynamic API URL
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
        ? 'http://localhost:5000'
        : '';
    const API_URL = `${API_BASE}/api/posts/${id}`;

    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error('Post not found');
            return res.json();
        })
        .then(data => {
            renderDetail(data);
        })
        .catch(err => {
            console.error(err);
            const container = document.querySelector('.detail-container');
            if (container) container.innerHTML = '<h1>Post not found</h1><a href="gallery.html" style="color:#b2c982">Back to Gallery</a>';
        });

    function renderDetail(data) {

        // 3. Populate Header
        document.title = `${data.title} - Sonos Vitae`;

        // Inject Title (Refind elements)
        const titleBlock = document.querySelector('.title-row');
        const existingTitle = document.getElementById('detail-title');
        if (existingTitle) existingTitle.remove();

        if (titleBlock) {
            const titleH1 = document.createElement('h1');
            titleH1.id = 'detail-title';
            titleH1.innerText = data.title;
            titleBlock.appendChild(titleH1);
        }

        // Meta Section Updates
        const dateEl = document.getElementById('detail-date');
        if (dateEl) dateEl.innerText = `${data.date}, ${data.year}`;

        const locEl = document.getElementById('detail-location');
        if (locEl) {
            locEl.innerText = data.location || "Sonos Vitae World";

            // Create & Append Share Button (Next to Location)
            let shareBtn = document.querySelector('.share-btn-sml');
            if (!shareBtn) {
                shareBtn = document.createElement('span');
                shareBtn.className = 'share-btn-sml';
                shareBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Share';

                shareBtn.onclick = () => {
                    const shareData = {
                        title: `Sonos Vitae: ${data.title}`,
                        text: `Check out "${data.title}" on Sonos Vitae`,
                        url: window.location.href
                    };

                    if (navigator.share) {
                        navigator.share(shareData).catch(console.error);
                    } else {
                        navigator.clipboard.writeText(window.location.href);
                        const original = shareBtn.innerHTML;
                        shareBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                        setTimeout(() => shareBtn.innerHTML = original, 2000);
                    }
                };
                locEl.parentNode.appendChild(shareBtn);
            }
        }

        const mainText = document.getElementById('detail-main-text');
        if (mainText) mainText.innerHTML = `<p>${data.text}</p>`;

        // Main Image
        const mainImg = document.getElementById('detail-main-image');
        // const contentRight = document.querySelector('.content-right');

        const hasFeatured = data.featuredImage && typeof data.featuredImage === 'string' && data.featuredImage.trim() !== '';

        if (mainImg) {
            if (hasFeatured) {
                mainImg.src = data.featuredImage;
                mainImg.onclick = () => openLightbox(data.featuredImage);
                if (document.querySelector('.content-right')) document.querySelector('.content-right').style.display = 'block';
            } else {
                if (document.querySelector('.content-right')) document.querySelector('.content-right').style.display = 'none';
            }
        }

        // 4. Render Sections
        const sectionsContainer = document.getElementById('detail-sections');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = '';

            if (data.sections && data.sections.length > 0) {
                data.sections.forEach(sec => {
                    const sectionEl = document.createElement('div');
                    sectionEl.className = 'detail-section';

                    let imagesHtml = '';
                    if (sec.images && sec.images.length > 0) {
                        imagesHtml = `<div class="section-gallery">
                        ${sec.images.map(src =>
                            `<img src="${src}" class="section-img" loading="lazy" onclick="openLightbox('${src}')" alt="Gallery Image">`
                        ).join('')}
                    </div>`;
                    }

                    sectionEl.innerHTML = `
                    <h2 class="section-subtitle">${sec.title} <div class="glowing-line"></div></h2>
                    <p class="section-text">${sec.text}</p>
                    ${imagesHtml}
                `;
                    sectionsContainer.appendChild(sectionEl);
                });

            } else if (data.stackImages && data.stackImages.length > 0) {
                const sectionEl = document.createElement('div');
                sectionEl.className = 'detail-section';

                const imagesHtml = `<div class="section-gallery">
                ${data.stackImages.map(src =>
                    `<img src="${src}" class="section-img" loading="lazy" onclick="openLightbox('${src}')" alt="Gallery Image">`
                ).join('')}
            </div>`;

                sectionEl.innerHTML = `
                <h2 class="section-subtitle">Gallery <div class="glowing-line"></div></h2>
                ${imagesHtml}
            `;
                sectionsContainer.appendChild(sectionEl);
            }
        }

        // 5. Render Downloads
        const downloadsContainer = document.getElementById('detail-downloads');
        if (downloadsContainer) {
            if (data.attachments && data.attachments.length > 0) {
                downloadsContainer.innerHTML = '<h3>Downloads</h3>';
                data.attachments.forEach(file => {
                    const link = document.createElement('a');
                    link.href = file.link;
                    link.className = 'download-link';
                    link.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> ${file.name}`;
                    downloadsContainer.appendChild(link);
                });
                downloadsContainer.style.display = 'block';
            } else {
                downloadsContainer.style.display = 'none';
            }
        }

        // 6. Spawn Particles (REMOVED)
        // initParticles();

        // 7. Lightbox Init
        collectImages(data);
        initLightbox();
    } // End renderDetail
}); // End DOMContentLoaded

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
    if (data.featuredImage) allImages.push(data.featuredImage);

    if (data.stackImages && Array.isArray(data.stackImages)) {
        data.stackImages.forEach(img => allImages.push(img));
    }

    if (data.sections) {
        data.sections.forEach(sec => {
            if (sec.images) {
                sec.images.forEach(img => allImages.push(img));
            }
        });
    }
}

function openLightbox(src) {
    if (!allImages || allImages.length === 0) {
        console.warn("No images to display in Lightbox");
        return;
    }

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
