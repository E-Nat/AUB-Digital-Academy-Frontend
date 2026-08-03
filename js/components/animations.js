/**
 * animations.js
 * Intersection Observer for scroll reveal animations
 */

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Scroll Reveal Observer
    const revealOptions = {
        threshold: 0.1,  // Trigger when 10% visible
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }
            
            // Add is-visible class to trigger animation
            entry.target.classList.add('is-visible');
            
            // Unobserve after animating once
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    const revealElements = document.querySelectorAll('.reveal-up, .img-reveal');
    revealElements.forEach(el => revealOnScroll.observe(el));

    // 2. Sticky Navbar Logic
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
        
        // Trigger once on load in case page is already scrolled
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        }
    }
});
