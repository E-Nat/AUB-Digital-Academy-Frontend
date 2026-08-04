document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.featured-carousel-track');
    if (!track) return;

    const slides = Array.from(track.children);
    const nextBtn = document.querySelector('.carousel-btn.next');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const dotsContainer = document.querySelector('.carousel-indicators');
    
    if (slides.length === 0) return;

    let currentIndex = 0;
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;
    let autoPlayInterval;
    let dragThresholdExceeded = false;
    const gap = 24;

    // Responsive items per view
    const getItemsPerView = () => {
        if (window.innerWidth >= 1200) return 4;
        if (window.innerWidth >= 992) return 3;
        if (window.innerWidth >= 576) return 2;
        return 1;
    };

    let itemsPerView = getItemsPerView();
    let originalLength = slides.length;
    let maxIndex = Math.max(0, originalLength - itemsPerView);

    // Duplicate slides for truly seamless infinite loop
    slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        track.appendChild(clone);
    });

    const allSlides = Array.from(track.children);
    
    // Re-init vanilla-tilt for clones if needed
    if (typeof VanillaTilt !== 'undefined') {
        const clones = allSlides.slice(originalLength);
        clones.forEach(clone => {
            const tiltEl = clone.querySelector('[data-tilt]');
            if (tiltEl) VanillaTilt.init(tiltEl);
        });
    }

    window.addEventListener('resize', () => {
        itemsPerView = getItemsPerView();
        maxIndex = Math.max(0, originalLength - itemsPerView);
        updateCarousel(false);
        setupDots();
    });

    // Create Dots (based on originalLength)
    const setupDots = () => {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            if (i === (currentIndex % originalLength)) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateCarousel(true);
            });
            dotsContainer.appendChild(dot);
        }
    };
    setupDots();

    const updateDots = () => {
        if (!dotsContainer) return;
        let activeIndex = currentIndex;
        if (activeIndex >= originalLength) {
             activeIndex = activeIndex % originalLength;
        } else if (activeIndex < 0) {
             activeIndex = (originalLength + (activeIndex % originalLength)) % originalLength;
        }
        
        if (activeIndex > maxIndex) activeIndex = maxIndex;

        const dots = Array.from(dotsContainer.children);
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    };

    const updateCarousel = (withTransition = true) => {
        const slideWidth = allSlides[0].getBoundingClientRect().width;
        const moveAmount = (slideWidth + gap) * currentIndex;
        
        currentTranslate = -moveAmount;
        prevTranslate = currentTranslate;
        
        if (!withTransition) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
        }
        
        track.style.transform = `translateX(${currentTranslate}px)`;
        updateDots();
    };

    // Infinite Loop Logic
    track.addEventListener('transitionend', () => {
        if (currentIndex >= originalLength) {
            track.style.transition = 'none';
            currentIndex = currentIndex % originalLength;
            updateCarousel(false);
        } else if (currentIndex < 0) {
            track.style.transition = 'none';
            currentIndex = originalLength - 1;
            updateCarousel(false);
        }
    });

    // Auto Play
    const startAutoPlay = () => {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            currentIndex++;
            updateCarousel(true);
        }, 3000);
    };

    const stopAutoPlay = () => {
        clearInterval(autoPlayInterval);
    };

    startAutoPlay();

    // Hover Pause
    const carouselWrapper = document.querySelector('.featured-carousel-wrapper');
    if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
        carouselWrapper.addEventListener('mouseleave', () => {
            if (!isDragging) startAutoPlay();
        });
    }

    // Controls
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoPlay();
            currentIndex++;
            updateCarousel(true);
            startAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoPlay();
            currentIndex--;
            updateCarousel(true);
            startAutoPlay();
        });
    }

    // Drag / Swipe Logic
    track.addEventListener('mousedown', touchStart);
    track.addEventListener('touchstart', touchStart, {passive: true});
    window.addEventListener('mouseup', touchEnd);
    window.addEventListener('touchend', touchEnd);
    window.addEventListener('mousemove', touchMove, {passive: false});
    window.addEventListener('touchmove', touchMove, {passive: false});

    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    function touchStart(event) {
        dragThresholdExceeded = false;
        isDragging = true;
        startPos = getPositionX(event);
        track.classList.add('is-dragging');
        stopAutoPlay();
        animationID = requestAnimationFrame(animation);
    }

    function touchMove(event) {
        if (isDragging) {
            const currentPosition = getPositionX(event);
            currentTranslate = prevTranslate + currentPosition - startPos;
            if (Math.abs(currentPosition - startPos) > 10) dragThresholdExceeded = true;
        }
    }

    function touchEnd() {
        if (!isDragging) return;
        isDragging = false;
        cancelAnimationFrame(animationID);
        track.classList.remove('is-dragging');

        const movedBy = currentTranslate - prevTranslate;

        if (movedBy < -50) currentIndex += 1;
        if (movedBy > 50) currentIndex -= 1;

        updateCarousel(true);
        startAutoPlay();
    }

    function animation() {
        track.style.transform = `translateX(${currentTranslate}px)`;
        if (isDragging) requestAnimationFrame(animation);
    }
});

