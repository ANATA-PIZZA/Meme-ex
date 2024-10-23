// Main app initialization

document.addEventListener('DOMContentLoaded', () => {

    initializeAuth();

    initializeUI();

    setupEventListeners();

    initializeMemeCreator();

});

// Authentication handling

const auth = {

    currentUser: null,

    

    async login(email, password) {

        try {

            // Simulate API call

            const response = await fetch('/api/login', {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({ email, password })

            });

            

            if (response.ok) {

                const userData = await response.json();

                this.currentUser = userData;

                this.onAuthStateChanged(userData);

                return { success: true };

            }

        } catch (error) {

            console.error('Login error:', error);

            showNotification('Login failed. Please try again.', 'error');

            return { success: false, error };

        }

    },

    async loginWithSocial(provider) {

        try {

            const popup = window.open(`/auth/${provider}`, 'Social Login', 

                'width=500,height=600,scrollbars=yes');

            

            window.addEventListener('message', async (event) => {

                if (event.data.type === 'social-auth-success') {

                    this.currentUser = event.data.user;

                    this.onAuthStateChanged(event.data.user);

                    popup.close();

                }

            });

        } catch (error) {

            console.error('Social login error:', error);

            showNotification('Social login failed. Please try again.', 'error');

        }

    },

    onAuthStateChanged(user) {

        const authStateEvent = new CustomEvent('authStateChanged', { detail: { user } });

        document.dispatchEvent(authStateEvent);

        updateUIForAuthState(user);

    }

};

// UI Initialization and Updates

function initializeUI() {

    // Initialize loading states

    document.querySelectorAll('.btn').forEach(button => {

        button.addEventListener('click', function() {

            this.classList.add('loading');

        });

    });

    // Initialize tooltips

    const tooltips = document.querySelectorAll('[data-tooltip]');

    tooltips.forEach(element => {

        new Tooltip(element, {

            placement: 'top',

            trigger: 'hover'

        });

    });

    // Initialize animations

    initializeAnimations();

}

function updateUIForAuthState(user) {

    const authElements = document.querySelectorAll('[data-auth-required]');

    const nonAuthElements = document.querySelectorAll('[data-non-auth-required]');

    

    if (user) {

        authElements.forEach(el => el.classList.remove('hidden'));

        nonAuthElements.forEach(el => el.classList.add('hidden'));

        updateUserProfile(user);

    } else {

        authElements.forEach(el => el.classList.add('hidden'));

        nonAuthElements.forEach(el => el.classList.remove('hidden'));

    }

}

// Meme Creator Functionality

const memeCreator = {

    canvas: null,

    ctx: null,

    currentTemplate: null,

    

    initialize() {

        this.canvas = document.getElementById('memeCanvas');

        this.ctx = this.canvas.getContext('2d');

        this.setupTools();

        this.loadTemplates();

    },

    

    setupTools() {

        const textTool = document.getElementById('textTool');

        const imageTool = document.getElementById('imageTool');

        

        textTool.addEventListener('click', () => this.activateTool('text'));

        imageTool.addEventListener('click', () => this.activateTool('image'));

        

        this.setupTextControls();

        this.setupImageControls();

    },

    

    async loadTemplates() {

        try {

            const response = await fetch('/api/meme-templates');

            const templates = await response.json();

            this.renderTemplateGallery(templates);

        } catch (error) {

            console.error('Failed to load templates:', error);

            showNotification('Failed to load meme templates', 'error');

        }

    },

    

    renderTemplateGallery(templates) {

        const gallery = document.getElementById('templateGallery');

        templates.forEach(template => {

            const templateEl = createTemplateElement(template);

            templateEl.addEventListener('click', () => this.loadTemplate(template));

            gallery.appendChild(templateEl);

        });

    },

    

    async loadTemplate(template) {

        const img = new Image();

        img.crossOrigin = "anonymous";

        img.src = template.url;

        img.onload = () => {

            this.currentTemplate = template;

            this.resetCanvas();

            this.drawTemplate();

        };

    }

};

// Notification System

const notifications = {

    show(message, type = 'info', duration = 3000) {

        const notification = document.createElement('div');

        notification.className = `notification notification-${type}`;

        notification.textContent = message;

        

        document.body.appendChild(notification);

        

        // Animate in

        requestAnimationFrame(() => {

            notification.classList.add('notification-visible');

        });

        

        // Auto dismiss

        setTimeout(() => {

            notification.classList.remove('notification-visible');

            setTimeout(() => {

                notification.remove();

            }, 300);

        }, duration);

    }

};

// Event Listeners Setup

function setupEventListeners() {

    // Login form submission

    const loginForm = document.getElementById('loginForm');

    if (loginForm) {

        loginForm.addEventListener('submit', async (e) => {

            e.preventDefault();

            const email = loginForm.email.value;

            const password = loginForm.password.value;

            await auth.login(email, password);

        });

    }

    

    // Social login buttons

    const socialButtons = document.querySelectorAll('.social-btn');

    socialButtons.forEach(button => {

        button.addEventListener('click', () => {

            const provider = button.dataset.provider;

            auth.loginWithSocial(provider);

        });

    });

    

    // Navigation handling

    document.querySelectorAll('[data-nav]').forEach(link => {

        link.addEventListener('click', (e) => {

            e.preventDefault();

            const target = link.dataset.nav;

            navigateToSection(target);

        });

    });

}

// Animation Initialization

function initializeAnimations() {

    // Intersection Observer for scroll animations

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add('animate-in');

            }

        });

    }, { threshold: 0.1 });

    

    // Observe elements with animation classes

    document.querySelectorAll('.animate-on-scroll').forEach(el => {

        observer.observe(el);

    });

}

// Utility Functions

function navigateToSection(section) {

    const targetSection = document.getElementById(section);

    if (targetSection) {

        window.scrollTo({

            top: targetSection.offsetTop - 80,

            behavior: 'smooth'

        });

    }

}

function showNotification(message, type) {

    notifications.show(message, type);

}

function createTemplateElement(template) {

    const element = document.createElement('div');

    element.className = 'template-item';

    element.innerHTML = `

        <img src="${template.thumbnailUrl}" alt="${template.name}">

        <span>${template.name}</span>

    `;

    return element;

}

// Initialize background animation

function initBackgroundAnimation() {

    const canvas = document.createElement('canvas');

    const ctx = canvas.getContext('2d');

    

    canvas.className = 'background-canvas';

    document.body.appendChild(canvas);

    

    function resize() {

        canvas.width = window.innerWidth;

        canvas.height = window.innerHeight;

    }

    

    window.addEventListener('resize', resize);

    resize();

    

    // Animation loop for background effects

    function animate() {

        // Add your creative background animation here

        requestAnimationFrame(animate);

    }

    

    animate();

}

// Error handling

window.onerror = function(msg, url, lineNo, columnNo, error) {

    console.error('Error: ', msg, url, lineNo, columnNo, error);

    showNotification('Something went wrong. Please try again.', 'error');

    return false;

};

// Export for module usage

export {

    auth,

    memeCreator,

    notifications,

    initializeUI,

    setupEventListeners

};