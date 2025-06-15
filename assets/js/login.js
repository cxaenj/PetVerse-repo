// login.js
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const loginBox = document.getElementById('login-container');
  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
    loginBox.classList.remove('opacity-0');
  }, 500);
});

const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = '/pages/admin.html';
  } else {
    errorMsg.classList.remove('hidden');
  }
});
