// Gallery Page Logic

document.addEventListener('DOMContentLoaded', () => {

    // --- Dynamic Gallery Rendering ---
    const galleryContainer = document.querySelector('.gallery-container');



    function openDetail(id) {
        window.location.href = `gallery-detail.html?id=${id}`;
    }

    // --- Fetch Data from API ---
    // --- Fetch Data from API ---
    // Determine API URL based on current context
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If serving from port 5000 (backend), use relative path. Otherwise use absolute localhost:5000.
    const API_URL = (isLocalhost && window.location.port === '5000')
        ? '/api/posts'
        : 'http://localhost:5000/api/posts';

    console.log("Fetching from:", API_URL);

    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
        })
        .then(posts => {
            console.log("Posts fetched:", posts);
            renderGallery(posts);
        })
        .catch(err => {
            console.error("Error fetching posts:", err);
            const container = document.querySelector('.gallery-container');
            if (container) {
                container.innerHTML = `
                    <div style="text-align:center; padding: 40px; color: #ff6347;">
                        <h3>Unable to load posts</h3>
                        <p>Error: ${err.message}</p>
                        <p>Running on: ${window.location.host}</p>
                        <p>Target API: ${API_URL}</p>
                        <p>Ensure the server (node server.js) is running.</p>
                    </div>`;
            }
        });

    function renderGallery(posts = []) {
        console.log("Render Gallery Called");
        // Re-query container for safety, though DOMContentLoaded implies it exists
        const galleryContainer = document.querySelector('.gallery-container');

        if (!galleryContainer) {
            console.error("Gallery Container not found!");
            return;
        }
        if (posts.length === 0) {
            galleryContainer.innerHTML = '<p class="no-posts">No posts found. Add some in the Admin Panel!</p>';
            return;
        }

        galleryContainer.innerHTML = ''; // Clear existing content

        // Group by Year
        const postsByYear = {};
        posts.forEach(post => {
            if (!postsByYear[post.year]) {
                postsByYear[post.year] = [];
            }
            postsByYear[post.year].push(post);
        });

        // Sort Years Descending
        const years = Object.keys(postsByYear).sort((a, b) => b - a);

        years.forEach(year => {
            // Add Year Header
            const yearHeader = document.createElement('div');
            yearHeader.className = 'year-header';
            yearHeader.textContent = year;
            galleryContainer.appendChild(yearHeader);

            // Add Posts for this Year
            postsByYear[year].forEach(post => {
                const postEl = document.createElement('div');
                postEl.className = 'timeline-post';
                postEl.dataset.id = post.id;

                // Helper to generate stack images HTML
                const stackHtml = (post.stackImages && post.stackImages.length > 0)
                    ? post.stackImages.map((img, i) => `
                        <img src="${img}" alt="Stack ${i + 1}" class="stack-img" loading="lazy"
                            onerror="this.src='https://placehold.co/120x120/333/FFF?text=Img'">
                    `).join('')
                    : '';

                const hasFeatured = post.featuredImage && typeof post.featuredImage === 'string' && post.featuredImage.trim() !== '';
                const textOnlyClass = hasFeatured ? '' : 'text-only';
                const featuredHtml = hasFeatured ? `
                    <div class="featured-image-container">
                        <img src="${post.featuredImage}" alt="${post.title} Featured" class="featured-image" loading="lazy"
                            onerror="this.src='https://placehold.co/600x400/181818/b2c982?text=Featured'">
                    </div>` : '';

                postEl.innerHTML = `
                    <div class="post-meta">
                        <div class="meta-date">${post.date}</div>
                        <div class="meta-year-small">${post.year}</div>
                        <div class="timeline-point"></div>
                        <div class="timeline-line"></div>
                    </div>
                    
                    <div class="post-content ${textOnlyClass}">
                        <div class="content-glass-box">
                            <h3 class="post-artist-name">${post.title}</h3>
                            ${stackHtml ? `<div class="image-stack">${stackHtml}</div>` : ''}
                            <div class="post-text-container">
                                <p class="post-text">${post.text}</p>
                            </div>
                            <button class="read-more-btn">Read More</button>
                        </div>
                        
                        ${featuredHtml}
                    </div>
                `;

                galleryContainer.appendChild(postEl);
            });
        });

        // Re-initialize interactions after rendering
        initializeInteractions();
    }

    // Call render
    // renderGallery(); // Moved to fetch callback

    function initializeInteractions() {
        console.log("Initializing Interactions");

        // --- View Toggle Logic ---
        const toggleBtn = document.querySelector('.view-toggle-btn');
        const galleryContainer = document.querySelector('.gallery-container');

        if (toggleBtn && galleryContainer) {
            const icon = toggleBtn.querySelector('i');

            // Remove old listeners to prevent duplicates if re-rendered
            // (In this simple impl, we just assume clean slate or overwrite)
            toggleBtn.onclick = null; // Clear previous

            toggleBtn.onclick = () => {
                galleryContainer.classList.toggle('compact');
                toggleBtn.classList.toggle('active');

                if (galleryContainer.classList.contains('compact')) {
                    icon.className = 'fa-solid fa-expand';
                } else {
                    icon.className = 'fa-solid fa-compress';
                }
            };
        }

        // --- Interactive Timeline Rail Logic ---
        const rail = document.querySelector('.timeline-rail');
        const posts = document.querySelectorAll('.timeline-post');

        if (rail && posts.length > 0) {
            rail.innerHTML = ''; // Clear existing dots

            // 1. Generate Dots
            posts.forEach((post, index) => {
                const dot = document.createElement('div');
                dot.classList.add('rail-dot');

                const dateEl = post.querySelector('.meta-date');
                const dateText = dateEl ? dateEl.innerText : `Post ${index + 1}`;
                dot.setAttribute('data-date', dateText);
                dot.dataset.index = index;

                dot.addEventListener('click', () => {
                    post.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });

                rail.appendChild(dot);
            });

            // 2. Fish-Eye Effect
            const dots = document.querySelectorAll('.rail-dot');
            const baseScale = 1;
            const maxScale = 1.8;
            const effectRange = 80;

            rail.onmousemove = (e) => {
                const mouseY = e.clientY;

                dots.forEach(dot => {
                    const rect = dot.getBoundingClientRect();
                    const dotY = rect.top + rect.height / 2;
                    const dist = Math.abs(mouseY - dotY);

                    if (dist < effectRange) {
                        const scale = baseScale + (maxScale - baseScale) * (1 - Math.pow(dist / effectRange, 2));
                        dot.style.transform = `scale(${scale})`;

                        if (dist < 40) {
                            dot.classList.add('hovered');
                        } else {
                            dot.classList.remove('hovered');
                        }
                    } else {
                        dot.style.transform = `scale(${baseScale})`;
                        dot.classList.remove('hovered');
                    }
                });
            };

            rail.onmouseleave = () => {
                dots.forEach(dot => {
                    dot.style.transform = `scale(${baseScale})`;
                    dot.classList.remove('hovered');
                });
            };

            // 3. Highlight dot
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = Array.from(posts).indexOf(entry.target);
                        dots.forEach(d => d.classList.remove('active'));
                        if (dots[index]) dots[index].classList.add('active');
                    }
                });
            }, {
                rootMargin: '-50% 0px -50% 0px',
                threshold: 0
            });

            posts.forEach(post => observer.observe(post));
        }

        // Attach Click Listeners to Posts for Modal
        posts.forEach((post, index) => {
            const openPostModal = (e) => {
                e.stopPropagation();
                openDetail(post.dataset.id);
            };

            const title = post.querySelector('.post-artist-name');
            if (title) title.addEventListener('click', openPostModal);

            const featImg = post.querySelector('.featured-image-container');
            if (featImg) featImg.addEventListener('click', openPostModal);

            const readMoreBtn = post.querySelector('.read-more-btn');
            if (readMoreBtn) readMoreBtn.addEventListener('click', openPostModal);
        });
        // Navigate to Detail Page (Moved to top scope for hoisting safety)
        // const openDetail = (id) => { ... };

        /* 
           Modal logic replaced by dedicated detail page navigation.
        */


        // --- Gallery Modal Logic (Folder System) ---
        const modal = document.getElementById('gallery-modal');
        const closeModal = modal.querySelector('.close-modal');

        // --- Event Listeners and Modal Logic ---

        // Update Compact Click Logic (Override previous placeholder)
        // We need to find the existing listener... or just add a new specific one that checks class
        // actually, let's replace the placeholder logic in lines 25-38 if possible, or just add logic here.
        // The previous listener logged to console.

        // Better: Add a global listener for modal triggers that respects compact state
        galleryContainer.addEventListener('click', (e) => {
            if (galleryContainer.classList.contains('compact')) {
                const post = e.target.closest('.timeline-post');
                if (post) {
                    const id = post.dataset.id;
                    if (id) openDetail(id);
                }
            }
        });

        // Close Modal Logic
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Unlock Body Scroll
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        // --- Search Functionality ---
        const searchInput = document.querySelector('.search-input');

        if (searchInput) {
            // Store original text content for safe restoring
            posts.forEach(post => {
                const fields = [
                    post.querySelector('.post-artist-name'),
                    post.querySelector('.meta-date'),
                    post.querySelector('.post-text')
                ];

                fields.forEach(field => {
                    if (field) {
                        field.dataset.originalText = field.innerText;
                    }
                });
            });

            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const regex = new RegExp(`(${term})`, 'gi'); // Capture group for highlighting

                posts.forEach(post => {
                    const titleEl = post.querySelector('.post-artist-name');
                    const dateEl = post.querySelector('.meta-date');
                    const textEl = post.querySelector('.post-text');

                    // If search is empty, restore everything
                    if (term === '') {
                        post.style.display = 'flex'; // Restore layout
                        [titleEl, dateEl, textEl].forEach(el => {
                            if (el && el.dataset.originalText) el.innerHTML = el.dataset.originalText;
                        });
                        return;
                    }

                    // Check for matches
                    const titleText = titleEl ? titleEl.dataset.originalText.toLowerCase() : '';
                    const dateText = dateEl ? dateEl.dataset.originalText.toLowerCase() : '';
                    const descText = textEl ? textEl.dataset.originalText.toLowerCase() : '';

                    const matches = titleText.includes(term) || dateText.includes(term) || descText.includes(term);

                    if (matches) {
                        post.style.display = 'flex';

                        // Apply Highlighting
                        [titleEl, dateEl, textEl].forEach(el => {
                            if (el && el.dataset.originalText) {
                                // Replace matches with wrapped span
                                // Use the dataset text as the source to search in
                                const text = el.dataset.originalText;
                                if (text.toLowerCase().includes(term)) {
                                    el.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
                                } else {
                                    el.innerHTML = text; // Reset if no match in this specific field
                                }
                            }
                        });
                    } else {
                        post.style.display = 'none';
                    }
                });

                // Re-trigger layout checks if needed (e.g. timeline line gaps)
                // Ideally, we'd hide the "Year" header if no posts under it match, but let's stick to posts first.
            });
        }
    }
});
