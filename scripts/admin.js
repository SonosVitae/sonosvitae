document.addEventListener('DOMContentLoaded', () => {

    const checkAuth = () => {
        const token = sessionStorage.getItem('adminToken');
        const loginOverlay = document.getElementById('login-overlay');
        const dashboard = document.getElementById('admin-dashboard');

        if (token) {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
        } else {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (dashboard) dashboard.style.display = 'none';
        }
    };
    checkAuth();

    // LOGIN LOGIC
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const errorP = document.getElementById('login-error');

            try {
                // Determine API URL (Localhost handling)
                // Dynamic API URL
                const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                    ? 'http://localhost:5000'
                    : '';
                const API_URL = `${API_BASE}/api/auth/login`;

                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (data.success) {
                    sessionStorage.setItem('adminToken', data.token);
                    checkAuth();
                    if (errorP) errorP.style.display = 'none';
                } else {
                    if (errorP) {
                        errorP.innerText = data.msg;
                        errorP.style.display = 'block';
                    }
                    alert(data.msg);
                }
            } catch (err) {
                console.error(err);
                if (errorP) {
                    errorP.innerText = "Network Error: Ensure Server is Running";
                    errorP.style.display = 'block';
                }
            }
        });
    }

    // LOGOUT
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminToken');
            checkAuth();
        });
    }

    // --- TAB SWITCHING ---
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.form-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.dataset.tab;
            const targetEl = document.getElementById(`${target}-form-section`);
            if (targetEl) targetEl.classList.add('active');

            if (target === 'subscribers') {
                loadSubscribers();
            } else if (target === 'demoTracks') {
                loadDemoTracks();
            } else if (target === 'files') {
                loadFileTracker();
            }
        });
    });

    // --- FILE UPLOAD LOGIC ---
    let pendingFiles = {}; // Store files: { 'coverUrl': File, 'featuredImage': File }

    const setupDropZone = (dropZoneId, previewId, inputName, isHelper = false) => {
        const dropZone = document.getElementById(dropZoneId);
        if (!dropZone) return;

        const fileInput = dropZone.querySelector('input[type="file"]');
        const preview = document.getElementById(previewId);
        // Find input by name/id
        const urlInput = isHelper ? document.getElementById('helper-url') : document.querySelector(`input[name="${inputName}"]`);

        // Click to upload
        dropZone.addEventListener('click', () => fileInput.click());

        // Drag Handler
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        // Handle Drop
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        // Handle Select
        fileInput.addEventListener('change', function () {
            handleFiles(this.files);
        });

        function handleFiles(files) {
            if (files.length > 0) {
                uploadFile(files[0]);
            }
        }

        async function uploadFile(file) {
            const pTag = dropZone.querySelector('p');
            const originalText = pTag.innerText;
            pTag.innerText = "Checking...";

            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';
            const API_UPLOAD_BASE = `${API_BASE}/api/upload`;

            try {
                // 1. Check if file exists
                const checkRes = await fetch(`${API_UPLOAD_BASE}/check`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: file.name })
                });
                const checkData = await checkRes.json();

                let action = 'rename'; // Default
                const originalText = "Drop image here or click to upload"; // Reset text

                if (isHelper) {
                    // HELPER: Instant Upload
                    try {
                        const url = await performUpload(file, (msg) => pTag.innerText = msg);
                        if (!url) throw new Error("Server returned empty URL");
                        if (urlInput) urlInput.value = url;
                        setTimeout(() => pTag.innerText = originalText, 2000);
                    } catch (e) {
                        console.warn(e);
                        alert("Helper Upload Failed: " + file.name + "\n" + e.message);
                    }
                } else {
                    // FORM: Defer
                    pendingFiles[inputName] = file;
                    const localUrl = URL.createObjectURL(file);

                    if (preview) {
                        preview.src = localUrl;
                        preview.style.display = 'block';
                        if (inputName === 'coverUrl') {
                            extractColor(preview, 'input[name="color"]');
                        }
                    }

                    // Update specific inputs if needed (though usually we overwrite on submit)
                    // But we leave the text input empty or show "Pending..."? 
                    // Better to leave it as is or show placeholder. 
                    // Actually, if we edit, we might want to clear the old URL value visually?
                    // Let's just update the status text.
                    pTag.innerText = "Ready to upload";
                }
            } catch (err) {
                console.error(err);
                pTag.innerText = "Error";
            }
        }
    };
    // --- STACK IMAGES MULTI-UPLOAD LOGIC ---
    let currentStackImages = [];
    const stackPreviewContainer = document.getElementById('stack-images-preview');
    const hiddenStackImagesInput = document.getElementById('hidden-stack-images');

    function renderStackImages() {
        if (!stackPreviewContainer) return;
        stackPreviewContainer.innerHTML = '';
        currentStackImages.forEach((url, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'position:relative; width:100%; aspect-ratio:1; border:1px solid #444; border-radius:4px; overflow:hidden; background:#222;';
            card.innerHTML = `
                <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
                <button type="button" class="remove-stack-img" data-index="${idx}" style="position:absolute; top:2px; right:2px; background:rgba(255,0,0,0.8); color:white; border:none; border-radius:3px; padding:2px 6px; cursor:pointer; font-size:0.8em;">X</button>
            `;
            stackPreviewContainer.appendChild(card);
        });

        // Bind removes
        document.querySelectorAll('.remove-stack-img').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                currentStackImages.splice(idx, 1);
                updateStackImagesDict();
            });
        });
    }

    function updateStackImagesDict() {
        if (hiddenStackImagesInput) {
            // Join array into comma separated string to match existing payload format
            hiddenStackImagesInput.value = currentStackImages.join(', ');
        }
        renderStackImages();
    }

    const setupStackDropZone = () => {
        const dropZone = document.getElementById('stack-drop');
        if (!dropZone) return;

        const fileInput = dropZone.querySelector('input[type="file"]');
        const pTag = dropZone.querySelector('p');
        const originalText = pTag.innerText;

        dropZone.addEventListener('click', () => fileInput.click());

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
        fileInput.addEventListener('change', function () { handleFiles(this.files); });

        async function handleFiles(files) {
            if (files.length === 0) return;
            pTag.innerText = `Uploading ${files.length} images...`;

            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue; // Skip non-images

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch(`${API_BASE}/api/upload?action=rename`, {
                        method: 'POST',
                        body: formData
                    });
                    if (res.ok) {
                        const data = await res.json();
                        currentStackImages.push(data.url);
                        updateStackImagesDict();  // Update visual grid actively
                    } else {
                        const errData = await res.text();
                        alert(`Stack Upload failed for ${file.name}:\n` + errData);
                    }
                } catch (err) {
                    console.error("Stack Image Upload Error:", err);
                    alert(`Network error uploading ${file.name}`);
                }
            }

            pTag.innerText = originalText;
            fileInput.value = ''; // Reset
        }
    };



    const setupAttachmentDropZone = () => {
        const dropZone = document.getElementById('att-drop');
        if (!dropZone) return;

        const pTag = dropZone.querySelector('p');
        const originalText = pTag.innerText;
        const fileInput = dropZone.querySelector('input[type="file"]');

        const handleFiles = async (files) => {
            if (!files || files.length === 0) return;
            pTag.innerText = `Uploading ${files.length} attachment(s)...`;

            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch(`${API_BASE}/api/upload?action=rename`, {
                        method: 'POST',
                        body: formData
                    });
                    if (res.ok) {
                        const data = await res.json();
                        currentAttachments.push({ name: file.name, link: data.url });
                        updateAttachmentsJson();
                    } else {
                        const errData = await res.text();
                        alert(`Attachment Upload failed for ${file.name}:\n` + errData);
                    }
                } catch (err) {
                    console.error("Attachment Drop Error:", err);
                    alert(`Network error uploading ${file.name}`);
                }
            }
            pTag.innerText = originalText;
            if (fileInput) fileInput.value = '';
        };

        if (fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', function () { handleFiles(this.files); });
        }

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            handleFiles(e.dataTransfer.files);
        });
    };

    // --- COLOR EXTRACTION ---
    function extractColor(img, inputSelector) {
        if (!img) return;

        // Ensure image is loaded
        if (img.complete) {
            processColor();
        } else {
            img.addEventListener('load', processColor);
        }

        function processColor() {
            try {
                const colorThief = new ColorThief();
                const palette = colorThief.getPalette(img, 3); // Get 3 main colors

                if (!palette || palette.length === 0) return;

                const input = document.querySelector(inputSelector);
                const paletteContainer = document.getElementById('color-palette-container');

                if (paletteContainer) paletteContainer.innerHTML = ''; // Clear old swatches

                // Process up to 3 colors
                palette.slice(0, 3).forEach((color, index) => {
                    const brightened = brightenColor(color[0], color[1], color[2], 30);
                    const hex = rgbToHex(brightened[0], brightened[1], brightened[2]);

                    // Set default input to dominant (first) color
                    if (index === 0 && input) {
                        input.value = hex;
                        input.dispatchEvent(new Event('change'));
                    }

                    // Create swatch UI if container exists
                    if (paletteContainer && input) {
                        const swatch = document.createElement('div');
                        swatch.style.width = '35px';
                        swatch.style.height = '35px';
                        swatch.style.borderRadius = '50%';
                        swatch.style.backgroundColor = hex;
                        swatch.style.cursor = 'pointer';
                        swatch.style.border = '2px solid transparent';
                        swatch.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
                        swatch.title = `Click to use ${hex}`;

                        // Highlight active swatch on click
                        swatch.addEventListener('click', () => {
                            input.value = hex;
                            input.dispatchEvent(new Event('change'));

                            // Visual feedback
                            Array.from(paletteContainer.children).forEach(c => c.style.border = '2px solid transparent');
                            swatch.style.border = '2px solid #fff';
                        });

                        // Make dominant selected by default
                        if (index === 0) swatch.style.border = '2px solid #fff';

                        paletteContainer.appendChild(swatch);
                    }
                });
            } catch (e) {
                console.warn("Color extraction failed:", e);
            }
        }
    }

    function brightenColor(r, g, b, percent) {
        // Mix with White (Tint) to brighten
        const factor = percent / 100;

        const newR = Math.round(r + ((255 - r) * factor));
        const newG = Math.round(g + ((255 - g) * factor)); // Removed hardcoded 255
        const newB = Math.round(b + ((255 - b) * factor));

        return [newR, newG, newB];
    }

    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    // Helper for Modal Promise
    function showConflictModal(filename) {
        return new Promise((resolve, reject) => {
            const modal = document.getElementById('upload-conflict-modal');
            const msg = document.getElementById('conflict-msg');
            msg.innerText = `The file "${filename}" already exists.`;
            modal.style.display = 'flex';

            const cleanup = () => {
                modal.style.display = 'none';
                document.getElementById('btn-rename').onclick = null;
                document.getElementById('btn-replace').onclick = null;
                document.getElementById('btn-use-existing').onclick = null;
                document.getElementById('btn-cancel-upload').onclick = null;
            };

            document.getElementById('btn-rename').onclick = () => { cleanup(); resolve('rename'); };
            document.getElementById('btn-replace').onclick = () => { cleanup(); resolve('replace'); };
            document.getElementById('btn-use-existing').onclick = () => { cleanup(); resolve('use_existing'); };
            document.getElementById('btn-cancel-upload').onclick = () => { cleanup(); resolve('cancel'); };
        });
    }

    async function performUpload(file, statusCallback = () => { }) {
        statusCallback("Checking...");

        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
            ? 'http://localhost:5000'
            : '';
        const API_UPLOAD_BASE = `${API_BASE}/api/upload`;

        try {
            // 1. Check if file exists
            const checkRes = await fetch(`${API_UPLOAD_BASE}/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name })
            });
            const checkData = await checkRes.json();

            let action = 'rename'; // Default behavior if not checked, but checkData gives `exists`

            if (checkData.exists) {
                const choice = await showConflictModal(file.name);
                if (choice === 'cancel') {
                    throw new Error("Upload Cancelled");
                }
                if (choice === 'use_existing') {
                    // Return the existing URL provided by the server (which is .webp)
                    // Ensure leading slash
                    return `/${checkData.url}`;
                }
                action = choice;
            }

            // 2. Upload
            statusCallback("Uploading...");
            const formData = new FormData();
            formData.append('media', file);

            // Add action param
            const uploadUrl = action === 'rename' ? `${API_UPLOAD_BASE}?action=rename` :
                action === 'replace' ? `${API_UPLOAD_BASE}?action=replace` : API_UPLOAD_BASE;

            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                statusCallback("Done!");
                return data.url;
            } else {
                throw new Error(data.msg || "Upload failed");
            }
        } catch (err) {
            console.error(err);
            statusCallback("Error");
            throw err;
        }
    }

    // Initialize Drop Zones
    setupDropZone('featured-drop', 'featured-preview', 'featuredImage');
    setupDropZone('cover-drop', 'cover-preview', 'coverUrl');
    setupStackDropZone();
    setupAttachmentDropZone();
    setupDropZone('helper-drop', null, null, true);
    setupDropZone('audio-drop', null, 'audioUrl'); // Re-using dropzone logic for audio, though we manually handle the input value logic below

    // --- DEMO TRACKS LOGIC ---
    const demoTrackForm = document.getElementById('demoTrackForm');

    // Override the drop zone specifically for the audio input because the helper looks for 'name' on input
    const audioDropInputUrl = document.getElementById('demo-track-url');
    // The setupDropZone above tried to look for input[name="audioUrl"], which doesn't exist. 
    // Let's hook up the success callback for audio drop manually by listening to changes or just fixing the setupDropZone call:
    // Actually, setting up custom logic for audio drop since it saves to audio folder:
    const audioDropZone = document.getElementById('audio-drop');
    if (audioDropZone) {
        const audioFileInput = audioDropZone.querySelector('input[type="file"]');

        audioDropZone.addEventListener('click', () => audioFileInput.click());

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            audioDropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            audioDropZone.addEventListener(eventName, () => audioDropZone.classList.add('dragover'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            audioDropZone.addEventListener(eventName, () => audioDropZone.classList.remove('dragover'));
        });

        audioDropZone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length) handleAudioFile(e.dataTransfer.files[0]);
        });

        audioFileInput.addEventListener('change', function () {
            if (this.files.length) handleAudioFile(this.files[0]);
        });

        async function handleAudioFile(file) {
            const pTag = audioDropZone.querySelector('p');
            pTag.innerText = "Uploading Audio...";
            try {
                const url = await performUpload(file, (msg) => pTag.innerText = msg);
                audioDropInputUrl.value = url;
            } catch (e) {
                console.error("Audio upload failed", e);
                pTag.innerText = "Error uploading audio";
            }
        }
    }

    if (demoTrackForm) {
        demoTrackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('demo-track-title').value;
            const url = document.getElementById('demo-track-url').value;
            const editId = document.getElementById('edit-demo-id').value;
            const submitBtn = document.getElementById('submit-demo-track-btn');

            if (!url) {
                alert("Please upload an audio file first.");
                return;
            }

            try {
                // Fetch current list
                const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                    ? 'http://localhost:5000' : '';

                const listRes = await fetch(`${API_BASE}/api/demo-playlist`);
                let tracks = [];
                if (listRes.ok) {
                    tracks = await listRes.json();
                }

                if (editId) {
                    // Update Mode
                    const idx = tracks.findIndex(t => t.id === editId);
                    if (idx !== -1) {
                        tracks[idx].title = title;
                        tracks[idx].url = url;
                    }
                } else {
                    // Create Mode
                    tracks.push({
                        id: 'track_' + Date.now(),
                        title: title,
                        url: url
                    });
                }

                // Save
                const saveRes = await fetch(`${API_BASE}/api/demo-playlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tracks)
                });

                if (saveRes.ok) {
                    alert(editId ? "Track Updated!" : "Track added to Demo Playlist!");
                    resetDemoForm();
                    loadDemoTracks();
                } else {
                    alert("Failed to save playlist.");
                }

            } catch (err) {
                console.error(err);
                alert("Network error.");
            }
        });
    }

    const cancelDemoEditBtn = document.getElementById('cancel-demo-edit-btn');
    if (cancelDemoEditBtn) {
        cancelDemoEditBtn.addEventListener('click', resetDemoForm);
    }

    function resetDemoForm() {
        if (demoTrackForm) demoTrackForm.reset();
        document.getElementById('edit-demo-id').value = '';
        document.getElementById('audio-drop').querySelector('p').innerText = "Drag & Drop Audio File Here";
        const btn = document.getElementById('submit-demo-track-btn');
        if (btn) btn.innerText = "Add to Playlist";

        const titleEl = document.getElementById('demo-form-title');
        if (titleEl) {
            titleEl.innerText = "Add New Track";
            titleEl.style.color = "";
        }

        if (cancelDemoEditBtn) cancelDemoEditBtn.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const refreshDemoTracksBtn = document.getElementById('refreshDemoTracksBtn');
    if (refreshDemoTracksBtn) refreshDemoTracksBtn.addEventListener('click', loadDemoTracks);

    async function loadDemoTracks() {
        const listContainer = document.getElementById('demo-playlist-list');
        if (!listContainer) return;

        listContainer.innerHTML = '<p>Loading tracks...</p>';
        try {
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000' : '';

            const listRes = await fetch(`${API_BASE}/api/demo-playlist`);
            if (!listRes.ok) throw new Error("Failed to load");

            const tracks = await listRes.json();

            if (tracks.length === 0) {
                listContainer.innerHTML = '<p>No demo tracks currently set.</p>';
                return;
            }

            listContainer.innerHTML = '';
            tracks.forEach((track, index) => {
                const item = document.createElement('div');
                item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #333; gap:10px; background:#1a1a1a; margin-bottom:5px;';

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:15px; flex:1;">
                        <div style="color:#a2d149; font-weight:bold; font-size:1.2em;">${String(index + 1).padStart(2, '0')}</div>
                        <div>
                            <div style="color:#fff; font-weight:bold;">${track.title}</div>
                            <div style="color:#666; font-size:0.85em;">${track.url}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="edit-track-btn" data-id="${track.id}" data-title="${track.title}" data-url="${track.url}" style="background:#4ec5ec; color:black; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Edit</button>
                        <button class="delete-track-btn" data-id="${track.id}" style="background:#ff6347; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                    </div>
                `;

                // Handle Edit Click
                item.querySelector('.edit-track-btn').addEventListener('click', (e) => {
                    const t = e.target;
                    const trackTitle = t.getAttribute('data-title');
                    document.getElementById('demo-track-title').value = trackTitle;
                    document.getElementById('demo-track-url').value = t.getAttribute('data-url');
                    document.getElementById('edit-demo-id').value = t.getAttribute('data-id');

                    document.getElementById('submit-demo-track-btn').innerText = "Update Track";

                    const titleEl = document.getElementById('demo-form-title');
                    if (titleEl) {
                        titleEl.innerText = "Editing Track: " + trackTitle;
                        titleEl.style.color = "#4ec5ec";
                    }

                    if (cancelDemoEditBtn) cancelDemoEditBtn.style.display = 'block';

                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                // Handle Delete Click
                item.querySelector('.delete-track-btn').addEventListener('click', async (e) => {
                    if (!confirm("Remove track?")) return;
                    const idToRemove = e.target.getAttribute('data-id');
                    const updatedTracks = tracks.filter(t => t.id !== idToRemove);

                    const saveRes = await fetch(`${API_BASE}/api/demo-playlist`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedTracks)
                    });

                    if (saveRes.ok) loadDemoTracks();
                });

                listContainer.appendChild(item);
            });

        } catch (err) {
            listContainer.innerHTML = '<p style="color:red;">Error loading tracks.</p>';
        }
    }


    // --- ALBUM FORM (API) ---
    const albumForm = document.getElementById('albumForm');

    // Initial Load
    if (document.getElementById('album-form-section')) {
        loadAlbums();
        const refreshAlbumsBtn = document.getElementById('refreshAlbumsBtn');
        if (refreshAlbumsBtn) refreshAlbumsBtn.addEventListener('click', loadAlbums);

        const cancelAlbumEditBtn = document.getElementById('album-cancel-edit-btn');
        if (cancelAlbumEditBtn) {
            cancelAlbumEditBtn.addEventListener('click', resetAlbumForm);
        }
    }

    if (albumForm) {
        albumForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = albumForm.querySelector('.generate-btn');
            const originalBtnText = btn.innerText;
            btn.disabled = true;

            // 1. Handle Pending Uploads
            if (pendingFiles['coverUrl']) {
                btn.innerText = "Uploading Image...";
                try {
                    const url = await performUpload(pendingFiles['coverUrl']);
                    // Update the hidden input or the object directly?
                    // We need to update the input so FormData picks it up, OR update the object later.
                    // Updating input is safer for FormData.
                    albumForm.querySelector('input[name="coverUrl"]').value = url;
                    delete pendingFiles['coverUrl']; // Clear pending
                } catch (err) {
                    alert("Image Upload Cancelled or Failed. Album not saved.");
                    btn.disabled = false; btn.innerText = originalBtnText;
                    return; // Stop submission
                }
            }

            // 2. Proceed with Submission
            const fd = new FormData(albumForm);

            const albumObj = {
                id: fd.get('id'),
                title: fd.get('title'),
                artist: fd.get('artist'),
                productionDate: fd.get('productionDate'),
                genre: fd.get('genre'),
                description: fd.get('description'),
                coverUrl: fd.get('coverUrl'),
                bandcampId: fd.get('bandcampId'),
                bandcampLink: fd.get('bandcampLink'),
                youtubeLink: fd.get('youtubeLink'),
                spotifyLink: fd.get('spotifyLink'),
                tidalLink: fd.get('tidalLink'),
                color: fd.get('color'),
                type: fd.get('type')
            };

            // Check Edit Mode
            const editModeId = document.getElementById('album-edit-mode-id').value;
            const isEdit = !!editModeId;

            btn.innerText = isEdit ? "Updating Album..." : "Creating Album...";

            try {
                const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                    ? 'http://localhost:5000'
                    : '';
                const API_URL = isEdit ? `${API_BASE}/api/albums/${editModeId}` : `${API_BASE}/api/albums`;

                const method = isEdit ? 'PUT' : 'POST';

                const res = await fetch(API_URL, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(albumObj)
                });

                if (res.ok) {
                    alert(isEdit ? 'Album Updated Successfully!' : 'Album Created Successfully!');
                    resetAlbumForm();
                    loadAlbums();
                } else {
                    alert('Failed to save album');
                }
            } catch (err) {
                console.error(err);
                alert("Network Error");
            } finally {
                btn.disabled = false; btn.innerText = isEdit ? "Update Album" : "Create Album";
            }
        });
    }

    function resetAlbumForm() {
        if (!albumForm) return;
        albumForm.reset();
        document.getElementById('album-edit-mode-id').value = '';

        // Clear Pending
        pendingFiles = {};

        // Reset UI
        const btn = albumForm.querySelector('.generate-btn');
        if (btn) btn.innerText = "Create Album";

        const cancelBtn = document.getElementById('album-cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';

        if (document.getElementById('cover-preview')) {
            document.getElementById('cover-preview').style.display = 'none';
        }

        // Reset DropZone Text?
        const pTags = document.querySelectorAll('.upload-area p');
        pTags.forEach(p => p.innerText = "Drop image here or click to upload");

        // Enable ID field
        albumForm.querySelector('input[name="id"]').readOnly = false;
        albumForm.querySelector('input[name="id"]').style.backgroundColor = '';
    }

    async function loadAlbums() {
        const listContainer = document.getElementById('albums-list');
        if (!listContainer) return;

        listContainer.innerHTML = '<p>Loading albums...</p>';

        try {
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';
            const API_URL = `${API_BASE}/api/albums`;

            const res = await fetch(API_URL);
            const albums = await res.json();

            if (albums.length === 0) {
                listContainer.innerHTML = '<p>No albums found.</p>';
                return;
            }

            listContainer.innerHTML = '';
            albums.forEach(album => {
                const item = document.createElement('div');
                item.className = 'album-list-item';
                item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #333; gap:10px;';

                const thumb = album.coverUrl || 'https://placehold.co/50x50/333/FFF?text=NoImg';

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:15px; flex:1;">
                        <img src="${thumb}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                        <div>
                            <div style="color:#fff; font-weight:bold;">${album.title}</div>
                            <div style="color:#666; font-size:0.85em;">ID: ${album.id} | Type: ${album.type || 'ALBUM'}</div>
                            <div style="margin-top:5px; font-size:0.8em; display:flex; gap:10px;">
                                ${album.bandcampLink ? `<a href="${album.bandcampLink}" target="_blank" style="color:#4ec5ec; text-decoration:none;">Bandcamp</a>` : ''}
                                ${album.youtubeLink ? `<a href="${album.youtubeLink}" target="_blank" style="color:#ff0000; text-decoration:none;">YouTube</a>` : ''}
                                ${album.spotifyLink ? `<a href="${album.spotifyLink}" target="_blank" style="color:#1db954; text-decoration:none;">Spotify</a>` : ''}
                                ${album.tidalLink ? `<a href="${album.tidalLink}" target="_blank" style="color:#fff; text-decoration:none;">Tidal</a>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="edit-album-btn secondary-btn" style="padding:5px 10px; font-size:0.8rem;">Edit</button>
                        <button class="delete-album-btn" style="background:#ff6347; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                    </div>
                `;

                // Events
                item.querySelector('.edit-album-btn').addEventListener('click', () => editAlbum(album));
                item.querySelector('.delete-album-btn').addEventListener('click', () => deleteAlbum(album.id, album.title));

                listContainer.appendChild(item);
            });

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<p style="color:red;">Failed to load albums.</p>';
        }
    }

    async function deleteAlbum(id, title) {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        try {
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';
            const API_URL = `${API_BASE}/api/albums/${id}`;

            const res = await fetch(API_URL, { method: 'DELETE' });
            if (res.ok) {
                // If we were editing this album, reset form
                if (document.getElementById('album-edit-mode-id').value === id) {
                    resetAlbumForm();
                }
                loadAlbums(); // Refresh list
            } else {
                alert("Failed to delete album");
            }
        } catch (err) {
            console.error(err);
            alert("Network Error");
        }
    }

    function editAlbum(album) {
        if (!albumForm) return;

        // Populate fields
        albumForm.querySelector('input[name="id"]').value = album.id;
        albumForm.querySelector('input[name="id"]').readOnly = true;
        albumForm.querySelector('input[name="id"]').style.backgroundColor = '#333';

        albumForm.querySelector('input[name="title"]').value = album.title;
        albumForm.querySelector('input[name="artist"]').value = album.artist;
        albumForm.querySelector('input[name="productionDate"]').value = album.productionDate;
        albumForm.querySelector('input[name="genre"]').value = album.genre;
        albumForm.querySelector('select[name="type"]').value = album.type || 'ALBUM';

        albumForm.querySelector('textarea[name="description"]').value = album.description || '';
        albumForm.querySelector('input[name="coverUrl"]').value = album.coverUrl || '';

        // Previews
        if (album.coverUrl) {
            const preview = document.getElementById('cover-preview');
            preview.src = album.coverUrl;
            preview.style.display = 'block';
        }

        albumForm.querySelector('input[name="color"]').value = album.color || '#000000';

        // Links
        albumForm.querySelector('input[name="bandcampId"]').value = album.bandcampId || '';
        albumForm.querySelector('input[name="bandcampLink"]').value = album.bandcampLink || '';
        albumForm.querySelector('input[name="youtubeLink"]').value = album.youtubeLink || '';
        albumForm.querySelector('input[name="spotifyLink"]').value = album.spotifyLink || '';
        albumForm.querySelector('input[name="tidalLink"]').value = album.tidalLink || '';

        // Set Edit Mode
        document.getElementById('album-edit-mode-id').value = album.id;

        const btn = albumForm.querySelector('.generate-btn');
        btn.innerText = "Update Album";

        const cancelBtn = document.getElementById('album-cancel-edit-btn');
        cancelBtn.style.display = 'block';

        // Scroll to form
        document.getElementById('album-form-section').scrollIntoView({ behavior: 'smooth' });
    }

    // --- GALLERY FORM (API) ---
    const galleryForm = document.getElementById('galleryForm');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');

    // --- ATTACHMENTS LOGIC ---
    let currentAttachments = [];
    const btnAddAttachment = document.getElementById('btn-add-attachment');
    const attachList = document.getElementById('attachments-display-list');
    const hiddenAttJson = document.getElementById('hidden-attachments-json');

    function renderAttachments() {
        if (!attachList) return;
        attachList.innerHTML = '';
        currentAttachments.forEach((att, index) => {
            const li = document.createElement('li');
            li.style.cssText = 'display:flex; justify-content:space-between; background:#333; padding:5px 10px; border-radius:4px; align-items:center;';
            li.innerHTML = `
                <span><strong>${att.name || 'Unnamed'}</strong> <br> <a href="${att.link}" target="_blank" style="color:#b2c982; font-size:0.8em; word-break: break-all;">${att.link}</a></span>
                <button type="button" class="remove-att-btn" data-index="${index}" style="background:#ff6347; color:white; border:none; border-radius:3px; cursor:pointer; padding: 3px 8px;">X</button>
            `;
            attachList.appendChild(li);
        });

        // Bind remove buttons
        document.querySelectorAll('.remove-att-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                currentAttachments.splice(idx, 1);
                updateAttachmentsJson();
            });
        });
    }

    function updateAttachmentsJson() {
        if (hiddenAttJson) {
            hiddenAttJson.value = JSON.stringify(currentAttachments);
        }
        renderAttachments();
    }

    if (btnAddAttachment) {
        btnAddAttachment.addEventListener('click', async () => {
            const nameInput = document.getElementById('att-name');
            const urlInput = document.getElementById('att-url');
            const fileInput = document.getElementById('att-file');

            let name = nameInput.value.trim();
            let link = urlInput.value.trim();
            const file = fileInput.files[0];

            if (!name && !file && !link) {
                alert("Please provide at least a file or a URL.");
                return;
            }

            const originalBtnText = btnAddAttachment.innerText;
            btnAddAttachment.disabled = true;

            try {
                if (file) {
                    if (!name) name = file.name;
                    btnAddAttachment.innerText = "Uploading...";

                    const formData = new FormData();
                    formData.append('file', file);

                    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                        ? 'http://localhost:5000'
                        : '';

                    const res = await fetch(`${API_BASE}/api/upload?action=rename`, {
                        method: 'POST',
                        body: formData
                    });

                    if (!res.ok) throw new Error("Failed to upload file");
                    const data = await res.json();
                    link = data.url;
                }

                if (!link) {
                    alert("A valid URL or file upload is required.");
                    btnAddAttachment.disabled = false;
                    btnAddAttachment.innerText = originalBtnText;
                    return;
                }

                if (!name) name = link.split('/').pop() || "Attachment";

                currentAttachments.push({ name, link });
                updateAttachmentsJson();

                // Clear inputs
                nameInput.value = '';
                urlInput.value = '';
                fileInput.value = '';

            } catch (err) {
                console.error("Attachment Error:", err);
                alert("Error adding attachment.");
            } finally {
                btnAddAttachment.disabled = false;
                btnAddAttachment.innerText = originalBtnText;
            }
        });
    }

    // Section Logic
    if (addSectionBtn && sectionsContainer) {
        addSectionBtn.addEventListener('click', () => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'section-item form-group full-width';
            sectionDiv.style.border = '1px solid #444';
            sectionDiv.style.padding = '15px';
            sectionDiv.style.marginBottom = '15px';

            sectionDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>New Section</h4>
                    <button type="button" class="remove-section" style="background:red; color:white; border:none; padding:5px;">X</button>
                </div>
                <label>Section Title</label>
                <input type="text" class="section-title" placeholder="Title">
                <label>Section Text</label>
                <textarea class="section-text" rows="3" placeholder="Description..."></textarea>
                <label>Section Images (Comma separated)</label>
                <input type="text" class="section-images" placeholder="img1.jpg, img2.jpg">
            `;
            sectionDiv.querySelector('.remove-section').addEventListener('click', () => sectionDiv.remove());
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    if (galleryForm) {
        // Initial load
        loadPosts();

        // Refresh Button
        const refreshPostsBtn = document.getElementById('refreshPostsBtn');
        if (refreshPostsBtn) refreshPostsBtn.addEventListener('click', loadPosts);

        // Cancel Edit Button
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                resetGalleryForm();
            });
        }

        galleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = galleryForm.querySelector('.generate-btn');
            const originalBtnText = btn.innerText;
            btn.disabled = true;

            // 1. Handle Pending Uploads
            if (pendingFiles['featuredImage']) {
                btn.innerText = "Uploading Image...";
                try {
                    const url = await performUpload(pendingFiles['featuredImage']);
                    const input = galleryForm.querySelector('input[name="featuredImage"]');
                    input.value = url;

                    delete pendingFiles['featuredImage'];
                } catch (err) {
                    console.error('Upload failed:', err);
                    alert("Image Upload Cancelled or Failed. Post not saved.");
                    btn.disabled = false; btn.innerText = originalBtnText;
                    return;
                }
            }

            const fd = new FormData(galleryForm);

            // Process Data
            const stackStr = fd.get('stackImages');
            const stackArray = stackStr ? stackStr.split(',').map(s => s.trim()) : [];
            const featuredImage = fd.get('featuredImage');

            const sections = [];
            const sectionItems = sectionsContainer ? sectionsContainer.querySelectorAll('.section-item') : [];
            sectionItems.forEach(item => {
                const title = item.querySelector('.section-title').value;
                const text = item.querySelector('.section-text').value;
                const imgStr = item.querySelector('.section-images').value;
                const images = imgStr ? imgStr.split(',').map(s => s.trim()) : [];
                if (title || text) {
                    const sec = { title, text };
                    if (images.length > 0) sec.images = images;
                    sections.push(sec);
                }
            });

            let attachments = [];
            try {
                const attStr = fd.get('attachments');
                if (attStr) attachments = JSON.parse(attStr);
            } catch (err) { console.warn("Invalid JSON attachments"); }

            const galleryObj = {
                id: fd.get('id'),
                year: parseInt(fd.get('year')),
                date: fd.get('date'),
                location: fd.get('location'),
                title: fd.get('title'),
                text: fd.get('text'),
                stackImages: stackArray,
                featuredImage: featuredImage || "",
                attachments: attachments,
                sections: sections
            };

            // Check Edit Mode
            const editModeId = document.getElementById('edit-mode-id').value;
            const isEdit = !!editModeId;

            // SUBMIT TO API
            btn.innerText = isEdit ? "Updating..." : "Creating...";

            try {
                const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                    ? 'http://localhost:5000'
                    : '';
                const API_URL = isEdit ? `${API_BASE}/api/posts/${editModeId}` : `${API_BASE}/api/posts`;

                const method = isEdit ? 'PUT' : 'POST';

                const res = await fetch(API_URL, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(galleryObj)
                });

                const result = await res.json();

                if (res.ok) {
                    alert(isEdit ? 'Post Updated Successfully!' : 'Success! Post created and subscribers notified.');
                    resetGalleryForm();
                    loadPosts(); // Refresh list
                } else {
                    alert(`Error: ${result.msg || 'Failed to save post'}`);
                }
            } catch (err) {
                console.error(err);
                alert("Network Error: Ensure server is running.");
            } finally {
                btn.disabled = false; btn.innerText = isEdit ? "Update Post" : "Create Post & Notify Subscribers";
            }
        });
    }

    function resetGalleryForm() {
        if (!galleryForm) return;
        galleryForm.reset();
        document.getElementById('edit-mode-id').value = '';

        // Reset UI
        const btn = galleryForm.querySelector('.generate-btn');
        if (btn) btn.innerText = "Create Post & Notify Subscribers";

        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';

        if (sectionsContainer) sectionsContainer.innerHTML = '';
        if (document.getElementById('featured-preview')) {
            document.getElementById('featured-preview').style.display = 'none';
        }

        // Reset Attachments
        if (hiddenAttJson) {
            currentAttachments = [];
            updateAttachmentsJson();
        }

        // Reset Stack Images
        currentStackImages = [];
        updateStackImagesDict();

        // Enable ID field in case it was disabled during edit
        galleryForm.querySelector('input[name="id"]').readOnly = false;
        galleryForm.querySelector('input[name="id"]').style.backgroundColor = '';
    }

    async function loadPosts() {
        const listContainer = document.getElementById('posts-list');
        if (!listContainer) return;

        listContainer.innerHTML = '<p>Loading posts...</p>';

        try {
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';
            const API_URL = `${API_BASE}/api/posts`;

            const res = await fetch(API_URL);
            const posts = await res.json();

            if (posts.length === 0) {
                listContainer.innerHTML = '<p>No posts found.</p>';
                return;
            }

            listContainer.innerHTML = '';
            posts.forEach(post => {
                const item = document.createElement('div');
                item.className = 'post-list-item';
                item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #333; gap:10px;';

                const thumb = post.featuredImage || 'https://placehold.co/50x50/333/FFF?text=NoImg';

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:15px; flex:1;">
                        <img src="${thumb}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                        <div>
                            <div style="color:#fff; font-weight:bold;">${post.title}</div>
                            <div style="color:#666; font-size:0.85em;">ID: ${post.id} | Year: ${post.year}</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="edit-post-btn secondary-btn" style="padding:5px 10px; font-size:0.8rem;">Edit</button>
                        <button class="delete-post-btn" style="background:#ff6347; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                    </div>
                `;

                // Events
                item.querySelector('.edit-post-btn').addEventListener('click', () => editPost(post));
                item.querySelector('.delete-post-btn').addEventListener('click', () => deletePost(post.id, post.title));

                listContainer.appendChild(item);
            });

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<p style="color:red;">Failed to load posts.</p>';
        }
    }

    async function deletePost(id, title) {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? `http://localhost:5000/api/posts/${id}`
                : `/api/posts/${id}`;

            const res = await fetch(API_URL, { method: 'DELETE' });
            if (res.ok) {
                // If we were editing this post, reset form
                if (document.getElementById('edit-mode-id').value === id) {
                    resetGalleryForm();
                }
                loadPosts(); // Refresh list
            } else {
                alert("Failed to delete post");
            }
        } catch (err) {
            console.error(err);
            alert("Network Error");
        }
    }

    function editPost(post) {
        if (!galleryForm) return;

        // 1. Populate standard fields
        galleryForm.querySelector('input[name="id"]').value = post.id;
        galleryForm.querySelector('input[name="id"]').readOnly = true; // Cannot change ID
        galleryForm.querySelector('input[name="id"]').style.backgroundColor = '#333';

        galleryForm.querySelector('input[name="title"]').value = post.title;
        galleryForm.querySelector('input[name="year"]').value = post.year;
        galleryForm.querySelector('input[name="date"]').value = post.date;
        galleryForm.querySelector('input[name="location"]').value = post.location || '';
        galleryForm.querySelector('textarea[name="text"]').value = post.text;

        galleryForm.querySelector('input[name="featuredImage"]').value = post.featuredImage || '';
        if (post.featuredImage) {
            const preview = document.getElementById('featured-preview');
            preview.src = post.featuredImage;
            preview.style.display = 'block';
        }

        // 1.5 Populate Stack Images
        if (post.stackImages && post.stackImages.length > 0) {
            currentStackImages = [...post.stackImages];
        } else {
            currentStackImages = [];
        }
        updateStackImagesDict();

        if (post.attachments) {
            currentAttachments = [...post.attachments];
        } else {
            currentAttachments = [];
        }
        updateAttachmentsJson();

        // 2. Populate Sections
        if (sectionsContainer) {
            sectionsContainer.innerHTML = ''; // Clear existing
            if (post.sections && post.sections.length > 0) {
                post.sections.forEach(sec => {
                    // Reuse creating logic
                    const sectionDiv = document.createElement('div');
                    sectionDiv.className = 'section-item form-group full-width';
                    sectionDiv.style.border = '1px solid #444';
                    sectionDiv.style.padding = '15px';
                    sectionDiv.style.marginBottom = '15px';

                    sectionDiv.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h4>Section</h4>
                            <button type="button" class="remove-section" style="background:red; color:white; border:none; padding:5px;">X</button>
                        </div>
                        <label>Section Title</label>
                        <input type="text" class="section-title" placeholder="Title" value="${sec.title || ''}">
                        <label>Section Text</label>
                        <textarea class="section-text" rows="3" placeholder="Description...">${sec.text || ''}</textarea>
                        <label>Section Images (Comma separated)</label>
                        <input type="text" class="section-images" placeholder="img1.jpg, img2.jpg" value="${sec.images ? sec.images.join(', ') : ''}">
                    `;
                    sectionDiv.querySelector('.remove-section').addEventListener('click', () => sectionDiv.remove());
                    sectionsContainer.appendChild(sectionDiv);
                });
            }
        }

        // 3. Set Edit Mode
        document.getElementById('edit-mode-id').value = post.id;

        const btn = galleryForm.querySelector('.generate-btn');
        btn.innerText = "Update Post";

        const cancelBtn = document.getElementById('cancel-edit-btn');
        cancelBtn.style.display = 'block';

        // Scroll to form
        document.getElementById('gallery-form-section').scrollIntoView({ behavior: 'smooth' });
    }


    // --- TEST LINKS LOGIC ---
    const testLinks = document.querySelectorAll('.test-link-btn');
    testLinks.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find the input in the same container
            const input = btn.previousElementSibling;
            if (input && input.value) {
                btn.href = input.value;
            } else {
                e.preventDefault();
                alert("Please enter a URL first.");
            }
        });
    });

    // --- BROADCAST FORM ---
    const broadcastForm = document.getElementById('broadcastForm');
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!confirm("Are you sure you want to email ALL subscribers?")) return;

            const btn = broadcastForm.querySelector('button');
            const originalText = btn.innerText;
            btn.disabled = true; btn.innerText = "Sending...";

            const fd = new FormData(broadcastForm);
            const data = {
                subject: fd.get('subject'),
                message: fd.get('message'),
                link: fd.get('link'),
                linkText: fd.get('linkText')
            };

            try {
                const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000/api/newsletter/broadcast'
                    : '/api/newsletter/broadcast';

                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                alert(result.msg);
                if (res.ok) broadcastForm.reset();

            } catch (err) {
                console.error(err);
                alert("Failed to send broadcast.");
            } finally {
                btn.disabled = false; btn.innerText = originalText;
            }
        });
    }

    // --- FILE MANAGER LOGIC ---
    let allServerFiles = [];
    const fileGrid = document.getElementById('file-tracker-grid');
    const fileFilterSelect = document.getElementById('file-filter-select');
    const refreshFilesBtn = document.getElementById('refresh-files-btn');

    if (refreshFilesBtn) refreshFilesBtn.addEventListener('click', loadFileTracker);
    if (fileFilterSelect) fileFilterSelect.addEventListener('change', renderFileTracker);

    async function loadFileTracker() {
        if (!fileGrid) return;
        fileGrid.innerHTML = '<p>Scanning directories and databases... This may take a moment.</p>';

        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api/files'
            : '/api/files';

        try {
            const res = await fetch(API_URL);
            allServerFiles = await res.json();
            renderFileTracker();
        } catch (err) {
            console.error(err);
            fileGrid.innerHTML = '<p style="color:red;">Error connecting to file server.</p>';
        }
    }

    function renderFileTracker() {
        if (!fileGrid) return;
        fileGrid.innerHTML = '';

        const filterValue = fileFilterSelect ? fileFilterSelect.value : 'all';

        const filteredFiles = allServerFiles.filter(f => {
            if (filterValue === 'used') return f.isUsed;
            if (filterValue === 'unused') return !f.isUsed;
            return true;
        });

        if (filteredFiles.length === 0) {
            fileGrid.innerHTML = '<p>No files matched the filter criteria.</p>';
            return;
        }

        filteredFiles.forEach(f => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: #2a2a2a; 
                border: 1px solid ${f.isUsed ? '#4caf50' : '#f44336'}; 
                border-radius: 5px; 
                padding: 10px; 
                display: flex; 
                flex-direction: column; 
                gap: 10px;
            `;

            // Convert bytes to MB
            const mbSize = (f.size / (1024 * 1024)).toFixed(2);

            card.innerHTML = `
                <div style="flex-grow: 1;">
                    <a href="${window.location.origin}/${f.path}" target="_blank" style="color: #fff; text-decoration: none; word-break: break-all; font-weight: bold; font-size: 0.9em; display:block; margin-bottom: 5px;">
                        ${f.filename}
                    </a>
                    <div style="font-size: 0.8em; color: #aaa;">
                        <div>Dir: <b>${f.directory}</b></div>
                        <div>Size: <b>${mbSize} MB</b></div>
                        <div style="margin-top: 5px; color: ${f.isUsed ? '#4caf50' : '#f44336'};">
                            ${f.isUsed ? '<i class="fa-solid fa-check"></i> Used' : '<i class="fa-solid fa-triangle-exclamation"></i> Orphan'}
                        </div>
                    </div>
                </div>
            `;

            // Sub-list of links if used
            if (f.isUsed && f.usedIn && f.usedIn.length > 0) {
                const usageList = document.createElement('ul');
                usageList.style.cssText = 'font-size: 0.75em; padding-left: 15px; margin: 0; color: #88ce02;';
                f.usedIn.forEach(item => {
                    usageList.innerHTML += `<li>${item}</li>`;
                });
                card.appendChild(usageList);
            } else {
                const delBtn = document.createElement('button');
                delBtn.className = 'delete-btn';
                delBtn.style.cssText = 'width: 100%; padding: 5px; font-size: 0.85em; margin-top: auto;';
                delBtn.innerHTML = 'Delete Asset';
                delBtn.onclick = () => deletePhysicalFile(f.path, card);
                card.appendChild(delBtn);
            }

            fileGrid.appendChild(card);
        });
    }

    async function deletePhysicalFile(filePath, cardElement) {
        if (!confirm(`Are you sure you want to completely delete ${filePath} from the server? This cannot be undone.`)) return;

        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api/files'
            : '/api/files';

        try {
            const res = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });

            if (res.ok) {
                cardElement.remove();
                // Optional: remove from array locally
                allServerFiles = allServerFiles.filter(f => f.path !== filePath);
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to delete file.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Could not delete file.");
        }
    }

    // --- SUBSCRIBERS LOGIC ---
    const refreshSubBtn = document.getElementById('refreshSubscribers');
    if (refreshSubBtn) {
        refreshSubBtn.addEventListener('click', loadSubscribers);
    }

    async function loadSubscribers() {
        const listContainer = document.getElementById('subscribers-list');
        listContainer.innerHTML = '<p>Loading...</p>';

        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000/api/newsletter'
                : '/api/newsletter';

            const res = await fetch(API_URL); // In real app, attach token header
            const subs = await res.json();

            if (subs.length === 0) {
                listContainer.innerHTML = '<p>No subscribers yet.</p>';
                return;
            }

            listContainer.innerHTML = '';
            subs.forEach(sub => {
                const item = document.createElement('div');
                item.style.cssText = 'display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333;';
                item.innerHTML = `
                    <span>${sub.email} <small style="color:#666;">(${new Date(sub.subscribedAt).toLocaleDateString()})</small></span>
                    <button class="delete-sub" data-id="${sub._id}" style="color:red; background:none; border:none; cursor:pointer;">X</button>
                `;

                // Delete Logic
                item.querySelector('.delete-sub').addEventListener('click', async (e) => {
                    if (!confirm('Delete this subscriber?')) return;
                    const id = e.target.dataset.id;
                    const delRes = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (delRes.ok) item.remove();
                });

                listContainer.appendChild(item);
            });

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<p style="color:red;">Failed to load subscribers.</p>';
        }
    }

});
