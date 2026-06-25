const glassCards = document.querySelectorAll(".glass-card");
const anchorLinks = document.querySelectorAll('a[href^="#"]');
let targetScrollProgress = 0;
let currentScrollProgress = 0;

const updateGlow = (event) => {
  glassCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty("--glow-x", `${x}%`);
    card.style.setProperty("--glow-y", `${y}%`);
  });
};

const getScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

  return Math.min(Math.max(progress, 0), 1);
};

const animateScrollMotion = () => {
  currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.08;

  if (Math.abs(targetScrollProgress - currentScrollProgress) < 0.001) {
    currentScrollProgress = targetScrollProgress;
  }

  document.documentElement.style.setProperty("--scroll-progress", currentScrollProgress.toFixed(3));
  requestAnimationFrame(animateScrollMotion);
};

const updateScrollMotion = () => {
  targetScrollProgress = getScrollProgress();
};

const easeInOutCubic = (progress) => {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }

  return 1 - Math.pow(-2 * progress + 2, 3) / 2;
};

const smoothScrollTo = (targetY, duration = 1450) => {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * easedProgress);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

window.addEventListener("pointermove", updateGlow);
window.addEventListener("scroll", updateScrollMotion, { passive: true });
window.addEventListener("resize", updateScrollMotion);

anchorLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");

    if (!hash || hash === "#") {
      return;
    }

    const target = document.querySelector(hash);

    if (!target) {
      return;
    }

    event.preventDefault();

    const header = document.querySelector(".site-header");
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;

    window.setTimeout(() => {
      smoothScrollTo(targetY);
    }, 160);
  });
});

updateScrollMotion();
animateScrollMotion();
