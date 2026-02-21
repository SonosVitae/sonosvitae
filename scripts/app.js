// Parallax Scroll - Optimized with RequestAnimationFrame
let ticking = false;

// Cache the DOM nodes to prevent layout thrashing on every frame
const greenBg = document.querySelector('.green');
const leavesBg = document.querySelector('.leaves');

window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset;

    if (!ticking) {
        window.requestAnimationFrame(function () {
            // Move the background slower
            if (greenBg) {
                // Using translate3d forces hardware acceleration
                greenBg.style.transform = `translate3d(0, ${scrollTop * 0.6}px, 0)`;
            }

            // Move the foreground faster
            if (leavesBg) {
                leavesBg.style.transform = `translate3d(0, ${scrollTop * 0.225}px, 0)`;
            }
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true }); // Passive listener improves scroll perf

// Navigation Slide-in for Mobile
const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', (e) => {
        // Prevent default behavior to stop jumping to top of page on some mobile browsers
        if (e && e.preventDefault) e.preventDefault();

        nav.classList.toggle('nav-active');
        document.body.classList.toggle('no-scroll');

        // Animate links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = ''; // Reset animation
            } else {
                link.style.animation = `navLinkFade 0.2s ease forwards ${index / 7 + 0.2}s`;
            }
        });

        // Burger animation
        burger.classList.toggle('toggle');
    });

    // Auto-close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-active')) {
                nav.classList.remove('nav-active');
                document.body.classList.remove('no-scroll');
                burger.classList.remove('toggle');

                navLinks.forEach(l => {
                    l.style.animation = '';
                });
            }
        });
    });
}
navSlide();

// DOM Elements
const modal = document.getElementById('albumModal');
const modalCover = document.querySelector('.modal-cover');
const modalTitle = document.querySelector('.modal-title');
const modalArtist = document.querySelector('.modal-artist');
const modalDate = document.querySelector('.album-date');
const modalDescription = document.querySelector('.modal-description');
const customPlayerContainer = document.querySelector('.music-player');
const bandcampEmbedContainer = document.getElementById('bandcamp-embed-container');
const closeBtn = document.querySelector('.close-modal');
const modalDynamicBg = document.querySelector('.modal-dynamic-bg');

// Create element for Album Type if not exists
// Element for Album Type is now static in HTML: .album-type-genre

// --- Dynamic Grid Generation ---
// --- Dynamic Grid Generation ---
const musicListContainer = document.querySelector('.musiclist');
const INITIAL_ALBUM_LIMIT = 10;
let isExpanded = false;

let isGridInitialized = false;

window.renderAlbumGrid = function (filter = 'all', forceRebuild = false) {
    console.log("Rendering Album Grid...");

    let limit = 10;
    if (window.innerWidth < 768) {
        limit = 6;
    }

    const musicListContainer = document.querySelector('.musiclist');
    if (!musicListContainer) return;

    let paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        musicListContainer.after(paginationContainer); // Place after grid
    }

    // 1. Initialize DOM exactly once to preserve image loaded states during transitions
    if (!isGridInitialized || forceRebuild) {
        if (!albums || albums.length === 0) {
            // Guard against DOMContentLoaded firing before the async fetch finishes in albums.js
            return;
        }

        musicListContainer.innerHTML = '';
        let musicIndex = 0;

        albums.forEach(album => {
            let category = 'album';
            if (album.type === 'SINGLE') category = 'single';
            if (album.type === 'SOUNDTRACK') category = 'ost';

            const li = document.createElement('li');
            li.className = 'music';
            li.dataset.category = category;
            li.dataset.id = album.id;
            li.style.viewTransitionName = `conf-${++musicIndex}`; // Crucial for startViewTransition magic

            li.innerHTML = `
                <img src="${album.coverUrl}" alt="${album.title} Cover" loading="lazy">
                <h3 class="albumname">${album.title}</h3>
            `;

            li.addEventListener('click', () => openModal(album));

            li.addEventListener('mouseenter', () => {
                const root = document.documentElement;
                if (album.color) root.style.setProperty('--shape-color', album.color);
            });

            li.addEventListener('mouseleave', () => {
                const root = document.documentElement;
                root.style.setProperty('--shape-color', 'rgba(162, 209, 73, 0.8)');
            });

            musicListContainer.appendChild(li);
        });
        isGridInitialized = true;
    }

    // 2. Evaluate Visibility Logic for all nodes
    let displayedCount = 0;
    let hasHiddenItems = false;
    const allItems = musicListContainer.querySelectorAll('.music');

    musicListContainer.classList.remove('grid-fade-bottom');

    allItems.forEach(li => {
        let category = li.dataset.category;
        let isVisible = (filter === 'all' || filter === category || category === 'all');

        if (!isVisible) {
            // Filtered out vertically
            li.style.display = 'none';
            li.classList.remove('hidden-by-limit', 'album-hidden', 'album-reveal');
            return;
        }

        // Visible by filter, apply limits
        if (filter === 'all' && !isExpanded && displayedCount >= limit) {
            li.classList.add('hidden-by-limit', 'album-hidden');
            li.classList.remove('album-reveal');
            li.style.display = 'none';
            hasHiddenItems = true;
        } else if (filter === 'all' && isExpanded && displayedCount >= limit) {
            li.classList.add('hidden-by-limit', 'album-reveal');
            li.classList.remove('album-hidden');
            li.style.display = 'block';
            hasHiddenItems = true;
        } else {
            // Unrestricted
            li.classList.remove('hidden-by-limit', 'album-hidden', 'album-reveal');
            li.style.display = 'block';
        }

        displayedCount++;
    });

    if (hasHiddenItems && !isExpanded) {
        musicListContainer.classList.add('grid-fade-bottom');
    }

    // Handle "Show More" Button
    updateShowMoreButton(hasHiddenItems, paginationContainer, musicListContainer);
}

function updateShowMoreButton(show, paginationContainer, musicListContainer) {
    paginationContainer.innerHTML = ''; // Clear existing
    if (show) {
        const btn = document.createElement('button');
        btn.className = 'show-more-btn';
        if (isExpanded) btn.classList.add('expanded');
        btn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        btn.onclick = () => {
            const toggleItems = document.querySelectorAll('.hidden-by-limit');

            if (!isExpanded) {
                // *** EXPANDING ***
                isExpanded = true;
                btn.classList.add('expanded');

                // 1. Temporarily disable CSS transitions to lock the anchor height instantly
                musicListContainer.style.transition = 'none';

                const startHeight = musicListContainer.offsetHeight;
                musicListContainer.style.maxHeight = startHeight + 'px';
                void musicListContainer.offsetHeight; // force reflow

                // 2. Add elements into the flow instantly to measure total target height
                toggleItems.forEach((el, index) => {
                    el.style.display = 'block';
                    el.style.transitionDelay = `${index * 30}ms`;
                });

                // Measure new height
                const targetHeight = musicListContainer.scrollHeight;

                // 3. Restore CSS transitions and force reflow so the browser knows they are back
                musicListContainer.style.transition = '';
                void musicListContainer.offsetHeight;

                // 4. Fire the height transition down smoothly
                setTimeout(() => {
                    // Remove mask so new items show through clearly
                    musicListContainer.classList.remove('grid-fade-bottom');
                    musicListContainer.classList.add('grid-expanded');

                    musicListContainer.style.maxHeight = targetHeight + 'px';

                    // And trigger their opacity fade-ins
                    toggleItems.forEach((el) => {
                        el.classList.remove('album-hidden');
                        el.classList.add('album-reveal');
                    });
                }, 10);

                // Wait for the full height transition to finish, then unlock max-height for responsive resizing
                setTimeout(() => {
                    if (isExpanded) {
                        musicListContainer.style.maxHeight = '5000px';
                    }
                }, 600);

            } else {
                // *** COLLAPSING ***
                isExpanded = false;
                btn.classList.remove('expanded');

                // 1. Lock height to the EXACT current height with transitions disabled
                musicListContainer.style.transition = 'none';

                const startHeight = musicListContainer.offsetHeight;
                musicListContainer.style.maxHeight = startHeight + 'px';
                void musicListContainer.offsetHeight; // force reflow

                // 2. Find target height if items were gone
                toggleItems.forEach(el => el.style.display = 'none');
                const targetHeight = musicListContainer.scrollHeight;
                toggleItems.forEach(el => el.style.display = 'block'); // Switch back to allow opacity animation
                void musicListContainer.offsetHeight; // force reflow

                // 3. Restore CSS transitions and flush
                musicListContainer.style.transition = '';
                void musicListContainer.offsetHeight;

                // 4. Immediately start fading out items
                toggleItems.forEach((el) => {
                    el.style.transitionDelay = '0ms'; // collapse instantly
                    el.classList.remove('album-reveal');
                    el.classList.add('album-hidden');
                });

                // Re-apply the fade mask so the bottom fades out during the transition instead of clipping hard
                musicListContainer.classList.remove('grid-expanded');
                musicListContainer.classList.add('grid-fade-bottom');

                // 5. Concurrently, shrink the container height
                setTimeout(() => {
                    musicListContainer.style.maxHeight = targetHeight + 'px';
                }, 10);

                // 6. After the transitions are done (max 600ms), remove elements from layout completely
                setTimeout(() => {
                    if (!isExpanded) {
                        toggleItems.forEach(el => el.style.display = 'none');
                    }
                }, 600);
            }
        };
        paginationContainer.appendChild(btn);
    }
}


// Call render on load
document.addEventListener('DOMContentLoaded', () => {
    window.renderAlbumGrid();
});

// Update on Resize (Debounced slightly ideally, but simple for now)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        window.renderAlbumGrid();
    }, 200);
});

// --- Filtering Logic ---
const filterList = document.querySelector('.filter');
if (filterList) {
    const filterButtons = filterList.querySelectorAll(".filter-btn");

    filterButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            let confCategory = e.target.getAttribute("data-filter");

            // Reset expansion and height locks when changing filter categories
            const resetGridState = () => {
                isExpanded = false;
                const grid = document.querySelector('.musiclist');
                if (grid) {
                    grid.style.maxHeight = '5000px';
                    grid.classList.add('grid-fade-bottom');
                    grid.classList.remove('grid-expanded');
                }
                updateActiveButton(e.target);
                window.renderAlbumGrid(confCategory);
            };

            if (typeof document.startViewTransition === 'function') {
                document.startViewTransition(() => {
                    resetGridState();
                });
            } else {
                resetGridState();
            }
        });
    });
}

function updateActiveButton(newButton) {
    const currentActive = filterList.querySelector(".active");
    if (currentActive) {
        currentActive.classList.remove("active");
    }
    newButton.classList.add("active");
}

function filterEvents(filter) {
    // Deprecated in favor of re-rendering grid
    return;
}

// --- Color Extraction Helper ---
function getDominantColor(imageElement) {
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;

        canvas.width = 1;
        canvas.height = 1;

        // Draw image effectively averaging it
        context.drawImage(imageElement, 0, 0, 1, 1);
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;

        // Convert to HSL to adjust lightness for visibility
        // We want the color to be visible on a dark background, so high lightness.
        const [h, s, l] = rgbToHsl(r, g, b);

        // Ensure Lightness is at least 70% and Saturation is at least 50% for vibrancy
        const newL = Math.max(l, 0.7);
        const newS = Math.max(s, 0.5);

        return `hsl(${h * 360}, ${newS * 100}%, ${newL * 100}%)`;
    } catch (e) {
        console.error("Error extracting color", e);
        return null; // Fallback will be used (css default)
    }
}

// RGB to HSL helper
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

// --- Modal Logic ---

function openModal(album) {

    // Populate Data with checks
    if (modalTitle) modalTitle.textContent = album.title;
    if (modalArtist) modalArtist.textContent = "by " + album.artist;
    if (modalDate) modalDate.textContent = album.productionDate;
    if (modalDescription) modalDescription.textContent = album.description;
    if (modalDescription) modalDescription.textContent = album.description;
    if (modalCover) {
        modalCover.src = album.coverUrl;

        // Reset color immediately to avoid old color flashing
        if (modalArtist) modalArtist.style.color = '';

        // Extract colors once loaded
        const applyColors = () => {
            // 1. Dominant (for Artist Name) - kept existing logic or use ColorThief
            // Prefer manual color if set
            if (album.color) {
                if (modalArtist) modalArtist.style.color = album.color;
            } else {
                // Use existing helper for dominant (average) or ColorThief
                const dominantColor = getDominantColor(modalCover);
                if (modalArtist && dominantColor) {
                    modalArtist.style.color = dominantColor;
                }
            }

            // 2. Secondary (for Album Type Text)
            try {
                if (typeof ColorThief === 'undefined') {
                    console.error("ColorThief not loaded!");
                    return;
                }
                const colorThief = new ColorThief();
                // Get palette of 3 colors
                const palette = colorThief.getPalette(modalCover, 3);
                console.log("ColorThief Palette:", palette);

                // Palette returns arrays of [r,g,b]
                // 0 is dominant, 1 is secondary, 2 is tertiary
                if (palette && palette.length > 1) {
                    const secondary = palette[1]; // Use second color

                    // Mix with White (50%) to brighten
                    const r = Math.round((secondary[0] + 255) / 2);
                    const g = Math.round((secondary[1] + 255) / 2);
                    const b = Math.round((secondary[2] + 255) / 2);

                    const secHex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    console.log("Brightened Secondary Hex:", secHex);

                    const typeGenreLabel = document.querySelector('.album-type-genre');
                    if (typeGenreLabel) {
                        typeGenreLabel.style.color = secHex;
                        typeGenreLabel.textContent = typeGenreLabel.textContent; // Force repaint if needed (unlikely)
                    }
                }
            } catch (e) {
                console.warn("ColorThief failed or image not ready", e);
                // Fallback to css color if fails
            }
        };

        if (modalCover.complete) {
            applyColors();
        } else {
            modalCover.onload = applyColors;
        }
    }
    if (modalDynamicBg) modalDynamicBg.style.backgroundImage = `url('${album.coverUrl}')`;

    if (modalDynamicBg) modalDynamicBg.style.backgroundImage = `url('${album.coverUrl}')`;

    // Set Type | Genre
    const typeGenreLabel = document.querySelector('.album-type-genre');
    if (typeGenreLabel) {
        let typeText = album.type || 'ALBUM';
        let html = typeText;

        if (album.genre) {
            // "make the genre text to be smaller"
            html += ` <span class="genre-small">| ${album.genre.toUpperCase()}</span>`;
        }
        typeGenreLabel.innerHTML = html;

        // Ensure inline display if it was hidden
        typeGenreLabel.style.display = 'block';
    }

    // Update Links
    const downloadLink = document.querySelector('.download-link');
    const youtubeLink = document.querySelector('.youtube-link');
    const spotifyLink = document.querySelector('.spotify-link');
    const tidalLink = document.querySelector('.tidal-link');

    if (downloadLink) {
        downloadLink.href = album.bandcampLink || "#";
    }
    if (youtubeLink) {
        youtubeLink.href = album.youtubeLink || "#";
        youtubeLink.style.display = album.youtubeLink ? 'inline' : 'none';
    }
    if (spotifyLink) {
        spotifyLink.href = album.spotifyLink || "#";
        spotifyLink.style.display = album.spotifyLink ? 'inline' : 'none';
    }
    if (tidalLink) {
        tidalLink.href = album.tidalLink || "#";
        tidalLink.style.display = album.tidalLink ? 'inline' : 'none';
    }


    // Inject Bandcamp Player
    // Default to Sonos Vitae ID if not present (or handle error)
    const bcId = album.bandcampId || "3867229439";
    const bcLink = album.bandcampLink || "https://sonosvitae.bandcamp.com";

    // Construct Iframe
    let embedType = 'album';

    // 1. Check database type
    if (album.type === 'SINGLE' || album.type === 'TRACK') {
        embedType = 'track';
    }

    // 2. Smart override based on URL structure (prevents 404s if admin selected wrong type)
    if (album.bandcampLink) {
        if (album.bandcampLink.includes('/track/')) embedType = 'track';
        if (album.bandcampLink.includes('/album/')) embedType = 'album';
    }

    // 3. Prevent broken default fallback
    if (!album.bandcampId || bcId === "3867229439") {
        embedType = 'album'; // Default ID is an album ID
    }

    const iframeHtml = `<iframe style="border: 0; width: 100%; height: 100%; min-height: 472px;" 
        src="https://bandcamp.com/EmbeddedPlayer/${embedType}=${bcId}/size=large/bgcol=333333/linkcol=4ec5ec/artwork=none/transparent=true/" 
        seamless>
        <a href="${bcLink}">${album.title} by ${album.artist}</a>
    </iframe>`;

    if (bandcampEmbedContainer) {
        bandcampEmbedContainer.innerHTML = iframeHtml;
    }

    // Show Modal
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Prevent background scrolling
        document.documentElement.style.overflow = "hidden";
        document.querySelector('nav').classList.add('nav-hidden');
    }
}

// Close Modal
function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    document.querySelector('nav').classList.remove('nav-hidden');
    // Clear iframe to stop playback
    const bandcampContainer = document.getElementById('bandcamp-embed-container');
    if (bandcampContainer) bandcampContainer.innerHTML = "";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// --- About Me Gallery Logic ---
const aboutGalleryContainer = document.querySelector('.about-gallery-container');
if (aboutGalleryContainer) {
    const images = aboutGalleryContainer.querySelectorAll('.about-figure');
    const arrow = aboutGalleryContainer.querySelector('.gallery-arrow');

    function swapImages() {
        images.forEach(img => {
            if (img.classList.contains('img-front')) {
                img.classList.remove('img-front');
                img.classList.add('img-back');
            } else {
                img.classList.remove('img-back');
                img.classList.add('img-front');
            }
        });
    }

    if (arrow) {
        arrow.addEventListener('click', swapImages);
    }

    // Also allow clicking the back image to swap
    images.forEach(img => {
        img.addEventListener('click', () => {
            if (img.classList.contains('img-back')) {
                swapImages();
            }
        });
    });
}

// --- Contact Form Logic ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        const subjectInput = contactForm.querySelector('input[name="subject"]');
    });
}

// --- Newsletter Subscription Logic ---
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('input[name="email"]');
        const submitBtn = newsletterForm.querySelector('button');
        const originalBtnText = submitBtn.innerText;

        if (!emailInput || !emailInput.value) return;

        submitBtn.disabled = true;
        submitBtn.innerText = 'Subscribing...';

        try {
            // Dynamic API URL: Use relative in prod/same-port, localhost:5000 for dev separate port
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';
            const API_URL = `${API_BASE}/api/newsletter/subscribe`;

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: emailInput.value })
            });

            const result = await res.json();

            if (res.ok) {
                alert(result.msg || 'Subscribed successfully!');
                newsletterForm.reset();
            } else {
                alert(result.msg || 'Failed to subscribe.');
            }

        } catch (err) {
            console.error('Newsletter Error:', err);
            alert('Network error. Please try again later.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
}