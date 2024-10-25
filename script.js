// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyBDrb3XT8ppaO0T7tzOdUPS_NjA5-Oxqxo",
    authDomain: "meme-ex-6a79b.firebaseapp.com",
    projectId: "meme-ex-6a79b",
    storageBucket: "meme-ex-6a79b.appspot.com",
    messagingSenderId: "90531183780",
    appId: "1:90531183780:web:21bdecc087de737744ba31",
    measurementId: "G-0M1JK8BL7X"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Global state management
let currentUser = null;

// Authentication Event Listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateUIForAuthState(user);
    if (user) {
        loadMemes();
        initializeAdSense();
    }
});

// UI Update Functions
function updateUIForAuthState(user) {
    const authContainer = document.getElementById('authContainer');
    const memeContainer = document.getElementById('memeContainer');
    const userSection = document.getElementById('userSection');

    if (user) {
        authContainer.style.display = 'none';
        memeContainer.style.display = 'block';
        userSection.innerHTML = `
            <span class="user-email">${user.email}</span>
            <button onclick="handleSignOut()" class="btn-logout">Sign Out</button>
        `;
        renderMemeForm();
    } else {
        authContainer.style.display = 'block';
        memeContainer.style.display = 'none';
        userSection.innerHTML = '';
        renderAuthForm();
    }
}

function renderAuthForm() {
    const authContainer = document.getElementById('authContainer');
    authContainer.innerHTML = `
        <div class="auth-form">
            <h2>Authentication</h2>
            <div class="form-group">
                <input type="email" id="email" placeholder="Email" required>
            </div>
            <div class="form-group">
                <input type="password" id="password" placeholder="Password" required>
            </div>
            <div class="auth-buttons">
                <button onclick="handleSignIn()" class="btn-primary">Sign In</button>
                <button onclick="handleSignUp()" class="btn-secondary">Sign Up</button>
            </div>
        </div>
    `;
}

function renderMemeForm() {
    const memeContainer = document.getElementById('memeContainer');
    memeContainer.innerHTML = `
        <div class="meme-form">
            <textarea id="memeContent" placeholder="Share your meme..." class="meme-input"></textarea>
            <button onclick="handleAddMeme()" class="btn-post">Post Meme</button>
        </div>
        <div id="memesList" class="memes-list"></div>
    `;
}

// Authentication Handlers
async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        showNotification('Account created successfully!', 'success');
        gtag('event', 'sign_up', {
            'method': 'email'
        });
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showNotification('Signed in successfully!', 'success');
        gtag('event', 'login', {
            'method': 'email'
        });
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleSignOut() {
    try {
        await signOut(auth);
        showNotification('Signed out successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Meme Management Functions
async function handleAddMeme() {
    const memeContent = document.getElementById('memeContent').value;
    if (!memeContent.trim()) {
        showNotification('Please enter some content for your meme', 'error');
        return;
    }

    try {
        await addDoc(collection(db, "memes"), {
            content: memeContent,
            userId: currentUser.uid,
            author: currentUser.email,
            likes: 0,
            created: serverTimestamp()
        });

        document.getElementById('memeContent').value = '';
        showNotification('Meme posted successfully!', 'success');
        gtag('event', 'create_meme');
        await loadMemes();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleLikeMeme(memeId) {
    if (!currentUser) {
        showNotification('Please sign in to like memes', 'error');
        return;
    }

    try {
        const memeRef = doc(db, "memes", memeId);
        await updateDoc(memeRef, {
            likes: increment(1)
        });
        gtag('event', 'like_meme');
        await loadMemes();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleDeleteMeme(memeId) {
    try {
        await deleteDoc(doc(db, "memes", memeId));
        showNotification('Meme deleted successfully!', 'success');
        gtag('event', 'delete_meme');
        await loadMemes();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadMemes() {
    const memesListElement = document.getElementById('memesList');
    memesListElement.innerHTML = '<div class="loading">Loading memes...</div>';

    try {
        const q = query(collection(db, "memes"), orderBy("created", "desc"));
        const querySnapshot = await getDocs(q);
        
        let memesHTML = '';
        querySnapshot.forEach((doc) => {
            const meme = doc.data();
            const isOwner = meme.userId === currentUser?.uid;
            
            memesHTML += `
                <div class="meme-card" data-meme-id="${doc.id}">
                    <div class="meme-content">${meme.content}</div>
                    <div class="meme-metadata">
                        <span class="meme-author">Posted by ${meme.author}</span>
                        <div class="meme-actions">
                            <button onclick="handleLikeMeme('${doc.id}')" class="btn-like">
                                ❤️ ${meme.likes || 0}
                            </button>
                            ${isOwner ? `
                                <button onclick="handleDeleteMeme('${doc.id}')" class="btn-delete">
                                    🗑️ Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        memesListElement.innerHTML = memesHTML || '<p class="no-memes">No memes yet. Be the first to post!</p>';
    } catch (error) {
        memesListElement.innerHTML = '<p class="error">Error loading memes. Please try again later.</p>';
        console.error('Error loading memes:', error);
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// AdSense Integration
function initializeAdSense() {
    (adsbygoogle = window.adsbygoogle || []).push({});
}

// Google Analytics Event Tracking
function trackEvent(eventName, params = {}) {
    gtag('event', eventName, params);
}

// Export functions for global access
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
window.handleSignOut = handleSignOut;
window.handleAddMeme = handleAddMeme;
window.handleLikeMeme = handleLikeMeme;
window.handleDeleteMeme = handleDeleteMeme;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    renderAuthForm();
    
    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-0M1JK8BL7X');
});
