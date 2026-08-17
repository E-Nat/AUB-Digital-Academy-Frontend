/**
 * animations.js
 * Comprehensive scroll reveal, sticky navigation, and interaction controller
 * AUB Digital Academy - Academic, Clean, Digital & Premium
 */

(function () {
    'use strict';

    // 1. SCROLL REVEAL OBSERVER
    const revealOptions = {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
    };

    let scrollObserver = null;

    function initScrollReveal() {
        if ('IntersectionObserver' in window) {
            scrollObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        // Keep element visible once revealed to prevent flickering on scroll
                        observer.unobserve(entry.target);
                    }
                });
            }, revealOptions);

            observeAllRevealElements();
        } else {
            // Fallback for browsers without IntersectionObserver
            document.querySelectorAll('.reveal-up, .reveal-fade, .img-reveal').forEach(el => {
                el.classList.add('is-visible');
            });
        }
    }

    function observeAllRevealElements() {
        if (!scrollObserver) return;
        const revealElements = document.querySelectorAll('.reveal-up:not(.is-visible), .reveal-fade:not(.is-visible), .img-reveal:not(.is-visible)');
        revealElements.forEach(el => {
            // If element is already in the viewport on load (e.g. Hero), reveal immediately
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                el.classList.add('is-visible');
            } else {
                scrollObserver.observe(el);
            }
        });
    }

    // Expose global refresh function for dynamic content
    window.refreshScrollReveal = function () {
        observeAllRevealElements();
    };

    // 2. STICKY NAVBAR LOGIC
    function initStickyNavbar() {
        const navbar = document.getElementById('mainNav');
        if (!navbar) return;

        const handleScroll = () => {
            if (window.scrollY > 20) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
    }

    // 3. MOBILE MENU TOGGLE
    function initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');

        if (!mobileMenuToggle || !mobileMenu) return;

        mobileMenuToggle.addEventListener('click', function () {
            const isOpen = mobileMenu.classList.toggle('is-open');
            const icon = this.querySelector('i');
            if (icon) {
                if (isOpen) {
                    icon.classList.replace('bi-list', 'bi-x-lg');
                } else {
                    icon.classList.replace('bi-x-lg', 'bi-list');
                }
            }
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('.nav-link, .btn');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('is-open');
                document.body.style.overflow = '';
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) icon.classList.replace('bi-x-lg', 'bi-list');
            });
        });
    }

    // 4. SCROLLSPY FOR NAVIGATION LINKS
    function initScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navItems = document.querySelectorAll('.navbar-nav .nav-item');

        if (!sections.length || !navItems.length) return;

        const updateActiveNav = () => {
            let current = 'home';
            const scrollPosition = window.scrollY + 200;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = sectionId;
                }
            });

            if (window.scrollY < 120) {
                current = 'home';
            }

            navItems.forEach(li => {
                li.classList.remove('active');
                const a = li.querySelector('a');
                if (a) {
                    const href = a.getAttribute('href');
                    if (href === `#${current}` || (current === 'home' && (href === '#home' || href === '#'))) {
                        li.classList.add('active');
                    }
                }
            });
        };

        window.addEventListener('scroll', updateActiveNav, { passive: true });
        updateActiveNav();
    }

    // DOM Ready Initialization
    document.addEventListener('DOMContentLoaded', () => {
        initScrollReveal();
        initStickyNavbar();
        initMobileMenu();
        initScrollSpy();

        // Reveal hero elements promptly
        setTimeout(() => {
            document.querySelectorAll('.hero-section .reveal-up').forEach(el => {
                el.classList.add('is-visible');
            });
        }, 80);
    });

})();


