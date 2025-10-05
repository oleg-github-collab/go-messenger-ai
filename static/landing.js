// Landing page interactions - Optimized for performance
(function() {
    'use strict';

    console.log('[LANDING] Landing page script loaded');

    // Smooth scroll for anchor links with passive event listeners
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, { passive: false });
    });

    // Intersection Observer for lazy animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation to save resources
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all cards - CSS handles animation
    document.querySelectorAll('.feature-card, .roadmap-card, .cta-content').forEach(card => {
        observer.observe(card);
    });

    // Optimized parallax effect for gradient orbs (only on desktop)
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
        let ticking = false;
        const orbs = document.querySelectorAll('.gradient-orb');

        function updateParallax() {
            const scrolled = window.pageYOffset;

            orbs.forEach((orb, index) => {
                const speed = 0.2 + (index * 0.05);
                const yPos = -(scrolled * speed);
                orb.style.transform = `translateY(${yPos}px)`;
            });

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    // Lazy load hero title animation
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.getAttribute('data-i18n') || heroTitle.textContent;
        heroTitle.style.opacity = '1';

        // Simple fade-in instead of typing for better performance
        heroTitle.classList.add('fade-in');
    }

    // Performance: Use CSS for hover effects instead of JS
    // Removed JS hover handlers - handled by CSS

    console.log('[LANDING] ✅ Landing page optimized and ready');
})();
