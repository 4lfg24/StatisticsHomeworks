/**
 * ==============================================================================
 * HMWK 3 — HOME PORTAL SCRIPT
 * Ambient UI Enhancements & Quick Overview Navigation
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ambient glow parallax effect on mouse movement
  const orbs = document.querySelectorAll('.glow-orb');
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    orbs.forEach((orb, idx) => {
      const speed = (idx + 1) * 25;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });

  // Log portal initialization
  console.log('Statistics HMWK 3 Hub loaded: All 3 Tasks initialized and accessible.');
});
