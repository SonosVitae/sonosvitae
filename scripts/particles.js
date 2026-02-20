// Particles.js - SPA Compatible
let canvas;
let ctx;
let particlesArray;
let animationId;
let mouse = {
    x: null,
    y: null,
    radius: 100
};
let input = {
    x: null,
    y: null,
    isMoving: false
};
let isVisible = true;
let observer;

// Create particle class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 0.5;
        this.density = (Math.random() * 30) + 1;
        this.speedX = (Math.random() * 0.5) - 0.25;
        this.speedY = (Math.random() * 0.5) - 0.25;
        this.opacity = 0;
        this.opacitySpeed = Math.random() * 0.01 + 0.002;
        this.fadingIn = true;
        this.maxOpacity = Math.random() * 0.5 + 0.2;
    }

    draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = 'rgba(178, 201, 130,' + this.opacity + ')';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(178, 201, 130, 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update() {
        if (this.fadingIn) {
            this.opacity += this.opacitySpeed;
            if (this.opacity >= this.maxOpacity) this.fadingIn = false;
        } else {
            this.opacity -= this.opacitySpeed;
            if (this.opacity <= 0) {
                this.fadingIn = true;
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.speedX = (Math.random() * 0.5) - 0.25;
                this.speedY = (Math.random() * 0.5) - 0.25;
            }
        }

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * this.density;
            const directionY = forceDirectionY * force * this.density;
            this.x -= directionX;
            this.y -= directionY;
        } else {
            this.x += this.speedX;
            this.y += this.speedY;
        }

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        this.draw();
    }
}

function init() {
    if (!canvas) return;
    particlesArray = [];
    // Significantly reduce particle count on smaller screens for performance
    let density = window.innerWidth < 768 ? 15000 : 9000;
    let numberOfParticles = (canvas.height * canvas.width) / density;
    for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

function animate() {
    if (!canvas || !ctx) return;

    // Only request the next frame if the canvas is visible
    if (isVisible) {
        animationId = requestAnimationFrame(animate);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateMouseCoordinates();
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
}

function setCanvasSize() {
    if (!canvas) return;
    const coverDiv = document.querySelector('.cover');
    if (coverDiv) {
        canvas.width = coverDiv.clientWidth;
        canvas.height = coverDiv.clientHeight;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function updateMouseCoordinates() {
    if (input.x !== null && input.y !== null && canvas) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = input.x - rect.left;

        let offset = 0;
        if (document.querySelector('.cover')) {
            offset = window.innerHeight * 0.05;
        }

        mouse.y = (input.y - rect.top) - offset;
    }
}

window.addEventListener('mousemove', function (event) {
    input.x = event.clientX;
    input.y = event.clientY;
    input.isMoving = true;
});

// Resize Observer for element size changes
let resizeObserver;

function setupResizeObserver() {
    if (resizeObserver) resizeObserver.disconnect();

    const coverDiv = document.querySelector('.cover');
    if (coverDiv) {
        resizeObserver = new ResizeObserver(() => {
            // Only update if dimensions actually changed to avoid loops
            if (!canvas) return;
            if (canvas.width !== coverDiv.clientWidth || canvas.height !== coverDiv.clientHeight) {
                setCanvasSize();
                init();
            }
        });
        resizeObserver.observe(coverDiv);
    }
}

window.addEventListener('resize', () => {
    if (canvas) {
        setCanvasSize();
        init();
    }
});

// Force re-init on full page load (images loaded)
window.addEventListener('load', () => {
    if (canvas) {
        setupResizeObserver(); // Re-bind if needed
        setCanvasSize();
        init();
    }
});

// Expose Init Globally
window.initParticles = function () {
    // Re-query canvas every time to handle SPA navigation
    canvas = document.getElementById('particles-canvas');
    if (!canvas) {
        // If not found, stop animation and return safely (don't throw)
        if (animationId) cancelAnimationFrame(animationId);
        return;
    }

    ctx = canvas.getContext('2d');
    console.log("Initializing Particles: Canvas found");

    setCanvasSize();
    setupResizeObserver(); // Start observing bounds

    // Setup IntersectionObserver to pause animation when off-screen
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible && !animationId) {
                animate(); // Resume
            } else if (!isVisible && animationId) {
                cancelAnimationFrame(animationId);
                animationId = null; // Pause
            }
        });
    }, { threshold: 0 });
    observer.observe(canvas);

    init();

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (isVisible) animate();
}

// Auto-start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initParticles);
} else {
    window.initParticles();
}
