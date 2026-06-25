const header = document.querySelector(".site-header");
const glowCards = document.querySelectorAll(".glass-card");
const revealItems = document.querySelectorAll("[data-reveal]");
const anchorLinks = document.querySelectorAll('a[href^="#"]');

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
    const tiltX = ((x - 50) / 50) * 1.4;
    const tiltY = ((50 - y) / 50) * 1.4;

    card.style.setProperty("--glow-x", `${x}%`);
    card.style.setProperty("--glow-y", `${y}%`);
    card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
  });
};

glowCards.forEach((card) => {
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  });
});

const easeInOutCubic = (progress) => {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }

  return 1 - Math.pow(-2 * progress + 2, 3) / 2;
};

const smoothScrollTo = (targetY, duration = 1500) => {
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

revealItems.forEach((item, index) => {
  item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
  revealObserver.observe(item);
});

updateHeader();
updateScrollProgress();
animateBackground();

window.addEventListener("scroll", () => {
  updateHeader();
  updateScrollProgress();
}, { passive: true });

window.addEventListener("resize", updateScrollProgress);
window.addEventListener("pointermove", updateGlow);

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

    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;

    window.setTimeout(() => {
      smoothScrollTo(targetY);
    }, 170);
  });
});
