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

const filterList = document.querySelector('.filter');
const filterButtons = filterList.querySelectorAll(".filter-btn");
const musiclist = document.querySelectorAll(".music");

let musicIndex = 0;

musiclist.forEach((music) => {
    music.style.viewTransitionName = `conf-${++musicIndex}`;
});

filterButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
        let confCategory = e.target.getAttribute("data-filter");

        // Check if the browser supports startViewTransition
        if (typeof document.startViewTransition === 'function') {
            document.startViewTransition(() => {
                updateActiveButton(e.target);
                filterEvents(confCategory);
            });
        } else {
            // Fallback if startViewTransition is not available
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
    musiclist.forEach((music) => {
        // Get each album's category
        let eventCategory = music.getAttribute("data-category");

        // Check if that category matches the filter
        if (filter === "all" || filter === eventCategory || eventCategory == "all") {
            music.removeAttribute("hidden");
        } else {
            music.setAttribute("hidden", "");
        }
    });
}

// Album Modal Logic
const modal = document.getElementById("albumModal");
const closeModalBtn = document.querySelector(".close-modal");
const modalTitle = document.querySelector(".modal-title");
const modalArtist = document.querySelector(".modal-artist");
const modalDate = document.querySelector(".album-date");
const modalDesc = document.querySelector(".modal-description");
const modalCover = document.querySelector(".modal-cover");
const bandcampContainer = document.getElementById("bandcamp-embed-container");


// Open Modal
document.querySelectorAll('.music').forEach(item => {
    item.addEventListener('click', function () {
        // Don't open if clicking on empty items (placeholders)
        if (!this.hasAttribute('data-id')) return;

        const albumId = this.getAttribute('data-id');
        const album = albums.find(a => a.id === albumId);

        if (album) {
            openModal(album);
        }
    });
});

function openModal(album) {

    // Populate Data
    modalTitle.textContent = album.title;
    modalArtist.textContent = "by " + album.artist;
    modalDate.textContent = album.productionDate;
    modalDesc.textContent = album.description;
    modalCover.src = album.coverUrl;

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

    bandcampContainer.innerHTML = iframeHtml;

    // Show Modal
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scrolling
    document.documentElement.style.overflow = "hidden";
}

// Close Modal
function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    // Clear iframe to stop playback
    bandcampContainer.innerHTML = "";
}

closeModalBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});