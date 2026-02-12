// Gallery Page Logic

document.addEventListener('DOMContentLoaded', () => {

    // --- View Toggle Logic ---
    const toggleBtn = document.querySelector('.view-toggle-btn');
    const container = document.querySelector('.gallery-container');

    if (toggleBtn && container) {
        const icon = toggleBtn.querySelector('i');

        toggleBtn.addEventListener('click', () => {
            container.classList.toggle('compact');
            toggleBtn.classList.toggle('active');

            // Change Icon based on state
            if (container.classList.contains('compact')) {
                icon.className = 'fa-solid fa-expand'; // Arrows pointing out (expand)
            } else {
                icon.className = 'fa-solid fa-compress'; // Arrows pointing in (compress)
            }
        });

        // Compact View Click Handler
        container.addEventListener('click', (e) => {
            if (container.classList.contains('compact')) {
                const post = e.target.closest('.timeline-post');
                if (post) {
                    // Placeholder action
                    // In real implementation, this would open a modal or expand the post inline
                    console.log("Post clicked in compact view:", post);
                    // alert("Opening post details... (Implementation coming later)");
                    // For now, let's just gently expand it temporarily or do nothing but acknowledge
                    post.style.transform = 'scale(1.02)';
                    setTimeout(() => post.style.transform = '', 200);
                }
            }
        });
    }

    // --- Interactive Timeline Rail Logic ---
    const rail = document.querySelector('.timeline-rail');
    const posts = document.querySelectorAll('.timeline-post');

    if (rail && posts.length > 0) {
        // 1. Generate Dots
        posts.forEach((post, index) => {
            const dot = document.createElement('div');
            dot.classList.add('rail-dot');

            // Get Date for tooltip
            const dateEl = post.querySelector('.meta-date');
            const dateText = dateEl ? dateEl.innerText : `Post ${index + 1}`;
            dot.setAttribute('data-date', dateText);
            dot.dataset.index = index;

            // Scroll on Click
            dot.addEventListener('click', () => {
                post.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });

            // Scroll on Hover (Optional Scrubber effect)
            // dot.addEventListener('mouseenter', () => {
            //      post.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // });

            rail.appendChild(dot);
        });

        // 2. Fish-Eye Effect
        const dots = document.querySelectorAll('.rail-dot');
        const baseScale = 1;
        const maxScale = 1.8; // Reduced further for "less bigger"
        const effectRange = 80; // Tightened from 150 to 80 to prevent "all glow"

        rail.addEventListener('mousemove', (e) => {
            const mouseY = e.clientY;

            dots.forEach(dot => {
                const rect = dot.getBoundingClientRect();
                const dotY = rect.top + rect.height / 2;
                const dist = Math.abs(mouseY - dotY);

                if (dist < effectRange) {
                    // Calculate scale based on distance
                    const scale = baseScale + (maxScale - baseScale) * (1 - Math.pow(dist / effectRange, 2));
                    dot.style.transform = `scale(${scale})`;

                    // Only add 'hovered' class if it is VERY close to the mouse (e.g. < 40px)
                    // This fixes "all dots glow together"
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
        });

        // Reset on leave
        rail.addEventListener('mouseleave', () => {
            dots.forEach(dot => {
                dot.style.transform = `scale(${baseScale})`;
                dot.classList.remove('hovered');
            });
        });

        // 3. Highlight dot when post is in view (Strict Center Focus)
        // Adjust rootMargin to a thin strip in the middle of the viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Array.from(posts).indexOf(entry.target);
                    // Only active if it's the specific target crossing the center
                    dots.forEach(d => d.classList.remove('active'));
                    if (dots[index]) dots[index].classList.add('active');
                }
            });
        }, {
            rootMargin: '-50% 0px -50% 0px', // Trigger ONLY when element crosses the exact center line
            threshold: 0 // As soon as any pixel touches the center line
        });

        posts.forEach(post => observer.observe(post));
    }

    // --- Gallery Modal Logic (Folder System) ---
    const modal = document.getElementById('gallery-modal');
    const closeModal = modal.querySelector('.close-modal');

    // Mock Data for "Folders" (In a real app, this might come from a JSON file or API)
    const galleryData = [
        {
            title: "Studio Update: Vocals",
            date: "JAN 28, 2026",
            location: "Home Studio, Krakow",
            description: "Finally laying down the final vocal tracks for the opening track. The acoustics in the new booth are incredible. \n\nWe spent about 10 hours today just getting the harmonies right. Big thanks to @SoundGuy for the mix advice.",
            images: [
                "https://placehold.co/600x400/222/FFF?text=Vocals+1",
                "https://placehold.co/600x400/333/FFF?text=Mic+Setup",
                "https://placehold.co/600x400/444/FFF?text=Coffee+Break"
            ],
            attachments: [
                { name: "Vocal_Take_3_Demo.mp3", link: "#" }
            ]
        },
        {
            title: "Live Performance 2025",
            date: "OCT 20, 2025",
            location: "The Underground Club",
            description: "First live show in over a year. The energy was electric. \n\nPlayed a mix of old classics and teased 'Ashes of Epiphany'. The crowd reaction to the bass drop was everything we hoped for.",
            images: [
                "assets/images/featured-live.jpg",
                "https://placehold.co/600x400/555/FFF?text=Crowd+Shot",
                "https://placehold.co/600x400/111/FFF?text=Backstage"
            ],
            attachments: []
        },
        {
            title: "Album Concept Art",
            date: "DEC 15, 2025",
            location: "Digital Workspace",
            description: "Working with @TheHGamer on the cover art for 'Ashes of Epiphany'. \n\nWe're going for a dark, gritty aesthetic that matches the mod's atmosphere. The 'Toothless' concept is becoming a central theme for the visual identity.\n\nIncluded here are the initial sketches, the color palette explorations, and the near-final render.",
            images: [
                "assets/gallery/toothless-art.webp",
                "assets/images/art-1.jpg",
                "assets/images/art-2.jpg",
                "https://placehold.co/600x600/000/FFF?text=Dark+Palette",
                "https://placehold.co/600x800/222/FFF?text=Sketch+V1"
            ],
            attachments: [
                { name: "Concept_Brief_v2.pdf", link: "#" },
                { name: "Wallpaper_4K.jpg", link: "#" }
            ]
        }
    ];

    // Open Modal / Detail Page Function
    const openModal = (index) => {
        // Redirect to new Detail System
        window.location.href = `gallery-detail.html?id=${index}`;
    };

    /* 
       Legacy Modal Code Removed. 
       The new system uses gallery-detail.html for a dedicated, rich experience.
    */

    // Attach Click Listeners to Posts
    posts.forEach((post, index) => {
        // 1. Click on Title
        const title = post.querySelector('.post-artist-name');
        if (title) {
            title.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent compact toggle if any
                openModal(index);
            });
        }

        // 2. Click on Featured Image
        const featImg = post.querySelector('.featured-image-container');
        if (featImg) {
            featImg.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(index);
            });
        }

        // 3. Compact View Click (already has listener, let's update it to open modal!)
        // The existing compact listener (lines 25-38) covers the whole post container.

        // 4. Click on Read More Button
        const readMoreBtn = post.querySelector('.read-more-btn');
        if (readMoreBtn) {
            readMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(index);
            });
        }
    });

    // Update Compact Click Logic (Override previous placeholder)
    // We need to find the existing listener... or just add a new specific one that checks class
    // actually, let's replace the placeholder logic in lines 25-38 if possible, or just add logic here.
    // The previous listener logged to console.

    // Better: Add a global listener for modal triggers that respects compact state
    container.addEventListener('click', (e) => {
        if (container.classList.contains('compact')) {
            const post = e.target.closest('.timeline-post');
            if (post) {
                // Find index
                const index = Array.from(posts).indexOf(post);
                openModal(index);
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

});
