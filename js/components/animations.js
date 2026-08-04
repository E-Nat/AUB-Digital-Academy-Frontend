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
                if(icon) icon.classList.replace('bi-x-lg', 'bi-list');
            });
        });
    }

    // 4. ScrollSpy for Navigation Links
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.navbar-nav .nav-item');

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Activate section when it's in the top 3rd of the viewport
            if (window.scrollY >= (sectionTop - 300)) {
                if (section.classList.contains('hero-section')) {
                    current = 'home';
                } else {
                    current = section.getAttribute('id');
                }
            }
        });

        // Force home if at the very top
        if (window.scrollY < 100) {
            current = 'home';
        }

        navItems.forEach(li => {
            li.classList.remove('active');
            const a = li.querySelector('a');
            if (a) {
                const href = a.getAttribute('href');
                if (href === '#' && current === 'home') {
                    li.classList.add('active');
                } else if (current && href === `#${current}`) {
                    li.classList.add('active');
                }
            }
        });
    });
});


// Course Filtering
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.btn-filter');
    const courseItems = document.querySelectorAll('.course-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            courseItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                    // Trigger reflow for animation if needed
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
});
