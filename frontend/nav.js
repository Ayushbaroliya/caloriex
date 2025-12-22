// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobile-menu');
  const navLinks = document.getElementById('nav-links');
  
  // Only proceed if elements exist
  if (!mobileMenuBtn || !navLinks) {
    console.warn('Mobile menu elements not found');
    return;
  }

  // Toggle menu on button click
  mobileMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    navLinks.classList.toggle('open');
  });

  // Close menu when clicking on a link
  const navItems = navLinks.querySelectorAll('a');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      navLinks.classList.remove('open');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
});