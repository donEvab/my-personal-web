const header = document.querySelector(".site-header");
const glowCards = document.querySelectorAll(
  ".profile-card.glass-card, .resume-panel.glass-card",
);
const revealItems = document.querySelectorAll("[data-reveal]");
const anchorLinks = document.querySelectorAll('a[href^="#"]');
const contactSection = document.querySelector("#contact");
const siteNav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");
const navToggleText = document.querySelector(".nav-toggle-text");
const themeToggle = document.querySelector(".theme-toggle");
const themeToggleText = document.querySelector(".theme-toggle-text");
const asciiOutput = document.querySelector(".ascii-output");

let targetScrollProgress = 0;
let currentScrollProgress = 0;
let targetScrollY = window.scrollY;
let currentScrollY = window.scrollY;
let isAutomatedScroll = false;
let lastTouchY = 0;
const mobileNavQuery = window.matchMedia("(max-width: 900px)");

const savedTheme = localStorage.getItem("portfolio-theme");
const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;

  if (themeToggleText) {
    themeToggleText.textContent = theme === "light" ? "Dark" : "Light";
  }

  if (themeToggle) {
    const nextTheme = theme === "light" ? "dark" : "light";
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  }
};

setTheme(savedTheme || (prefersLight ? "light" : "dark"));

const syncNavigationState = () => {
  if (!header || !navToggle || !siteNav) {
    return;
  }

  const isMobile = mobileNavQuery.matches;

  if (isMobile) {
    header.classList.toggle(
      "is-nav-visible",
      header.classList.contains("is-nav-open"),
    );
  } else {
    header.classList.remove("is-nav-open");
    header.classList.add("is-nav-visible");
  }

  const isVisible = isMobile ? header.classList.contains("is-nav-open") : true;

  navToggle.setAttribute("aria-expanded", String(isVisible));
  navToggle.setAttribute(
    "aria-label",
    isVisible ? "Close navigation menu" : "Open navigation menu",
  );

  if (navToggleText) {
    navToggleText.textContent = isVisible ? "Close" : "Menu";
  }
};

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

const getMaxScrollY = () =>
  Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

const setSlowScrollTarget = (nextY) => {
  targetScrollY = Math.min(Math.max(nextY, 0), getMaxScrollY());
};

const nudgeSlowScroll = (deltaY, multiplier = 0.48) => {
  const cappedDelta = Math.max(-260, Math.min(260, deltaY));
  setSlowScrollTarget(targetScrollY + cappedDelta * multiplier);
};

const animateSlowScroll = () => {
  const maxScrollY = getMaxScrollY();
  targetScrollY = Math.min(targetScrollY, maxScrollY);
  currentScrollY += (targetScrollY - currentScrollY) * 0.075;

  if (Math.abs(targetScrollY - currentScrollY) < 0.25) {
    currentScrollY = targetScrollY;
  }

  if (Math.abs(window.scrollY - currentScrollY) > 0.25) {
    isAutomatedScroll = true;
    window.scrollTo(0, currentScrollY);
    window.requestAnimationFrame(() => {
      isAutomatedScroll = false;
    });
  }

  requestAnimationFrame(animateSlowScroll);
};

const shouldUseNativeScroll = (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey) {
    return true;
  }

  const target = event.target;

  return (
    target instanceof Element &&
    Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
  );
};

const setupAsciiGlobe = () => {
  if (!asciiOutput) {
    return;
  }

  const chars = "  ..,:;=+*#%@";
  const maxColumns = 92;
  const maxRows = 44;
  let columns = 0;
  let rows = 0;
  let frame = 0;
  let lastFrame = -1;
  let scrollEnergy = 0;
  let wasActive = false;
  let lastScrollY = window.scrollY;
  let lastTickTime = 0;
  let cellAspect = 0.72;

  const measureCellAspect = () => {
    const styles = window.getComputedStyle(asciiOutput);
    const fontSize = Number.parseFloat(styles.fontSize) || 8;
    const lineHeight = Number.parseFloat(styles.lineHeight) || fontSize * 0.82;
    const canvas = measureCellAspect.canvas || document.createElement("canvas");
    const context = canvas.getContext("2d");

    measureCellAspect.canvas = canvas;

    if (!context || !lineHeight) {
      cellAspect = 0.72;
      return;
    }

    context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
    cellAspect = Math.min(Math.max(context.measureText("#").width / lineHeight, 0.5), 0.9);
  };

  const resizeGrid = () => {
    columns = Math.min(maxColumns, Math.max(64, Math.floor(window.innerWidth / 12)));
    rows = Math.min(maxRows, Math.max(34, Math.floor(window.innerHeight / 17)));
    measureCellAspect();
  };

  const smoothstep = (edgeA, edgeB, value) => {
    const amount = Math.min(Math.max((value - edgeA) / (edgeB - edgeA), 0), 1);
    return amount * amount * (3 - 2 * amount);
  };

  const angleDelta = (angle, center) =>
    Math.atan2(Math.sin(angle - center), Math.cos(angle - center));

  const geoBlob = (longitude, latitude, centerLongitude, centerLatitude, width, height) => {
    const dx = angleDelta(longitude, centerLongitude) / width;
    const dy = (latitude - centerLatitude) / height;

    return Math.max(0, 1 - dx * dx - dy * dy);
  };

  const pickChar = (value, x, y, isActive, activity) => {
    if (value < 0.055) {
      return " ";
    }

    const dropout = isActive
      ? Math.sin(frame * 0.72 + x * 2.13 + y * 3.71) +
        Math.cos(frame * 0.38 + x * 4.91 - y * 1.33)
      : -2;

    const dropoutLimit = 1.78 - activity * 0.24;
    const lowValueLimit = 1.34 - activity * 0.2;

    if (isActive && (dropout > dropoutLimit || (value < 0.34 && dropout > lowValueLimit))) {
      return " ";
    }

    const shimmer = isActive
      ? (Math.sin(frame * 0.28 + x * 0.42 + y * 0.16) * 0.075 +
          Math.cos(frame * 0.16 + x * 0.1 - y * 0.5) * 0.04) *
        activity
      : 0;
    const index = Math.min(
      chars.length - 1,
      Math.max(0, Math.floor((value + shimmer) * (chars.length - 1))),
    );

    return chars[index];
  };

  const renderAscii = () => {
    const output = [];
    const activity = Math.min(scrollEnergy, 1);
    const isActive = activity > 0.025;
    const rotation = currentScrollProgress * Math.PI * 1.35;
    const isCompactViewport = window.innerWidth < 700;
    const displayAspect = (columns * cellAspect) / rows;
    const sphereScaleY = 2.06;
    const sphereScaleX = isCompactViewport ? sphereScaleY * displayAspect : 2.88;

    for (let y = 0; y < rows; y += 1) {
      let line = "";

      for (let x = 0; x < columns; x += 1) {
        const sphereX = (x / (columns - 1) - 0.5) * sphereScaleX;
        const sphereY = (y / (rows - 1) - 0.5) * sphereScaleY;
        const radius = sphereX * sphereX + sphereY * sphereY;

        if (radius > 1) {
          line += " ";
          continue;
        }

        const sphereZ = Math.sqrt(Math.max(0, 1 - radius));
        const longitude = Math.atan2(sphereX, sphereZ) + rotation;
        const latitude = Math.asin(Math.min(Math.max(sphereY, -1), 1));
        const meridian =
          (1 - smoothstep(0.015, 0.075, Math.abs(Math.sin(longitude * 5)))) *
          (0.42 + sphereZ * 0.2);
        const parallel =
          (1 - smoothstep(0.02, 0.08, Math.abs(Math.sin(latitude * 7)))) *
          (0.32 + sphereZ * 0.16);
        const rim = smoothstep(0.72, 0.98, radius) * 0.82;
        const light = (sphereZ * 0.26 + (sphereX + 1) * 0.06) * 0.72;
        const continents = Math.min(
          1,
          geoBlob(longitude, latitude, -2.15, 0.36, 0.42, 0.34) * 0.85 +
            geoBlob(longitude, latitude, -1.55, -0.42, 0.28, 0.42) * 0.8 +
            geoBlob(longitude, latitude, -0.25, 0.08, 0.42, 0.44) * 0.88 +
            geoBlob(longitude, latitude, 0.56, 0.36, 0.5, 0.34) * 0.84 +
            geoBlob(longitude, latitude, 1.18, -0.36, 0.28, 0.22) * 0.66,
        );
        const coastline =
          (1 - smoothstep(0.02, 0.18, Math.abs(continents - 0.48))) *
          (continents > 0 ? 0.35 : 0);
        const grain =
          Math.sin(x * 0.37 + longitude * 1.6) *
          Math.cos(y * 0.53 + latitude * 2.2) *
          0.025;
        const value = Math.max(
          0,
          Math.min(
            1,
            rim + meridian + parallel + continents * 0.74 + coastline + light + grain,
          ),
        );
        line += pickChar(value, x, y, isActive, activity);
      }

      output.push(line);
    }

    asciiOutput.textContent = output.join("\n");
  };

  const tick = (time) => {
    const elapsed = lastTickTime ? time - lastTickTime : 16;
    lastTickTime = time;
    scrollEnergy *= Math.exp(-elapsed / 180);
    const isActive = scrollEnergy > 0.025;
    const nextFrame = isActive ? Math.floor(time / 165) : 0;

    if (nextFrame !== lastFrame || isActive !== wasActive) {
      lastFrame = nextFrame;
      frame = nextFrame;
      wasActive = isActive;
      renderAscii();
    }

    requestAnimationFrame(tick);
  };

  resizeGrid();
  renderAscii();
  requestAnimationFrame(tick);
  window.addEventListener("resize", () => {
    resizeGrid();
    renderAscii();
  });
  window.addEventListener(
    "scroll",
    () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = Math.abs(nextScrollY - lastScrollY);
      lastScrollY = nextScrollY;

      if (scrollDelta > 1) {
        scrollEnergy = 1;
      }
    },
    { passive: true },
  );
};

const animateBackground = () => {
  currentScrollProgress +=
    (targetScrollProgress - currentScrollProgress) * 0.08;

  if (Math.abs(targetScrollProgress - currentScrollProgress) < 0.001) {
    currentScrollProgress = targetScrollProgress;
  }

  document.documentElement.style.setProperty(
    "--scroll-progress",
    currentScrollProgress.toFixed(3),
  );
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
  setSlowScrollTarget(targetY);
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
  { threshold: 0.16 },
);

revealItems.forEach((item, index) => {
  item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
  revealObserver.observe(item);
});

if (contactSection) {
  const contactObserver = new IntersectionObserver(
    ([entry]) => {
      contactSection.classList.toggle(
        "is-contact-active",
        entry.isIntersecting,
      );
    },
    { threshold: 0.35 },
  );

  contactObserver.observe(contactSection);
}

updateHeader();
updateScrollProgress();
syncNavigationState();
setupAsciiGlobe();
animateSlowScroll();
animateBackground();

window.addEventListener(
  "scroll",
  () => {
    if (!isAutomatedScroll) {
      currentScrollY = window.scrollY;
      targetScrollY = window.scrollY;
    }

    updateHeader();
    updateScrollProgress();
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  setSlowScrollTarget(targetScrollY);
  updateScrollProgress();
});
window.addEventListener("pointermove", updateGlow);
window.addEventListener(
  "wheel",
  (event) => {
    if (shouldUseNativeScroll(event)) {
      return;
    }

    event.preventDefault();
    nudgeSlowScroll(event.deltaY);
  },
  { passive: false },
);
window.addEventListener(
  "touchstart",
  (event) => {
    lastTouchY = event.touches[0]?.clientY || 0;
  },
  { passive: true },
);
window.addEventListener(
  "touchmove",
  (event) => {
    if (shouldUseNativeScroll(event) || event.touches.length !== 1) {
      return;
    }

    const nextTouchY = event.touches[0].clientY;
    const deltaY = lastTouchY - nextTouchY;
    lastTouchY = nextTouchY;
    event.preventDefault();
    nudgeSlowScroll(deltaY, 0.8);
  },
  { passive: false },
);
window.addEventListener("keydown", (event) => {
  if (shouldUseNativeScroll(event)) {
    return;
  }

  const keyScrollMap = {
    ArrowDown: 82,
    ArrowUp: -82,
    PageDown: window.innerHeight * 0.72,
    PageUp: -window.innerHeight * 0.72,
    Space: window.innerHeight * (event.shiftKey ? -0.72 : 0.72),
    Home: -Infinity,
    End: Infinity,
  };
  const deltaY = keyScrollMap[event.code] ?? keyScrollMap[event.key];

  if (deltaY === undefined) {
    return;
  }

  event.preventDefault();

  if (deltaY === Infinity) {
    setSlowScrollTarget(getMaxScrollY());
    return;
  }

  if (deltaY === -Infinity) {
    setSlowScrollTarget(0);
    return;
  }

  nudgeSlowScroll(deltaY, 1);
});

if (mobileNavQuery.addEventListener) {
  mobileNavQuery.addEventListener("change", syncNavigationState);
} else {
  mobileNavQuery.addListener(syncNavigationState);
}

navToggle?.addEventListener("click", () => {
  if (!mobileNavQuery.matches) {
    return;
  }

  header.classList.toggle("is-nav-open");
  syncNavigationState();
});

document.addEventListener("click", (event) => {
  if (!mobileNavQuery.matches || !header.classList.contains("is-nav-open")) {
    return;
  }

  const target = event.target;

  if (target instanceof Node && header.contains(target)) {
    return;
  }

  header.classList.remove("is-nav-open");
  syncNavigationState();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !header.classList.contains("is-nav-open")) {
    return;
  }

  header.classList.remove("is-nav-open");
  syncNavigationState();
  navToggle?.focus();
});

themeToggle?.addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "light" ? "dark" : "light";

  localStorage.setItem("portfolio-theme", nextTheme);
  setTheme(nextTheme);
});

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

    if (mobileNavQuery.matches) {
      header.classList.remove("is-nav-open");
      syncNavigationState();
    }

    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const targetY =
      target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;

    window.setTimeout(() => {
      smoothScrollTo(targetY);
    }, 170);
  });
});
