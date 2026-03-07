document.addEventListener("DOMContentLoaded", () => {
    /* =========================================
       State & Constants
    ========================================= */
    const canvas = document.getElementById("parallax-canvas");
    const ctx = canvas.getContext("2d");
    const startFrame = 42; // Start where eruption begins (user specified)
    const endFrame = 191;
    const frameCount = endFrame - startFrame + 1; // 150 frames
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
    const lerpAmount = 0.12; // Smoothing factor

    /* =========================================
       Helper Functions
    ========================================= */
    const currentFrameURL = index => {
        const actualIndex = index + startFrame;
        const paddedIndex = actualIndex.toString().padStart(3, '0');
        return `assets/frames/frame_${paddedIndex}.png`;
    };

    /* =========================================
       Preloading Logic
    ========================================= */
    const preloadImages = () => {
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = currentFrameURL(i);
            img.onload = () => {
                imagesLoaded++;
                updateProgress();
                frames[i] = img;
            };
            img.onerror = () => {
                imagesLoaded++;
                updateProgress();
                frames[i] = null;
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
            }, 500);
        }
    };

    /* =========================================
       Canvas & Parallax Render Logic
    ========================================= */
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderFrame(Math.round(interpolatedFrameIndex));
    };

    const drawImageProp = (ctx, img) => {
        if (!img) return;
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        let renderWidth, renderHeight, x, y;

        if (imgAspect > canvasAspect) {
            renderHeight = canvas.height;
            renderWidth = img.width * (canvas.height / img.height);
            y = 0;
            x = (canvas.width - renderWidth) / 2;
        } else {
            renderWidth = canvas.width;
            renderHeight = img.height * (canvas.width / img.width);
            x = 0;
            y = (canvas.height - renderHeight) / 2;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, renderWidth, renderHeight);
    };

    const renderFrame = (index) => {
        if (frames[index]) {
            drawImageProp(ctx, frames[index]);
        }
    };

    const animate = () => {
        interpolatedFrameIndex += (targetFrameIndex - interpolatedFrameIndex) * lerpAmount;
        const roundedIndex = Math.round(interpolatedFrameIndex);
        renderFrame(roundedIndex);
        requestAnimationFrame(animate);
    };

    const initCanvas = () => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // Set spacer height: this controls how much scroll drives the animation
        // 100vh (one screen) for initial hero view + frame animation scroll depth
        const scrollPerFrame = 20; 
        heroScrollSpacer.style.height = `${window.innerHeight + (frameCount * scrollPerFrame)}px`;
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        requestAnimationFrame(animate);
    };

    /* =========================================
       Scroll Interaction
    ========================================= */
    const handleScroll = () => {
        const scrollTop = window.scrollY;
        
        // Navbar sticky logic
        if (scrollTop > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }

        // Scroll Hint Fade
        if (scrollTop > 100) {
            if (scrollHint) scrollHint.classList.add("fade-out");
        } else {
            if (scrollHint) scrollHint.classList.remove("fade-out");
        }

        // Calculate Frame Index
        // The animation should start after the first viewport of scroll (the hero view)
        const animationStart = window.innerHeight * 0.3; // Start animating after 30% of viewport
        const spacerHeight = heroScrollSpacer.offsetHeight;
        const animationScroll = Math.max(0, scrollTop - animationStart);
        const animationLength = spacerHeight - window.innerHeight;
        const scrollFraction = Math.max(0, Math.min(animationScroll / animationLength, 1));
        targetFrameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));

        // Background Text: ALWAYS VISIBLE, only subtle scale effect, NO fade out
        if (heroBgText) {
            const scale = 1 + scrollFraction * 0.15;
            heroBgText.style.transform = `translate(-50%, -50%) scale(${scale})`;
            // Text stays at full opacity always — the user explicitly wants it to persist
        }
    };

    /* =========================================
       Fade In Animation (Intersection Observer)
    ========================================= */
    const addFadeClasses = () => {
        const sections = document.querySelectorAll('.content-section .section-container');
        sections.forEach(sec => {
            sec.style.opacity = "0";
            sec.style.transform = "translateY(30px)";
            sec.style.transition = "opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1)";
        });
    };

    const initObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });

        const sections = document.querySelectorAll('.content-section .section-container');
        sections.forEach(sec => observer.observe(sec));
    };

    /* =========================================
       Initialization Trigger
    ========================================= */
    addFadeClasses();
    initObserver();
    preloadImages();
});
