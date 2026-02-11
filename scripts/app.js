// Parallax Scroll
window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset;

    // Move the background slower
    document.querySelector('.green').style.transform = `translateY(${scrollTop * 0.6}px)`;

    // Move the foreground faster
    document.querySelector('.leaves').style.transform = `translateY(${scrollTop * 0.3}px)`;
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
let typeLabel = document.querySelector('.album-type');
if (!typeLabel) {
    typeLabel = document.createElement('span');
    typeLabel.className = 'album-type';
    typeLabel.style.cssText = 'font-size: 0.8em; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px; display: block;';
    const albumHeader = document.querySelector('.album-header');
    if (albumHeader) {
        albumHeader.appendChild(typeLabel);
    }
}

// --- Dynamic Grid Generation ---
const musicListContainer = document.querySelector('.musiclist');

function renderAlbumGrid() {
    if (!musicListContainer) return;
    musicListContainer.innerHTML = ''; // Clear existing static list

    let musicIndex = 0;

    albums.forEach(album => {
        const li = document.createElement('li');
        li.className = 'music';
        // Map types to categories for filtering
        let category = 'album';
        if (album.type === 'SINGLE') category = 'single';
        if (album.type === 'SOUNDTRACK') category = 'ost';

        li.dataset.category = category;
        li.dataset.id = album.id;

        // Add View Transition Name
        li.style.viewTransitionName = `conf-${++musicIndex}`;

        li.innerHTML = `
            <img src="${album.coverUrl}" alt="${album.title} Cover" loading="lazy">
            <h3 class="albumname">${album.title}</h3>
        `;

        // Add Click Event
        li.addEventListener('click', () => {
            openModal(album);
        });

        musicListContainer.appendChild(li);
    });
}

// Call render on load
document.addEventListener('DOMContentLoaded', () => {
    renderAlbumGrid();
});

// --- Filtering Logic ---
const filterList = document.querySelector('.filter');
const filterButtons = filterList.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
        let confCategory = e.target.getAttribute("data-filter");

        if (typeof document.startViewTransition === 'function') {
            document.startViewTransition(() => {
                updateActiveButton(e.target);
                filterEvents(confCategory);
            });
        } else {
            updateActiveButton(e.target);
            filterEvents(confCategory);
        }
    });
});

function updateActiveButton(newButton) {
    const currentActive = filterList.querySelector(".active");
    if (currentActive) {
        currentActive.classList.remove("active");
    }
    newButton.classList.add("active");
}

function filterEvents(filter) {
    // Query the dynamically created elements
    const musiclist = document.querySelectorAll(".music");

    musiclist.forEach((music) => {
        let eventCategory = music.getAttribute("data-category");

        if (filter === "all" || filter === eventCategory || eventCategory == "all") {
            music.removeAttribute("hidden");
        } else {
            music.setAttribute("hidden", "");
        }
    });
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

        // Extract color once loaded
        modalCover.onload = () => {
            // Prefer manual color if set
            if (album.color) {
                if (modalArtist) modalArtist.style.color = album.color;
                return;
            }

            const dominantColor = getDominantColor(modalCover);
            if (modalArtist && dominantColor) {
                modalArtist.style.color = dominantColor;
            }
        };
        // Handle case where image is cached and onload doesn't fire immediately but is complete
        if (modalCover.complete) {
            // Prefer manual color if set
            if (album.color) {
                if (modalArtist) modalArtist.style.color = album.color;
            } else {
                const dominantColor = getDominantColor(modalCover);
                if (modalArtist && dominantColor) {
                    modalArtist.style.color = dominantColor;
                }
            }
        }
    }
    if (modalDynamicBg) modalDynamicBg.style.backgroundImage = `url('${album.coverUrl}')`;

    // Set Type Label
    if (album.type && typeLabel) {
        typeLabel.textContent = album.type;
        typeLabel.style.display = 'block';
    } else if (typeLabel) {
        typeLabel.style.display = 'none';
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
    // Using the style provided by user: style="border: 0; width: 100%; height: 472px;"
    // artwork=none because we already show the cover in the modal
    // Changed height to 100% to fill the new larger container
    const iframeHtml = `<iframe style="border: 0; width: 100%; height: 100%; min-height: 472px;" 
        src="https://bandcamp.com/EmbeddedPlayer/album=${bcId}/size=large/bgcol=333333/linkcol=4ec5ec/artwork=none/transparent=true/" 
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
    bandcampContainer.innerHTML = "";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});