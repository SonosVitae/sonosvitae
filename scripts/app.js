// Parallax Scroll
window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset;

    // Move the background slower
    const greenBg = document.querySelector('.green');
    if (greenBg) {
        greenBg.style.transform = `translateY(${scrollTop * 0.6}px)`;
    }

    // Move the foreground faster
    const leavesBg = document.querySelector('.leaves');
    if (leavesBg) {
        leavesBg.style.transform = `translateY(${scrollTop * 0.225}px)`;
    }
});

// Navigation Slide-in for Mobile
const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
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


window.renderAlbumGrid = function (filter = 'all') {
    console.log("Rendering Album Grid...");

    // Determine limit based on screen width
    // Mobile (< 768px): 2 cols * 3 rows = 6 items
    // Desktop: 5 cols * 2 rows = 10 items
    let limit = 10;
    if (window.innerWidth < 768) {
        limit = 6;
    }

    // FIX: Re-query container
    const musicListContainer = document.querySelector('.musiclist');
    if (!musicListContainer) return;

    // Check if Show More button exists, if not create wrapper
    let paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        musicListContainer.after(paginationContainer); // Place after grid
    }

    // Clear list but NOT the pagination container (it's outside)
    musicListContainer.innerHTML = '';

    // Filter albums first if needed (though usually we render all and toggle visibility)
    // But for "Show More", we are manipulating the *rendered* list from the *full* set.
    // However, if we filter by category, we should probably ignore the limit or apply it to the filtered set?
    // Let's assume Limit applies to "All" view primarily.

    let displayedCount = 0;
    let musicIndex = 0;
    let hasHiddenItems = false;

    albums.forEach(album => {
        // Map types to categories for filtering
        let category = 'album';
        if (album.type === 'SINGLE') category = 'single';
        if (album.type === 'SOUNDTRACK') category = 'ost';

        // Check Filter
        let isVisible = (filter === 'all' || filter === category || category === 'all');
        if (!isVisible) return; // Skip non-matching

        // Check Limit (Only if filter is 'all')
        let shouldRender = true;

        // If we are filtering by specific category, show all of them.
        // If we are on 'all', respect the limit unless expanded.
        if (filter === 'all' && !isExpanded) {
            if (displayedCount >= limit) {
                shouldRender = false; // We render it but hide it? Or not render?
                // If we don't render, filterEvents won't find them to unhide later.
                // Better to render them with a special class.
            }
        }

        const li = document.createElement('li');
        li.className = 'music';
        li.dataset.category = category;
        li.dataset.id = album.id;
        li.style.viewTransitionName = `conf-${++musicIndex}`;

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

        if (filter === 'all' && !isExpanded && displayedCount >= limit) {
            li.classList.add('hidden-by-limit');
            li.style.display = 'none';
            hasHiddenItems = true;
        }

        musicListContainer.appendChild(li);
        displayedCount++;
    });

    // Handle "Show More" Button
    updateShowMoreButton(hasHiddenItems, paginationContainer);
}

function updateShowMoreButton(show, container) {
    container.innerHTML = ''; // Clear existing
    if (show) {
        const btn = document.createElement('button');
        btn.className = 'show-more-btn';
        btn.textContent = 'Show More';
        btn.onclick = () => {
            isExpanded = true;
            document.querySelectorAll('.hidden-by-limit').forEach(el => {
                el.style.display = 'block'; // Or 'list-item'? block works for li in grid usually
                el.classList.remove('hidden-by-limit');
            });
            btn.remove(); // Remove self
        };
        container.appendChild(btn);
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

            // If filtering, we should likely reset expansion or keep it?
            // Let's re-render the grid with the new filter.
            // This is cleaner than toggling hidden attributes manually.

            if (typeof document.startViewTransition === 'function') {
                document.startViewTransition(() => {
                    updateActiveButton(e.target);
                    window.renderAlbumGrid(confCategory);
                });
            } else {
                updateActiveButton(e.target);
                window.renderAlbumGrid(confCategory);
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
    if (album.type === 'SINGLE' || album.type === 'TRACK') {
        embedType = 'track';
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
    const bandcampContainer = document.getElementById('bandcamp-iframe-container');
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
            // Use local API in dev, relative path in prod if served together
            const API_URL = 'http://localhost:5000/api/newsletter/subscribe';

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