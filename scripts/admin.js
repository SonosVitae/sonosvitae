document.addEventListener('DOMContentLoaded', () => {

    // Tab Switching
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.form-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById(`${target}-form-section`).classList.add('active');
        });
    });

    // Output Code
    const codeBlock = document.getElementById('outputCode');

    // Handle Album Form
    const albumForm = document.getElementById('albumForm');
    if (albumForm) {
        albumForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(albumForm);

            // Construct Object
            const albumObj = {
                id: fd.get('id'),
                title: fd.get('title'),
                artist: fd.get('artist'),
                productionDate: fd.get('productionDate'),
                genre: fd.get('genre'),
                description: fd.get('description'),
                coverUrl: fd.get('coverUrl'),
                bandcampId: fd.get('bandcampId') || "",
                bandcampLink: fd.get('bandcampLink') || "#",
                youtubeLink: fd.get('youtubeLink') || "#",
                spotifyLink: fd.get('spotifyLink') || "#",
                tidalLink: fd.get('tidalLink') || "#",
                color: fd.get('color'),
                type: fd.get('type')
            };

            // Format Output
            let json = JSON.stringify(albumObj, null, 4);
            // Strip quotes from keys
            json = json.replace(/"([^"]+)":/g, '$1:');

            const output = `    // Paste this into albums.js array:\n    ${json},`;

            codeBlock.textContent = output;
        });
    }

    // Handle Gallery Form
    const galleryForm = document.getElementById('galleryForm');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');

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

            // Remove logic
            sectionDiv.querySelector('.remove-section').addEventListener('click', () => {
                sectionDiv.remove();
            });

            sectionsContainer.appendChild(sectionDiv);
        });
    }

    if (galleryForm) {
        galleryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(galleryForm);

            // Process stack images (comma list to array)
            const stackStr = fd.get('stackImages');
            const stackArray = stackStr ? stackStr.split(',').map(s => s.trim()) : [];
            const featuredImage = fd.get('featuredImage');

            // Process sections
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

            // Process attachments (JSON parse safely)
            let attachments = [];
            try {
                const attStr = fd.get('attachments');
                if (attStr) attachments = JSON.parse(attStr);
            } catch (err) {
                alert("Invalid JSON for Attachments! defaulting to empty.");
            }

            const galleryObj = {
                id: fd.get('id'),
                year: parseInt(fd.get('year')),
                date: fd.get('date'),
                location: fd.get('location'),
                title: fd.get('title'),
                text: fd.get('text'),
            };

            // Only add images if they exist - UPDATE: User wants them always present
            galleryObj.stackImages = stackArray;
            galleryObj.featuredImage = featuredImage || "";

            if (attachments.length > 0) galleryObj.attachments = attachments;
            if (sections.length > 0) galleryObj.sections = sections;

            // USE PLACEHOLDER FOR TEXT TO HANDLE BACKTICKS
            const rawText = galleryObj.text;
            galleryObj.text = "%%TEXT_PLACEHOLDER%%";

            let json = JSON.stringify(galleryObj, null, 4);
            // Optional: Strip quotes from keys to match existing style (and satisfy user)
            json = json.replace(/"([^"]+)":/g, '$1:');

            // Replace Placeholder with Backticked String
            // 1. Escape backticks in original text
            const safeText = rawText.replace(/`/g, '\\`');
            // 2. Replace the JSON string value
            json = json.replace('"%%TEXT_PLACEHOLDER%%"', `\`${safeText}\``);

            const output = `    // Paste this into scripts/gallery-data.js array:\n    ${json},`;

            codeBlock.textContent = output;
        });
    }

    // Copy Button
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                copyBtn.textContent = "Copied!";
                setTimeout(() => copyBtn.textContent = "Copy to Clipboard", 2000);
            });
        });
    }
});
