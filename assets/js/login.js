document.addEventListener('DOMContentLoaded', function() {
    const API_URL = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    
    // Form elements
    const memberForm = document.getElementById('member-form');
    const memberLogin = document.getElementById('member-login');
    const errorMsg = document.getElementById('error-msg');
    const loader = document.getElementById('loader');
    const loginContainer = document.getElementById('login-container');
    const submitButton = memberForm.querySelector('button[type="submit"]');

    // Network status check
    let isOnline = navigator.onLine;
    window.addEventListener('online', () => {
        isOnline = true;
        errorMsg.classList.add('hidden');
    });
    window.addEventListener('offline', () => {
        isOnline = false;
        showError('Please check your internet connection');
    });

    // Show content after loading
    setTimeout(() => {
        loader.style.display = 'none';
        loginContainer.style.opacity = '1';
    }, 1000);

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('error-shake');
        setTimeout(() => errorMsg.classList.remove('error-shake'), 500);
    }

    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.innerHTML = isLoading ? 
            '<span class="spinner"></span> Logging in...' : 
            'Login';
        loader.style.display = isLoading ? 'block' : 'none';
    }

    async function attemptLogin(url, body) {
        const timeout = 15000; // 15 seconds timeout
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            } else if (!navigator.onLine) {
                throw new Error('No internet connection. Please check your network.');
            } else if (error.message === 'Failed to fetch') {
                throw new Error('Could not connect to server. Please try again later.');
            }
            throw error;
        }
    }

    function validateEmail(email) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }

    function setSession(data, userType) {
        // Clear any existing session data
        sessionStorage.clear();
        
        // Set session data with expiry
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        const sessionData = {
            userType,
            email: data.email,
            token: data.token,
            expiryTime
        };
        
        sessionStorage.setItem('session', JSON.stringify(sessionData));
    }

    function redirectBasedOnRole(userType) {
        // Add a small delay to ensure session is set
        setTimeout(() => {
            switch(userType) {
                case 'admin':
                    window.location.href = '/pages/admin.html';
                    break;
                case 'member':
                    window.location.href = '/pages/inventory.html';
                    break;
                default:
                    window.location.href = '/index.html';
            }
        }, 100);
    }

    // Rate limiting for login attempts
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
    let loginAttempts = 0;
    let lockoutUntil = 0;

    function checkLoginAttempts() {
        if (Date.now() < lockoutUntil) {
            const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
            throw new Error(`Too many login attempts. Please try again in ${minutesLeft} minutes.`);
        }
        
        if (loginAttempts >= MAX_ATTEMPTS) {
            lockoutUntil = Date.now() + LOCKOUT_TIME;
            loginAttempts = 0;
            throw new Error('Too many login attempts. Please try again in 15 minutes.');
        }
    }

    // Password visibility toggle
    function togglePasswordVisibility(button) {
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('svg');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            `;
        } else {
            input.type = 'password';
            icon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            `;
        }
    }

    // Form validation
    function validateForm() {
        const email = document.getElementById('member-email');
        const password = document.getElementById('member-password');
        const submitButton = memberForm.querySelector('button[type="submit"]');
        
        // Initialize button state
        submitButton.disabled = false;
        submitButton.classList.remove('opacity-50');

        function checkValidity() {
            const isValid = email.value.trim() !== '' && password.value.length > 0;
            submitButton.disabled = !isValid;
            submitButton.classList.toggle('opacity-50', !isValid);
        }

        // Initial check
        checkValidity();

        // Add event listeners for real-time validation
        email.addEventListener('input', checkValidity);
        password.addEventListener('input', checkValidity);

        // Remember me functionality
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe) {
            const savedEmail = localStorage.getItem('rememberedEmail');
            if (savedEmail) {
                email.value = savedEmail;
                rememberMe.checked = true;
                checkValidity();
            }

            rememberMe.addEventListener('change', () => {
                if (!rememberMe.checked) {
                    localStorage.removeItem('rememberedEmail');
                }
            });
        }
    }

    // Initialize form validation
    document.addEventListener('DOMContentLoaded', validateForm);

    // Save email if "Remember me" is checked
    memberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            showError('Please check your internet connection');
            return;
        }

        const email = document.getElementById('member-email').value.trim();
        const password = document.getElementById('member-password').value;
        const rememberMe = document.getElementById('remember-me');

        // Basic validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        
        try {
            // Admin login check
            if (email === 'admin@petverse.com' && password === 'admin123') {
                const adminSessionData = {
                    userType: 'admin',
                    email: email,
                    token: 'admin-token',
                    expiryTime: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };
                
                // Save admin session
                sessionStorage.setItem('session', JSON.stringify(adminSessionData));
                
                // Handle remember me for admin
                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Redirect to admin dashboard with a small delay to ensure session is set
                setTimeout(() => {
                    window.location.href = '/pages/admin.html';
                }, 100);
                return;
            }

            // Regular member login
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Handle remember me for members
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Set member session
            const memberSessionData = {
                userType: 'member',
                email: email,
                token: data.token,
                expiryTime: Date.now() + (24 * 60 * 60 * 1000)
            };
            sessionStorage.setItem('session', JSON.stringify(memberSessionData));

            // Redirect to inventory page
            setTimeout(() => {
                window.location.href = '/pages/inventory.html';
            }, 100);

        } catch (error) {
            showError(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // Add helper text for admin login
    const emailInput = document.getElementById('member-email');
    const helperText = document.createElement('div');
    helperText.className = 'text-sm text-gray-500 mt-1';
    helperText.textContent = 'For admin login, use "admin@petverse.com"';
    emailInput.parentElement.appendChild(helperText);
});
