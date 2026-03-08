document.addEventListener("DOMContentLoaded", () => {
    /* =========================================
       State & Constants
    ========================================= */
    const canvas = document.getElementById("parallax-canvas");
    const ctx = canvas.getContext("2d");
    const startFrame = 47;
    const endFrame = 191;
    const totalFrames = endFrame - startFrame + 1; // 145 usable frames

    // UI Elements
    const loaderOverlay = document.getElementById("loader");
    const loaderProgressBar = document.getElementById("loader-progress-bar");
    const loaderPercentage = document.getElementById("loader-percentage");
    const navbar = document.getElementById("navbar");
    const heroScrollSpacer = document.getElementById("hero-scroll-spacer");
    const heroBgText = document.getElementById("hero-bg-text");
    const scrollHint = document.getElementById("scroll-hint");
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const mobileNavOverlay = document.getElementById("mobile-nav-overlay");
    const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");

    /* =========================================
       Device Detection & Adaptive Config
    ========================================= */
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

    // Mobile: load every 2nd frame for faster loading
    const frameStep = isMobile ? 2 : 1;
    const frameIndices = [];
    for (let i = 0; i < totalFrames; i += frameStep) {
        frameIndices.push(i);
    }
    const frameCount = frameIndices.length;

    // Frame storage
    const frames = new Array(frameCount).fill(null);
    let imagesLoaded = 0;
    let targetFrameIndex = 0;
    let interpolatedFrameIndex = 0;
    const lerpAmount = isMobile ? 0.15 : 0.12; // Slightly faster interpolation on mobile

    /* =========================================
       Frame URL Helper (WebP with adaptive sizing)
    ========================================= */
    const currentFrameURL = (arrayIndex) => {
        const frameOffset = frameIndices[arrayIndex];
        const actualIndex = frameOffset + startFrame;
        const paddedIndex = actualIndex.toString().padStart(3, '0');

        if (isMobile) {
            return `assets/frames-mobile/frame_${paddedIndex}.webp`;
        }
        return `assets/frames-webp/frame_${paddedIndex}.webp`;
    };

    /* =========================================
       Priority Preloading
       - Load first 10 frames immediately (above the fold)
       - Then load the rest in background
    ========================================= */
    const PRIORITY_COUNT = Math.min(10, frameCount);

    const preloadImages = () => {
        // Phase 1: Load priority frames
        loadFrameBatch(0, PRIORITY_COUNT, () => {
            // After priority frames are loaded, init canvas early
            if (imagesLoaded >= PRIORITY_COUNT) {
                initCanvasEarly();
            }
            // Phase 2: Load remaining frames
            loadFrameBatch(PRIORITY_COUNT, frameCount);
        });
    };

    let canvasInitialized = false;

    const loadFrameBatch = (start, end, onBatchDone) => {
        let batchLoaded = 0;
        const batchSize = end - start;

        for (let i = start; i < end; i++) {
            const img = new Image();
            img.src = currentFrameURL(i);
            img.onload = () => {
                imagesLoaded++;
                frames[i] = img;
                batchLoaded++;
                updateProgress();
                if (onBatchDone && batchLoaded === batchSize) onBatchDone();
            };
            img.onerror = () => {
                imagesLoaded++;
                frames[i] = null;
                batchLoaded++;
                updateProgress();
                if (onBatchDone && batchLoaded === batchSize) onBatchDone();
            };
        }
    };

    const initCanvasEarly = () => {
        if (canvasInitialized) return;
        canvasInitialized = true;
        // Hide loader early once priority frames are in
        setTimeout(() => {
            if (loaderOverlay) loaderOverlay.classList.add("hidden");
            initCanvas();
        }, 300);
    };

    const updateProgress = () => {
        const percent = Math.floor((imagesLoaded / frameCount) * 100);
        if (loaderPercentage) loaderPercentage.innerText = percent;
        if (loaderProgressBar) loaderProgressBar.style.width = `${percent}%`;

        // Fallback: if priority loading didn't trigger, init when fully done
        if (imagesLoaded === frameCount && !canvasInitialized) {
            initCanvasEarly();
        }
    };

    /* =========================================
       Canvas Rendering
    ========================================= */
    const resizeCanvas = () => {
        // On mobile, use lower resolution canvas for performance
        const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);
        renderFrame(Math.round(interpolatedFrameIndex));
    };

    const drawImageCover = (ctx, img) => {
        if (!img) return;
        const cW = window.innerWidth, cH = window.innerHeight;
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
        window.addEventListener('resize', debounce(resizeCanvas, 150));
        resizeCanvas();

        const scrollPerFrame = isMobile ? 30 : 45;
        const spacerHeight = window.innerHeight + (frameCount * scrollPerFrame);
        heroScrollSpacer.style.height = spacerHeight + 'px';

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

        // Frame calculation
        const heroViewHeight = window.innerHeight;
        const animStart = 0;
        const animEnd = heroScrollSpacer.offsetHeight - heroViewHeight;
        const animScroll = Math.max(0, scrollTop - animStart);
        const animLength = animEnd - animStart;
        const scrollFraction = Math.max(0, Math.min(animScroll / animLength, 1));

        targetFrameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));

        // Background text parallax
        if (heroBgText) {
            const scale = 1 + scrollFraction * 0.2;
            heroBgText.style.transform = `translate(-50%, -50%) scale(${scale})`;
            heroBgText.style.opacity = '1';
        }
    };

    /* =========================================
       Mobile Navigation
    ========================================= */
    const initMobileNav = () => {
        if (!hamburgerBtn || !mobileNavOverlay) return;

        hamburgerBtn.addEventListener('click', () => {
            const isOpen = hamburgerBtn.classList.contains('active');
            hamburgerBtn.classList.toggle('active');
            mobileNavOverlay.classList.toggle('active');
            document.body.style.overflow = isOpen ? '' : 'hidden';
        });

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                mobileNavOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
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
       Utility: Debounce
    ========================================= */
    const debounce = (fn, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

    /* =========================================
       Boot
    ========================================= */
    initFadeIn();
    initMobileNav();
    preloadImages();
});
