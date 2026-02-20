document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = playPauseBtn.querySelector('i');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const playlistContainer = document.getElementById('dynamic-playlist');

    let currentTrackIndex = 0;
    let playlistTracks = [];
    let shouldAutoPlay = false; // Track explicit user intention

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'rgba(255, 255, 255, 0.2)',
        progressColor: '#a2d149',
        cursorColor: '#fff',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 60,
        barGap: 3,
        normalize: true,
        backend: 'MediaElement' // Uses HTML5 Audio streaming to prevent lag during load
    });

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Events
    wavesurfer.on('ready', () => {
        durationEl.textContent = formatTime(wavesurfer.getDuration());
        if (shouldAutoPlay) {
            wavesurfer.play().catch(e => console.warn("Autoplay prevented:", e));
        }
    });

    wavesurfer.on('audioprocess', () => {
        currentTimeEl.textContent = formatTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('seek', () => {
        currentTimeEl.textContent = formatTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('play', () => {
        playPauseBtn.classList.add('playing');
        playPauseIcon.className = 'fas fa-pause';
    });

    wavesurfer.on('pause', () => {
        playPauseBtn.classList.remove('playing');
        playPauseIcon.className = 'fas fa-play';
    });

    wavesurfer.on('finish', () => {
        // Play next track automatically
        if (currentTrackIndex < playlistTracks.length - 1) {
            loadTrack(currentTrackIndex + 1);
        } else {
            // Reached the end, reset
            currentTrackIndex = 0;
            loadTrack(0, false);
            playPauseBtn.classList.remove('playing');
            playPauseIcon.className = 'fas fa-play';
        }
    });

    wavesurfer.on('error', (err) => {
        console.warn("WaveSurfer Error Loading Audio:", err);
    });

    // Play/Pause button
    playPauseBtn.addEventListener('click', () => {
        if (!playlistTracks.length) return;
        wavesurfer.playPause();
    });

    // Fetch and Build Playlist
    const initPlaylist = async () => {
        try {
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000' : '';

            const res = await fetch(`${API_BASE}/api/demo-playlist`);
            if (res.ok) {
                playlistTracks = await res.json();
            }
        } catch (e) {
            console.warn("Failed to fetch demo playlist", e);
        }

        playlistContainer.innerHTML = '';
        if (!playlistTracks || playlistTracks.length === 0) {
            playlistContainer.innerHTML = '<li>No tracks available.</li>';
            currentTrackIndex = -1;
            return;
        }

        playlistTracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-track';
            if (index === 0) li.classList.add('active');

            li.innerHTML = `
                <span class="track-number">${String(index + 1).padStart(2, '0')}</span> 
                ${track.title}
            `;

            li.addEventListener('click', () => {
                loadTrack(index);
            });

            playlistContainer.appendChild(li);
        });

        // Preload first track if exists, but don't auto-play yet
        loadTrack(0, false);
    };

    const loadTrack = (index, autoPlay = true) => {
        if (!playlistTracks[index]) return;
        currentTrackIndex = index;
        const track = playlistTracks[index];

        // Update UI
        const trackItems = document.querySelectorAll('.playlist-track');
        trackItems.forEach(t => t.classList.remove('active'));
        if (trackItems[index]) {
            trackItems[index].classList.add('active');
        }

        // Load into WaveSurfer
        // Prefix with correct path if not absolute and not full URL
        let finalUrl = track.url;
        if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000' : '';
            finalUrl = `${API_BASE}/${finalUrl}`;
        }

        // Hide standard errors when seeking loading
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '...';

        shouldAutoPlay = autoPlay;
        wavesurfer.load(finalUrl);
    };

    // Kickoff
    initPlaylist();
});
