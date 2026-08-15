/**
 * SITEHUB MAN — Interactive HTML UI Mockup Suite Logic
 * Handles tab navigation, theme mode toggling, 3D card flip,
 * NFC encoding simulation, and analytics tracking events.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetScreen = item.getAttribute('data-target');

      navItems.forEach((n) => n.classList.remove('active'));
      screens.forEach((s) => s.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(targetScreen).classList.add('active');
    });
  });

  // Device Frame Mode Switcher
  const btnIphone = document.getElementById('btnIphone');
  const btnWide = document.getElementById('btnWide');
  const deviceFrame = document.querySelector('.device-frame');

  if (btnIphone && btnWide && deviceFrame) {
    btnIphone.addEventListener('click', () => {
      deviceFrame.classList.remove('wide-mode');
      btnIphone.classList.add('active');
      btnWide.classList.remove('active');
    });

    btnWide.addEventListener('click', () => {
      deviceFrame.classList.add('wide-mode');
      btnWide.classList.add('active');
      btnIphone.classList.remove('active');
    });
  }

  // Theme Switcher (Dark vs Light)
  const themeToggle = document.getElementById('themeToggle');
  let currentTheme = 'dark';

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      themeToggle.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
  }

  // Live Card Flip & 3D Tilt Effect
  const nfcCard = document.getElementById('nfcCard');
  let isFlipped = false;

  if (nfcCard) {
    nfcCard.addEventListener('click', () => {
      isFlipped = !isFlipped;
      if (isFlipped) {
        nfcCard.style.transform = 'rotateY(180deg)';
      } else {
        nfcCard.style.transform = 'rotateY(0deg)';
      }
    });
  }

  // NFC Write Simulation
  const btnSimulateNfc = document.getElementById('btnSimulateNfc');
  const nfcStatusText = document.getElementById('nfcStatusText');
  const nfcProgress = document.getElementById('nfcProgress');

  if (btnSimulateNfc && nfcStatusText && nfcProgress) {
    btnSimulateNfc.addEventListener('click', () => {
      btnSimulateNfc.disabled = true;
      nfcStatusText.textContent = 'Hold NFC card near phone... 📡';
      nfcProgress.style.width = '30%';

      setTimeout(() => {
        nfcStatusText.textContent = 'Encoding 14 Profile Fields to Chip... 💾';
        nfcProgress.style.width = '70%';
      }, 1000);

      setTimeout(() => {
        nfcStatusText.textContent = '✅ Success! Card Encoded (UID: 04:A2:8F:90:3B)';
        nfcProgress.style.width = '100%';
        btnSimulateNfc.disabled = false;
        alert('NFC Card Encoded Successfully! Ready for tap sharing.');
      }, 2200);
    });
  }

  // Social Link Click Counter Simulation
  const socialLinks = document.querySelectorAll('.social-item');
  const totalClicksElem = document.getElementById('totalClicks');

  let clickCount = 19;

  socialLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      clickCount++;
      if (totalClicksElem) totalClicksElem.textContent = clickCount;
      const platformName = link.getAttribute('data-platform') || 'Link';
      alert(`Clicked ${platformName}! Tracked in Analytics API.`);
    });
  });
});
