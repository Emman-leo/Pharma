import { supabase } from './supabase.js';

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Error logging in:', error);
        alert('Login failed: ' + error.message);
    } else {
        window.location.href = 'index.html';
    }
});
