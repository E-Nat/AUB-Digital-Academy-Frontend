/**
 * carousel.js
 * Featured Programs Infinite Carousel with Touch/Drag, Auto-play, and Click Safety
 * AUB Digital Academy - Academic, Clean, Digital & Premium
 */

(function () {
    'use strict';

    let carouselInstance = null;

    function createCarousel() {
        const wrapper = document.querySelector('.featured-carousel-wrapper');
        const track = document.querySelector('.featured-carousel-track');
        if (!track || !wrapper) return null;

        // Remove any old clones first if re-initializing
        const initialSlides = Array.from(track.querySelectorAll('.carousel-slide:not(.carousel-clone)'));
        if (initialSlides.length === 0) return null;

        // Clean up previous event listeners or intervals if any
        if (carouselInstance && typeof carouselInstance.destroy === 'function') {
            carouselInstance.destroy();
        }

        // Clean track HTML back to original slides
        track.querySelectorAll('.carousel-clone').forEach(el => el.remove());

        const nextBtn = document.querySelector('.carousel-btn.next');
        const prevBtn = document.querySelector('.carousel-btn.prev');
        const dotsContainer = document.querySelector('.carousel-indicators');

        let currentIndex = 0;
        let isDragging = false;
        let startPosX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationID = null;
        let autoPlayTimer = null;
        let hasDraggedFar = false;
        const gap = 24;

        const originalLength = initialSlides.length;

        // Clone slides to support smooth infinite loop
        initialSlides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.classList.add('carousel-clone');
            track.appendChild(clone);
        });

        // Also prepend clones for smooth backward infinite loop
        initialSlides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.classList.add('carousel-clone', 'clone-prefix');
            track.insertBefore(clone, track.firstChild);
        });

        const allSlides = Array.from(track.children);
        const prefixOffset = originalLength; // Number of prefixed clones

        // Start at real slide 0 (offset by prefix clones)
        currentIndex = prefixOffset;

        const getItemsPerView = () => {
            const width = window.innerWidth;
            if (width >= 1200) return 4;
            if (width >= 992) return 3;
            if (width >= 576) return 2;
            return 1;
        };

        const getSlideStep = () => {
            if (!allSlides[0]) return 300;
            return allSlides[0].getBoundingClientRect().width + gap;
        };

        const setupDots = () => {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            for (let i = 0; i < originalLength; i++) {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                dot.setAttribute('type', 'button');
                dot.setAttribute('aria-label', `Go to program slide ${i + 1}`);
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    stopAutoPlay();
                    currentIndex = prefixOffset + i;
                    updateCarousel(true);
                    startAutoPlay();
                });
                dotsContainer.appendChild(dot);
            }
        };

        const updateDots = () => {
            if (!dotsContainer) return;
            const normalizedIndex = ((currentIndex - prefixOffset) % originalLength + originalLength) % originalLength;
            const dots = Array.from(dotsContainer.children);
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === normalizedIndex);
            });
        };

        const updateCarousel = (withTransition = true) => {
            const step = getSlideStep();
            currentTranslate = -(currentIndex * step);
            prevTranslate = currentTranslate;

            if (withTransition) {
                track.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
            } else {
                track.style.transition = 'none';
            }

            track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
            updateDots();
        };

        // Seamless infinite boundary wrap on transition end
        const handleTransitionEnd = () => {
            const totalSlides = allSlides.length;
            if (currentIndex >= prefixOffset + originalLength) {
                track.style.transition = 'none';
                currentIndex = currentIndex - originalLength;
                const step = getSlideStep();
                currentTranslate = -(currentIndex * step);
                prevTranslate = currentTranslate;
                track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
            } else if (currentIndex < prefixOffset) {
                track.style.transition = 'none';
                currentIndex = currentIndex + originalLength;
                const step = getSlideStep();
                currentTranslate = -(currentIndex * step);
                prevTranslate = currentTranslate;
                track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
            }
        };

        track.addEventListener('transitionend', handleTransitionEnd);

        // Auto Play
        const startAutoPlay = () => {
            stopAutoPlay();
            autoPlayTimer = setInterval(() => {
                currentIndex++;
                updateCarousel(true);
            }, 3800);
        };

        const stopAutoPlay = () => {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        };

        // Navigation Controls
        const handleNext = (e) => {
            if (e) e.preventDefault();
            stopAutoPlay();
            currentIndex++;
            updateCarousel(true);
            startAutoPlay();
        };

        const handlePrev = (e) => {
            if (e) e.preventDefault();
            stopAutoPlay();
            currentIndex--;
            updateCarousel(true);
            startAutoPlay();
        };

        if (nextBtn) nextBtn.addEventListener('click', handleNext);
        if (prevBtn) prevBtn.addEventListener('click', handlePrev);

        // Hover Pause
        wrapper.addEventListener('mouseenter', stopAutoPlay);
        wrapper.addEventListener('mouseleave', () => {
            if (!isDragging) startAutoPlay();
        });

        // Touch & Drag Handling with Click Suppression
        function getPosX(e) {
            return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        }

        function onTouchStart(e) {
            isDragging = true;
            hasDraggedFar = false;
            startPosX = getPosX(e);
            track.classList.add('is-dragging');
            stopAutoPlay();
            track.style.transition = 'none';
        }

        function onTouchMove(e) {
            if (!isDragging) return;
            const currentX = getPosX(e);
            const deltaX = currentX - startPosX;
            if (Math.abs(deltaX) > 8) {
                hasDraggedFar = true;
            }
            currentTranslate = prevTranslate + deltaX;
            track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
        }

        function onTouchEnd() {
            if (!isDragging) return;
            isDragging = false;
            track.classList.remove('is-dragging');

            const movedBy = currentTranslate - prevTranslate;
            const threshold = 40;

            if (movedBy < -threshold) {
                currentIndex++;
            } else if (movedBy > threshold) {
                currentIndex--;
            }

            updateCarousel(true);
            startAutoPlay();
        }

        // Prevent accidental link navigation while dragging
        track.addEventListener('click', (e) => {
            if (hasDraggedFar) {
                e.preventDefault();
                e.stopPropagation();
                hasDraggedFar = false;
            }
        }, true);

        // Mouse Drag
        track.addEventListener('mousedown', onTouchStart);
        window.addEventListener('mousemove', onTouchMove);
        window.addEventListener('mouseup', onTouchEnd);

        // Touch Swipe
        track.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);

        // Resize handler
        const handleResize = () => {
            updateCarousel(false);
        };
        window.addEventListener('resize', handleResize);

        // Initial setup
        setupDots();
        updateCarousel(false);
        startAutoPlay();

        return {
            destroy: () => {
                stopAutoPlay();
                track.removeEventListener('transitionend', handleTransitionEnd);
                if (nextBtn) nextBtn.removeEventListener('click', handleNext);
                if (prevBtn) prevBtn.removeEventListener('click', handlePrev);
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('mousemove', onTouchMove);
                window.removeEventListener('mouseup', onTouchEnd);
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
            }
        };
    }

    window.initProgramsCarousel = function () {
        carouselInstance = createCarousel();
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.initProgramsCarousel();
    });
})();


