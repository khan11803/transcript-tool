/* ── Portfolio – script.js ─────────────────────────── */

(function () {
  'use strict';

  // ── Navbar: shrink on scroll ──────────────────────
  const navbar = document.getElementById('navbar');

  function handleNavScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ── Mobile hamburger menu ─────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu when a link is tapped
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // ── Active nav link on scroll ─────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  function highlightNav() {
    var scrollY = window.scrollY + 120;

    sections.forEach(function (section) {
      var top    = section.offsetTop;
      var height = section.offsetHeight;
      var id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navAnchors.forEach(function (a) {
          a.classList.remove('active');
          if (a.getAttribute('href') === '#' + id) {
            a.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  // ── Scroll-reveal animation ───────────────────────
  var revealTargets = document.querySelectorAll(
    '.about-grid, .project-card, .contact-form, .section-title'
  );

  revealTargets.forEach(function (el) {
    el.classList.add('reveal');
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach(function (el) {
    observer.observe(el);
  });

  // ── Contact form validation ───────────────────────
  var form      = document.getElementById('contactForm');
  var statusEl  = document.getElementById('formStatus');

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className   = 'form-status ' + type;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nameVal    = form.name.value.trim();
    var emailVal   = form.email.value.trim();
    var messageVal = form.message.value.trim();
    var hasError   = false;

    // Clear previous errors
    form.querySelectorAll('.error').forEach(function (el) {
      el.classList.remove('error');
    });
    statusEl.textContent = '';

    if (!nameVal) {
      form.name.classList.add('error');
      hasError = true;
    }
    if (!emailVal || !isValidEmail(emailVal)) {
      form.email.classList.add('error');
      hasError = true;
    }
    if (!messageVal) {
      form.message.classList.add('error');
      hasError = true;
    }

    if (hasError) {
      showStatus('Please fill in all fields correctly.', 'error');
      return;
    }

    // Send via Web3Forms
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Sending…';

    var formData = new FormData(form);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success) {
        form.reset();
        showStatus('Message sent! Thanks for reaching out.', 'success');
        setTimeout(function () {
          statusEl.textContent = '';
        }, 5000);
      } else {
        showStatus('Something went wrong. Please try again.', 'error');
      }
    })
    .catch(function (error) {
      showStatus('Something went wrong. Please try again.', 'error');
    })
    .finally(function () {
      btn.disabled    = false;
      btn.textContent = 'Send Message';
    });
  });

  // Clear error style on input
  form.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('input', function () {
      field.classList.remove('error');
    });
  });
})();
