// Ngaan GitHub Pages - Interactive JavaScript

(function() {
    'use strict';

    // DOM elements
    const elements = {
        nav: document.querySelector('.nav'),
        mobileToggle: document.getElementById('mobile-toggle'),
        navLinks: document.querySelectorAll('.nav-link'),
        demoBtn: document.getElementById('demo-btn'),
        githubBtn: document.getElementById('github-btn'),
        statNumbers: document.querySelectorAll('.stat-number'),
        featureCards: document.querySelectorAll('.feature-card'),
        techItems: document.querySelectorAll('.tech-item'),
        timelineItems: document.querySelectorAll('.timeline-item'),
        contactLinks: document.querySelectorAll('.contact-link')
    };

    // Initialize all functionality
    function init() {
        setupNavigation();
        setupAnimations();
        setupCounters();
        setupInteractions();
        setupScrollEffects();
    }

    // Navigation functionality
    function setupNavigation() {
        // Smooth scrolling for nav links
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 70; // Account for fixed nav
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
                
                // Add active state
                elements.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Navigation background on scroll
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 50) {
                elements.nav.style.background = 'rgba(255, 255, 255, 0.98)';
                elements.nav.style.boxShadow = '0 4px 20px rgba(45, 45, 45, 0.1)';
            } else {
                elements.nav.style.background = 'rgba(255, 255, 255, 0.95)';
                elements.nav.style.boxShadow = 'none';
            }
        }, 100));

        // Mobile navigation toggle (basic functionality)
        if (elements.mobileToggle) {
            elements.mobileToggle.addEventListener('click', () => {
                // This would expand mobile menu in a full implementation
                console.log('Mobile menu toggle clicked');
            });
        }
    }

    // Animation and scroll effects
    function setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Add stagger effect for feature cards
                    if (entry.target.classList.contains('feature-card')) {
                        const cards = Array.from(elements.featureCards);
                        const index = cards.indexOf(entry.target);
                        entry.target.style.transitionDelay = `${index * 0.1}s`;
                    }
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = [
            ...elements.featureCards,
            ...elements.techItems,
            ...elements.timelineItems
        ];

        animateElements.forEach((el, index) => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                observer.observe(el);
            }
        });
    }

    // Counter animations for stats
    function setupCounters() {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        elements.statNumbers.forEach(counter => {
            if (counter) {
                counterObserver.observe(counter);
            }
        });
    }

    // Animate counter function
    function animateCounter(element) {
        const target = parseInt(element.dataset.target) || 0;
        const duration = 2000; // 2 seconds
        const start = performance.now();
        const startValue = 0;

        function updateCounter(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
            
            // Handle decimal values for percentage stats
            if (element.dataset.target.includes('.')) {
                element.textContent = (startValue + (target - startValue) * easedProgress).toFixed(1);
            } else {
                element.textContent = currentValue.toLocaleString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = element.dataset.target.includes('.') ? 
                    parseFloat(element.dataset.target).toFixed(1) : 
                    target.toLocaleString();
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // Interactive button and hover effects
    function setupInteractions() {
        // Demo button functionality
        if (elements.demoBtn) {
            elements.demoBtn.addEventListener('click', () => {
                // Add click animation
                elements.demoBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    elements.demoBtn.style.transform = 'scale(1)';
                }, 150);

                // In a real implementation, this would open the demo
                showNotification('Demo will be available when the app launches!', 'info');
            });
        }

        // GitHub button functionality
        if (elements.githubBtn) {
            elements.githubBtn.addEventListener('click', () => {
                // Add click animation
                elements.githubBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    elements.githubBtn.style.transform = 'scale(1)';
                }, 150);

                // Open GitHub repository
                window.open('https://github.com/your-username/ngaan', '_blank');
            });
        }

        // Feature card hover effects
        elements.featureCards.forEach(card => {
            if (card) {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-12px) scale(1.02)';
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0) scale(1)';
                });
            }
        });

        // Contact links hover effects
        elements.contactLinks.forEach(link => {
            if (link) {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    
                    // Handle email links
                    if (href && href.startsWith('mailto:')) {
                        showNotification('Opening email client...', 'success');
                    }
                    
                    // Handle LINE links
                    if (href && href.includes('line.me')) {
                        e.preventDefault();
                        showNotification('LINE integration coming soon!', 'info');
                    }
                });
            }
        });
    }

    // Scroll effects and parallax
    function setupScrollEffects() {
        const heroParticles = document.querySelectorAll('.hero-particle');
        const phoneMotion = document.querySelector('.phone-mockup');

        window.addEventListener('scroll', throttle(() => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            // Parallax effect for hero particles
            heroParticles.forEach((particle, index) => {
                if (particle) {
                    const speed = 0.2 + (index * 0.1);
                    particle.style.transform = `translateY(${scrolled * speed}px)`;
                }
            });

            // Phone mockup subtle movement
            if (phoneMotion) {
                phoneMotion.style.transform = `translateY(${rate * 0.1}px)`;
            }
        }, 10));

        // Progress indicator for roadmap
        updateRoadmapProgress();
    }

    // Update roadmap progress based on current phase
    function updateRoadmapProgress() {
        const timelineDots = document.querySelectorAll('.timeline-dot');
        
        // Simulate current progress (Phase 1 completed, Phase 2 active)
        if (timelineDots.length >= 2) {
            timelineDots[0].classList.add('completed');
            timelineDots[1].classList.add('active');
        }
    }

    // Utility function: throttle
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Utility function: debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Show notification (toast-like)
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#4169e1' : type === 'error' ? '#ff6b35' : '#2d2d2d',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(45, 45, 45, 0.2)',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
            opacity: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '300px'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Get notification icon
    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    // Easter egg: Konami code
    let konamiCode = [];
    const konami = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];

    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        if (konamiCode.length > konami.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konami.join(',')) {
            triggerEasterEgg();
            konamiCode = [];
        }
    });

    function triggerEasterEgg() {
        // Add rainbow animation to logo
        const logo = document.querySelector('.logo-text');
        if (logo) {
            logo.style.animation = 'rainbow 2s linear infinite';
            
            // Add rainbow keyframes if not already present
            if (!document.getElementById('rainbow-keyframes')) {
                const style = document.createElement('style');
                style.id = 'rainbow-keyframes';
                style.textContent = `
                    @keyframes rainbow {
                        0% { filter: hue-rotate(0deg); }
                        100% { filter: hue-rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            showNotification('🎉 Easter egg found! Welcome to the Ngaan family!', 'success');
            
            setTimeout(() => {
                logo.style.animation = '';
            }, 4000);
        }
    }

    // Mobile-specific optimizations
    if (window.innerWidth <= 768) {
        // Disable parallax on mobile for performance
        window.addEventListener('scroll', throttle(() => {
            // Only handle nav background on mobile
            if (window.scrollY > 50) {
                elements.nav.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                elements.nav.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        }, 100));
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Resume animations when page becomes visible
            const animatedElements = document.querySelectorAll('[style*="animation-play-state"]');
            animatedElements.forEach(el => {
                el.style.animationPlayState = 'running';
            });
        } else {
            // Pause animations when page is hidden to save resources
            const animatedElements = document.querySelectorAll('[style*="animation"]');
            animatedElements.forEach(el => {
                el.style.animationPlayState = 'paused';
            });
        }
    });

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            if (loadTime > 3000) {
                console.warn('Page load time is slow:', loadTime + 'ms');
            }
        });
    }

    // Service worker registration (for future PWA features)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Placeholder for future service worker
            console.log('Service worker support detected');
        });
    }

})();