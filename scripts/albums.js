// Albums Logic - Replaced static array with API Fetch
let albums = [];

async function fetchAlbums() {
    try {
        // Use local API in dev, relative in prod
        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api/albums'
            : '/api/albums';

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch albums');

        albums = await res.json();

        // Render
        if (typeof window.renderAlbumGrid === 'function') {
            window.renderAlbumGrid();
        }
    } catch (err) {
        console.error("Error loading albums:", err);
    }
}

// Call fetch on load
document.addEventListener('DOMContentLoaded', () => {
    fetchAlbums();
});
