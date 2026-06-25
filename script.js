const header = document.querySelector(".site-header");
const glowCards = document.querySelectorAll(".glass-card");
const revealItems = document.querySelectorAll("[data-reveal]");

let targetScrollProgress = 0;
let currentScrollProgress = 0;

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

const getScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

  return Math.min(Math.max(progress, 0), 1);
};

const updateScrollProgress = () => {
  targetScrollProgress = getScrollProgress();
};

const animateBackground = () => {
  currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.08;

  if (Math.abs(targetScrollProgress - currentScrollProgress) < 0.001) {
    currentScrollProgress = targetScrollProgress;
  }

  document.documentElement.style.setProperty("--scroll-progress", currentScrollProgress.toFixed(3));
  requestAnimationFrame(animateBackground);
};

const updateGlow = (event) => {
  glowCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty("--glow-x", `${x}%`);
    card.style.setProperty("--glow-y", `${y}%`);
  });
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

updateHeader();
updateScrollProgress();
animateBackground();

window.addEventListener("scroll", () => {
  updateHeader();
  updateScrollProgress();
}, { passive: true });

window.addEventListener("resize", updateScrollProgress);
window.addEventListener("pointermove", updateGlow);
