const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

let particlesArray;

// Set canvas size to match the parent container (.cover)
function setCanvasSize() {
    // We want the canvas to cover the .cover div
    const coverDiv = document.querySelector('.cover');
    if (coverDiv) {
        canvas.width = coverDiv.clientWidth;
        canvas.height = coverDiv.clientHeight;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

setCanvasSize();

// Mouse position
let mouse = {
    x: null,
    y: null,
    radius: 100 // interaction radius
}

let input = {
    x: null,
    y: null,
    isMoving: false
}

window.addEventListener('mousemove', function (event) {
    input.x = event.clientX;
    input.y = event.clientY;
    input.isMoving = true;
});

// Update mouse coordinates relative to canvas
function updateMouseCoordinates() {
    if (input.x !== null && input.y !== null) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = input.x - rect.left;
        // Subtract dynamic offset (approx 5vh) which seems to correct the layout shift
        const offset = window.innerHeight * 0.05;
        mouse.y = (input.y - rect.top) - offset;
    }
}

// Create particle class
class Particle {
    constructor(x, y, loadingType) {
        this.x = x;
        this.y = y;
        // Random size for dust
        this.size = Math.random() * 2 + 0.5; // Small, dust-like
        // Base density for mass/inertia
        this.density = (Math.random() * 30) + 1;

        // Random drift velocity
        this.speedX = (Math.random() * 0.5) - 0.25;
        this.speedY = (Math.random() * 0.5) - 0.25;

        // Life cycle for appearing/disappearing
        this.opacity = 0;
        this.opacitySpeed = Math.random() * 0.01 + 0.002;
        this.fadingIn = true;
        this.maxOpacity = Math.random() * 0.5 + 0.2; // Does not get fully opaque
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);

        // Green, glowy aesthetic
        // Using rgba(178, 201, 130, opacity) matches #b2c982 (from h1 color) or similar
        // Let's go with a slightly brighter green for the "glow"
        ctx.fillStyle = 'rgba(178, 201, 130,' + this.opacity + ')';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(178, 201, 130, 0.8)';

        ctx.fill();
        ctx.shadowBlur = 0; // Reset for performance if needed, though we want glow
    }

    update() {
        // Appearance / Disappearance
        if (this.fadingIn) {
            this.opacity += this.opacitySpeed;
            if (this.opacity >= this.maxOpacity) {
                this.fadingIn = false;
            }
        } else {
            this.opacity -= this.opacitySpeed;
            if (this.opacity <= 0) {
                this.fadingIn = true;
                // Respawn at a random location when fully faded out? 
                // Alternatively, just let it fade in/out in place.
                // Let's respawn to keep movement dynamic
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                // Randomize movement on respawn
                this.speedX = (Math.random() * 0.5) - 0.25;
                this.speedY = (Math.random() * 0.5) - 0.25;
            }
        }

        // Check if mouse is close
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Interaction: float away gently
        if (distance < mouse.radius) {
            // Calculate direction to move away
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;

            // The closer, the stronger the push
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * this.density;
            const directionY = forceDirectionY * force * this.density;

            this.x -= directionX;
            this.y -= directionY;
        } else {
            // No mouse interaction, just drift
            this.x += this.speedX;
            this.y += this.speedY;
        }

        // Boundary check - wrap around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        this.draw();
    }
}

function init() {
    particlesArray = [];
    // Number of particles - responsive to screen size
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateMouseCoordinates();

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
}

// Handle resize
// Handle resize with ResizeObserver to catch all layout changes
const coverDiv = document.querySelector('.cover');
if (coverDiv) {
    const resizeObserver = new ResizeObserver(() => {
        setCanvasSize();
        init();
    });
    resizeObserver.observe(coverDiv);
} else {
    // Fallback if cover not found (unlikely)
    window.addEventListener('resize', () => {
        setCanvasSize();
        init();
    });
}

// Start
init();
animate();
