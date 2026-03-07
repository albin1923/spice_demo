document.addEventListener("DOMContentLoaded", () => {
    /* =========================================
       State & Constants
    ========================================= */
    const canvas = document.getElementById("parallax-canvas");
    const ctx = canvas.getContext("2d");
    const frameCount = 192; // Total renamed frames
    const frames = [];
    
    // UI Elements
    const loaderOverlay = document.getElementById("loader");
    const loaderProgressBar = document.getElementById("loader-progress-bar");
    const loaderPercentage = document.getElementById("loader-percentage");
    const navbar = document.getElementById("navbar");
    const heroScrollSpacer = document.querySelector(".hero-scroll-spacer");
    const heroBgText = document.getElementById("hero-bg-text");
    const scrollHint = document.getElementById("scroll-hint");

    let imagesLoaded = 0;
    let targetFrameIndex = 0;
    let interpolatedFrameIndex = 0;
    const lerpAmount = 0.1; // Smoothing factor for scroll

    /* =========================================
       Helper Functions
    ========================================= */
    const currentFrameURL = index => {
        const paddedIndex = index.toString().padStart(3, '0');
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
                frames[i] = img; // store reference at correct index
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
        // Smooth frame transitions
        interpolatedFrameIndex += (targetFrameIndex - interpolatedFrameIndex) * lerpAmount;
        const roundedIndex = Math.round(interpolatedFrameIndex);
        renderFrame(roundedIndex);
        requestAnimationFrame(animate);
    };

    const initCanvas = () => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        const scrollPerFrame = 25; 
        heroScrollSpacer.style.height = `${frameCount * scrollPerFrame}px`;
        
        window.addEventListener('scroll', handleScroll);
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
        const maxScroll = heroScrollSpacer.offsetHeight;
        const scrollFraction = Math.max(0, Math.min(scrollTop / maxScroll, 1));
        targetFrameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));

        // Background Text Parallax
        if (heroBgText) {
            const yOffset = scrollTop * 0.15;
            const opacity = 1 - (scrollTop / 600);
            heroBgText.style.transform = `translate(-50%, calc(-50% - ${yOffset}px)) scale(${1 + scrollFraction * 0.1})`;
            heroBgText.style.opacity = Math.max(0, opacity * 0.1); 
        }
    };

    /* =========================================
       Fade In Animation (Intersection Observer)
    ======================================== */
    const addFadeClasses = () => {
        const sections = document.querySelectorAll('.content-section .section-container, .hero-left, .hero-right');
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

        const sections = document.querySelectorAll('.content-section .section-container, .hero-left, .hero-right');
        sections.forEach(sec => observer.observe(sec));
    };

    /* =========================================
       Initialization Trigger
    ========================================= */
    addFadeClasses();
    initObserver();
    preloadImages();
});
