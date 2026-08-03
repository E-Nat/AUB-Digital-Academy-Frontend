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
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
        
        // Trigger once on load in case page is already scrolled
        if (window.scrollY > 10) {
            navbar.classList.add('navbar-scrolled');
        }
    }

    // 3. Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('is-open');
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('is-open')) {
                icon.classList.replace('bi-list', 'bi-x-lg');
            } else {
                icon.classList.replace('bi-x-lg', 'bi-list');
            }
        });

        // Close menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('.nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('is-open');
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.replace('bi-x-lg', 'bi-list');
            });
        });
    }
});
