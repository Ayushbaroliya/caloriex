
(function() {
  const mobileMenuBtn = document.getElementById('mobile-menu');
  const navLinks = document.getElementById('nav-links');
  if (!mobileMenuBtn || !navLinks) return;

  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
})();