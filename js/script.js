document.addEventListener("DOMContentLoaded", () => {
    /* =========================================
       State & Constants
    ========================================= */
    const canvas = document.getElementById("parallax-canvas");
    const ctx = canvas.getContext("2d");
    const startFrame = 42; // First frame to use (user specified)
    const endFrame = 191;
    const frameCount = endFrame - startFrame + 1; // 150 usable frames
    const frames = [];
    
    // UI Elements
    const loaderOverlay = document.getElementById("loader");
    const loaderProgressBar = document.getElementById("loader-progress-bar");
    const loaderPercentage = document.getElementById("loader-percentage");
    const navbar = document.getElementById("navbar");
    const heroScrollSpacer = document.getElementById("hero-scroll-spacer");
    const heroBgText = document.getElementById("hero-bg-text");
    const scrollHint = document.getElementById("scroll-hint");

    let imagesLoaded = 0;
    let targetFrameIndex = 0;
    let interpolatedFrameIndex = 0;
    const lerpAmount = 0.12;

    /* =========================================
       Frame URL Helper
    ========================================= */
    const currentFrameURL = index => {
        const actualIndex = index + startFrame;
        const paddedIndex = actualIndex.toString().padStart(3, '0');
        return `assets/frames/frame_${paddedIndex}.png`;
    };

    /* =========================================
       Preloading
    ========================================= */
    const preloadImages = () => {
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = currentFrameURL(i);
            img.onload = () => {
                imagesLoaded++;
                frames[i] = img;
                updateProgress();
            };
            img.onerror = () => {
                imagesLoaded++;
                frames[i] = null;
                updateProgress();
            };
        }
    };

    const updateProgress = () => {
        const percent = Math.floor((imagesLoaded / frameCount) * 100);
        if (loaderPercentage) loaderPercentage.innerText = percent;
        if (loaderProgressBar) loaderProgressBar.style.width = `${percent}%`;

        if (imagesLoaded === frameCount) {
            setTimeout(() => {
                if (loaderOverlay) loaderOverlay.classList.add("hidden");
                initCanvas();
            }, 400);
        }
    };

    /* =========================================
       Canvas Rendering
    ========================================= */
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderFrame(Math.round(interpolatedFrameIndex));
    };

    const drawImageCover = (ctx, img) => {
        if (!img) return;
        const cW = canvas.width, cH = canvas.height;
        const iW = img.width, iH = img.height;
        const scale = Math.max(cW / iW, cH / iH);
        const w = iW * scale, h = iH * scale;
        const x = (cW - w) / 2, y = (cH - h) / 2;
        ctx.clearRect(0, 0, cW, cH);
        ctx.drawImage(img, x, y, w, h);
    };

    const renderFrame = (index) => {
        const clampedIndex = Math.max(0, Math.min(index, frameCount - 1));
        if (frames[clampedIndex]) {
            drawImageCover(ctx, frames[clampedIndex]);
        }
    };

    /* =========================================
       Animation Loop (LERP for smoothness)
    ========================================= */
    const animate = () => {
        interpolatedFrameIndex += (targetFrameIndex - interpolatedFrameIndex) * lerpAmount;
        const roundedIndex = Math.round(interpolatedFrameIndex);
        renderFrame(roundedIndex);
        requestAnimationFrame(animate);
    };

    /* =========================================
       Initialization
    ========================================= */
    const initCanvas = () => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // Spacer height = 1 viewport (hero visible) + scroll depth for animation
        const scrollPerFrame = 20;
        const spacerHeight = window.innerHeight + (frameCount * scrollPerFrame);
        heroScrollSpacer.style.height = spacerHeight + 'px';
        
        // Render first frame immediately
        renderFrame(0);
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        requestAnimationFrame(animate);
    };

    /* =========================================
       Scroll Handler
    ========================================= */
    const handleScroll = () => {
        const scrollTop = window.scrollY;
        
        // Navbar
        navbar.classList.toggle("scrolled", scrollTop > 50);

        // Scroll Hint
        if (scrollHint) scrollHint.classList.toggle("fade-out", scrollTop > 100);

        // Frame calculation:
        // First viewport of scroll = hero is just sitting there (no animation yet)
        // After that, animation plays across the remaining spacer height
        const heroViewHeight = window.innerHeight;
        const animStart = heroViewHeight * 0.2; // Start animating after 20% of viewport
        const animEnd = heroScrollSpacer.offsetHeight - heroViewHeight;
        const animScroll = Math.max(0, scrollTop - animStart);
        const animLength = animEnd - animStart;
        const scrollFraction = Math.max(0, Math.min(animScroll / animLength, 1));
        
        targetFrameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));

        // Background text: ALWAYS VISIBLE, only a subtle scale effect
        if (heroBgText) {
            const scale = 1 + scrollFraction * 0.2;
            heroBgText.style.transform = `translate(-50%, -50%) scale(${scale})`;
            // NO opacity change - text stays permanently visible
        }
    };

    /* =========================================
       Intersection Observer (below-fold fade-in)
    ========================================= */
    const initFadeIn = () => {
        const targets = document.querySelectorAll('.content-section .section-container');
        targets.forEach(el => {
            el.style.opacity = "0";
            el.style.transform = "translateY(30px)";
            el.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

        targets.forEach(el => observer.observe(el));
    };

    /* =========================================
       Boot
    ========================================= */
    initFadeIn();
    preloadImages();
});
