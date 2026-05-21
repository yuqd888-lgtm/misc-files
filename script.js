const canvas = document.getElementById("heroCanvas");
const ctx = canvas.getContext("2d");
const sectionLinks = Array.from(document.querySelectorAll(".scroll-index a"));
const sections = Array.from(document.querySelectorAll("section[id]"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const heroFrame = document.querySelector("[data-parallax-root]");
const parallaxItems = Array.from(document.querySelectorAll("[data-depth]"));
const glitchTitle = document.querySelector("[data-glitch-title]");
let glitchChars = [];
let pointerFrame = null;

let width = 0;
let height = 0;
let dpr = 1;
let nodes = [];
let pointer = { x: 0, y: 0, active: false };

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function prepareGlitchTitle() {
  if (!glitchTitle) return;
  const text = glitchTitle.textContent.trim();
  glitchTitle.dataset.text = text;
  glitchTitle.textContent = "";

  text.split(" ").forEach((word, wordIndex, words) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "glitch-word";

    Array.from(word).forEach((char) => {
      const charSpan = document.createElement("span");
      charSpan.className = "glitch-char";
      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
    });

    glitchTitle.appendChild(wordSpan);

    if (wordIndex < words.length - 1) {
      const space = document.createElement("span");
      space.className = "glitch-space";
      space.textContent = " ";
      glitchTitle.appendChild(space);
    }
  });

  glitchChars = Array.from(glitchTitle.querySelectorAll(".glitch-char"));
}

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const nodeCount = Math.min(86, Math.max(42, Math.floor((width * height) / 18000)));
  nodes = Array.from({ length: nodeCount }, (_, index) => ({
    x: (index * 197) % width,
    y: (index * 113) % height,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    r: Math.random() * 1.8 + 0.8
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, width, height);

  nodes.forEach((node) => {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < -20) node.x = width + 20;
    if (node.x > width + 20) node.x = -20;
    if (node.y < -20) node.y = height + 20;
    if (node.y > height + 20) node.y = -20;

    if (pointer.active) {
      const dx = pointer.x - node.x;
      const dy = pointer.y - node.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 170) {
        node.x -= dx * 0.002;
        node.y -= dy * 0.002;
      }
    }
  });

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < 135) {
        const alpha = 1 - distance / 135;
        ctx.strokeStyle = `rgba(126, 231, 200, ${alpha * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  nodes.forEach((node) => {
    ctx.fillStyle = "rgba(126, 231, 200, 0.72)";
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
  });

  if (pointer.active) {
    const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 240);
    glow.addColorStop(0, "rgba(246, 173, 85, 0.18)");
    glow.addColorStop(1, "rgba(246, 173, 85, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(pointer.x - 240, pointer.y - 240, 480, 480);
  }

  requestAnimationFrame(drawCanvas);
}

function updateActiveSection() {
  const center = window.scrollY + window.innerHeight * 0.45;
  let active = sections[0]?.id;

  sections.forEach((section) => {
    if (section.offsetTop <= center) {
      active = section.id;
    }
  });

  sectionLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${active}`);
  });
}

function updateHeroScroll() {
  if (!heroFrame) return;
  const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.72)));
  heroFrame.style.setProperty("--hero-opacity", String(1 - progress * 0.46));
  heroFrame.style.setProperty("--hero-shift", `${progress * 54}px`);
  heroFrame.style.setProperty("--hero-scale", String(1 + progress * 0.08));
}

function updateParallax(event) {
  if (!heroFrame) return;
  const rect = heroFrame.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
  const xPercent = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
  const yPercent = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;

  heroFrame.style.setProperty("--cursor-x", `${xPercent}%`);
  heroFrame.style.setProperty("--cursor-y", `${yPercent}%`);
  heroFrame.style.setProperty("--stage-x", `${x * -22}px`);
  heroFrame.style.setProperty("--stage-y", `${y * -14}px`);

  parallaxItems.forEach((item) => {
    const depth = Number(item.dataset.depth || 0);
    item.style.setProperty("--px", `${x * depth * 120}px`);
    item.style.setProperty("--py", `${y * depth * 90}px`);
  });
}

function resetParallax() {
  if (heroFrame) {
    heroFrame.classList.remove("glitch-active");
    heroFrame.style.setProperty("--stage-x", "0px");
    heroFrame.style.setProperty("--stage-y", "0px");
  }
  parallaxItems.forEach((item) => {
    item.style.setProperty("--px", "0px");
    item.style.setProperty("--py", "0px");
  });
  glitchChars.forEach((char) => {
    char.classList.remove("disturbed");
    char.style.setProperty("--jx", "0px");
    char.style.setProperty("--jy", "0px");
    char.style.setProperty("--jr", "0deg");
  });
}

function updateGlitchTitle(event) {
  if (!heroFrame || !glitchTitle || !glitchChars.length) return;
  const titleRect = glitchTitle.getBoundingClientRect();
  const cursorNearTitle =
    event.clientX > titleRect.left - 90 &&
    event.clientX < titleRect.right + 90 &&
    event.clientY > titleRect.top - 110 &&
    event.clientY < titleRect.bottom + 110;

  heroFrame.classList.toggle("glitch-active", cursorNearTitle);

  if (!cursorNearTitle) {
    glitchChars.forEach((char) => {
      char.classList.remove("disturbed");
      char.style.setProperty("--jx", "0px");
      char.style.setProperty("--jy", "0px");
      char.style.setProperty("--jr", "0deg");
    });
    return;
  }

  glitchChars.forEach((char, index) => {
    const rect = char.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - event.clientX;
    const dy = cy - event.clientY;
    const distance = Math.hypot(dx, dy);
    const radius = window.innerWidth < 680 ? 92 : 142;
    const force = Math.max(0, 1 - distance / radius);

    if (force > 0) {
      const directionX = dx === 0 ? 0 : dx / Math.max(1, distance);
      const directionY = dy === 0 ? 0 : dy / Math.max(1, distance);
      const jitter = ((index % 5) - 2) * force;
      const mobileFactor = window.innerWidth < 680 ? 0.58 : 1;
      char.classList.add("disturbed");
      char.style.setProperty("--jx", `${(directionX * force * 15 + jitter) * mobileFactor}px`);
      char.style.setProperty("--jy", `${(directionY * force * 11 - jitter) * mobileFactor}px`);
      char.style.setProperty("--jr", `${((index % 2 ? 1 : -1) * force * 5) * mobileFactor}deg`);
    } else {
      char.classList.remove("disturbed");
      char.style.setProperty("--jx", "0px");
      char.style.setProperty("--jy", "0px");
      char.style.setProperty("--jr", "0deg");
    }
  });
}

function queuePointerFrame(event) {
  pointer = { x: event.clientX, y: event.clientY, active: true };
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    updateParallax(event);
    updateGlitchTitle(event);
    pointerFrame = null;
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (targetId === "#hero") {
      event.preventDefault();
      window.history.replaceState(null, "", "#hero");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", () => {
  updateActiveSection();
  updateHeroScroll();
}, { passive: true });
window.addEventListener("pointermove", queuePointerFrame);
window.addEventListener("pointerleave", () => {
  pointer.active = false;
  resetParallax();
});

prepareGlitchTitle();
resizeCanvas();
if (window.location.hash === "#hero") {
  window.scrollTo(0, 0);
}
updateActiveSection();
updateHeroScroll();
requestAnimationFrame(drawCanvas);

window.addEventListener("load", () => {
  if (!window.location.hash || window.location.hash === "#hero") {
    window.scrollTo(0, 0);
    updateActiveSection();
    updateHeroScroll();
  }
});
