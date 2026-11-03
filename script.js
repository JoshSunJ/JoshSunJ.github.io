// Small enhancements; the site works with JavaScript disabled.
document.getElementById('year').textContent = new Date().getFullYear();
const cards = document.querySelectorAll('details.project');
cards.forEach((card) => {
  card.addEventListener('toggle', () => {
    if (!card.open) return;
    cards.forEach((other) => { if (other !== card) other.open = false; });
  });
});
