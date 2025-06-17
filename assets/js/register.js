document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'http://localhost:3000';
    const form = document.getElementById('registerForm');
    const errorMsg = document.getElementById('error-msg');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Password validation function
    function validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        if (password.length < minLength) errors.push('Password must be at least 8 characters long');
        if (!hasUpperCase) errors.push('Include at least one uppercase letter');
        if (!hasLowerCase) errors.push('Include at least one lowercase letter');
        if (!hasNumbers) errors.push('Include at least one number');
        if (!hasSpecialChar) errors.push('Include at least one special character');
        return errors;
    }

    // Error handling functions
    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('error-shake');
        setTimeout(() => errorMsg.classList.remove('error-shake'), 500);
    }

    function clearError() {
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearError();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validations
        if (fullName.length < 2) {
            return showError('Please enter your full name');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return showError('Please enter a valid email address');
        }

        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return showError(passwordErrors[0]);
        }

        if (password !== confirmPassword) {
            return showError('Passwords do not match');
        }

        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store user data
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('userType', 'customer');
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('userName', fullName);

                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
                successMsg.textContent = 'Registration successful! Redirecting...';
                document.body.appendChild(successMsg);

                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/pages/inventory.html';
                }, 1500);
            } else {
                showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('Unable to connect to the server. Please try again later.');
        }
    });

    // Real-time password strength indicator
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const errors = validatePassword(password);
        let strengthIndicator = this.parentElement.querySelector('.password-strength');
        
        if (!strengthIndicator) {
            strengthIndicator = document.createElement('div');
            strengthIndicator.className = 'password-strength mt-1 text-sm';
            this.parentElement.appendChild(strengthIndicator);
        }

        if (password.length === 0) {
            strengthIndicator.textContent = '';
            return;
        }

        if (errors.length === 0) {
            strengthIndicator.textContent = 'Strong password';
            strengthIndicator.className = 'password-strength mt-1 text-sm text-green-500';
        } else if (errors.length <= 2) {
            strengthIndicator.textContent = 'Medium strength password';
            strengthIndicator.className = 'password-strength mt-1 text-sm text-yellow-500';
        } else {
            strengthIndicator.textContent = 'Weak password';
            strengthIndicator.className = 'password-strength mt-1 text-sm text-red-500';
        }
    });
});
