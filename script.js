const canvas = document.getElementById("heroCanvas");
const isEdge = /\bEdg\//.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useCanvas = false;
const ctx = canvas && useCanvas ? canvas.getContext("2d", { alpha: true }) : null;
const sectionLinks = Array.from(document.querySelectorAll(".scroll-index a"));
const sections = Array.from(document.querySelectorAll("section[id]:not([hidden])"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const siteHeader = document.querySelector(".site-header");
const heroFrame = document.querySelector("[data-parallax-root]");
const heroLoopVideos = Array.from(document.querySelectorAll("[data-hero-loop-video]"));
const parallaxItems = Array.from(document.querySelectorAll("[data-depth]"));
const glitchTitle = document.querySelector("[data-glitch-title]");
const copyTemplateButton = document.querySelector("[data-copy-template]");
const consultTemplate = document.getElementById("consult-template");
const proofCards = Array.from(document.querySelectorAll("[data-proof-card]"));
const proofModal = document.querySelector("[data-proof-modal]");
const proofModalMedia = document.querySelector("[data-proof-modal-media]");
const proofModalLabel = document.querySelector("[data-proof-modal-label]");
const proofModalStatus = document.querySelector("[data-proof-modal-status]");
const proofModalTitle = document.querySelector("[data-proof-modal-title]");
const proofModalDetails = document.querySelector("[data-proof-modal-details]");
const proofModalCopy = document.querySelector("[data-proof-copy]");
const proofModalContact = document.querySelector("[data-proof-contact]");
const horizontalWork = document.querySelector("[data-horizontal-work]");
const workViewport = document.querySelector("[data-work-viewport]");
const workTrack = document.querySelector("[data-work-track]");
const workCards = Array.from(document.querySelectorAll("[data-work-track] .project-board"));
const workCurrent = document.querySelector("[data-work-current]");
const interactionGallery = document.querySelector("[data-interaction-gallery]");
const interactionCards = Array.from(document.querySelectorAll("[data-interaction-card]"));
const dotFieldMounts = Array.from(document.querySelectorAll("[data-dot-field]"));
const interactionModal = document.querySelector("[data-interaction-modal]");
const interactionOpenButtons = Array.from(document.querySelectorAll("[data-interaction-open]"));
const interactionCloseControls = Array.from(document.querySelectorAll("[data-interaction-close]"));
const interactionContact = document.querySelector("[data-interaction-contact]");
const validationSwap = document.querySelector("[data-validation-swap]");
const swapCards = Array.from(document.querySelectorAll("[data-swap-card]"));
const swapCurrent = document.querySelector("[data-swap-current]");
const swapBar = document.querySelector("[data-swap-bar]");
const swapPrevButton = document.querySelector("[data-swap-prev]");
const swapNextButton = document.querySelector("[data-swap-next]");
const proofOpenButtons = Array.from(document.querySelectorAll("[data-proof-open]"));
let glitchChars = [];
let activeProofCard = null;
let pointerFrame = null;
let scrollFrame = null;
let scrollResumeTimer = null;
let workResizeFrame = null;
let swapTimer = null;
let swapIndex = 0;
let canvasFrame = null;
let canvasVisible = true;
let scrolling = false;
let lastCanvasTime = 0;
let lastActiveUpdate = 0;
let workEnabled = false;
let workMaxX = 0;
let interactionGalleryFrame = null;
let interactionGalleryCurrent = 0;
let interactionGalleryTarget = 0;
let interactionGalleryDragging = false;
let interactionGalleryStartX = 0;
let interactionGalleryStartTarget = 0;
let dotFieldInstances = [];

function initHeroVideoLoop() {
  if (heroLoopVideos.length < 2) return;

  const fadeMs = 720;
  const fadeSeconds = fadeMs / 1000;
  let activeIndex = 0;
  let switching = false;
  let monitorFrame = null;

  heroLoopVideos.forEach((video, index) => {
    video.muted = true;
    video.loop = false;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.classList.toggle("is-active", index === activeIndex);
    video.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");
  });

  const playSafely = (video) => {
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {});
    }
  };

  const swapVideos = () => {
    if (switching) return;

    const current = heroLoopVideos[activeIndex];
    const nextIndex = (activeIndex + 1) % heroLoopVideos.length;
    const next = heroLoopVideos[nextIndex];

    switching = true;
    next.currentTime = 0;
    next.setAttribute("aria-hidden", "false");
    playSafely(next);

    requestAnimationFrame(() => {
      next.classList.add("is-active");
      current.classList.remove("is-active");
      current.setAttribute("aria-hidden", "true");
    });

    window.setTimeout(() => {
      current.pause();
      current.currentTime = 0;
      activeIndex = nextIndex;
      switching = false;
    }, fadeMs + 80);
  };

  const monitor = () => {
    const active = heroLoopVideos[activeIndex];
    const duration = Number.isFinite(active.duration) ? active.duration : 0;
    const startFadeAt = Math.max(0.2, duration - Math.max(fadeSeconds, 0.82));

    if (duration > 0 && active.currentTime >= startFadeAt) {
      swapVideos();
    } else if (!switching && active.ended) {
      swapVideos();
    }

    monitorFrame = requestAnimationFrame(monitor);
  };

  const first = heroLoopVideos[activeIndex];
  playSafely(first);
  monitorFrame = requestAnimationFrame(monitor);

  document.addEventListener("visibilitychange", () => {
    const active = heroLoopVideos[activeIndex];
    if (document.hidden) {
      active.pause();
      if (monitorFrame) cancelAnimationFrame(monitorFrame);
      monitorFrame = null;
    } else {
      playSafely(active);
      if (!monitorFrame) monitorFrame = requestAnimationFrame(monitor);
    }
  });
}

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(
    normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized,
    16
  );

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixRgb(from, to, amount) {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  };
}

function initDotField(mount) {
  if (!mount) return;

  const wrapper = document.createElement("div");
  wrapper.className = "interaction-dot-field";
  const dotCanvas = document.createElement("canvas");
  const dotCtx = dotCanvas.getContext("2d");
  wrapper.appendChild(dotCanvas);
  mount.replaceChildren(wrapper);

  const options = {
    dotRadius: 1.5,
    dotSpacing: 14,
    bulgeStrength: 67,
    glowRadius: 160,
    cursorRadius: 500,
    cursorForce: 0.1,
    gradientFrom: "#A855F7",
    gradientTo: "#B497CF",
    glowColor: "#120F17",
  };
  const mouse = { x: 0.5, y: 0.5, active: false };
  const smoothMouse = { x: 0.5, y: 0.5 };
  const from = hexToRgb(options.gradientFrom);
  const to = hexToRgb(options.gradientTo);
  const glow = hexToRgb(options.glowColor);
  let width = 1;
  let height = 1;
  let dpr = 1;
  let points = [];

  const createPoints = () => {
    const cols = Math.ceil(width / options.dotSpacing) + 2;
    const rows = Math.ceil(height / options.dotSpacing) + 2;
    const offsetX = (width - (cols - 1) * options.dotSpacing) / 2;
    const offsetY = (height - (rows - 1) * options.dotSpacing) / 2;
    points = [];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        points.push({
          x: offsetX + x * options.dotSpacing,
          y: offsetY + y * options.dotSpacing,
          ratio: x / Math.max(cols - 1, 1),
        });
      }
    }
  };

  const resize = () => {
    const rect = wrapper.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    dotCanvas.width = Math.round(width * dpr);
    dotCanvas.height = Math.round(height * dpr);
    dotCanvas.style.width = `${width}px`;
    dotCanvas.style.height = `${height}px`;
    dotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createPoints();
  };

  const render = () => {
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
    const cursorX = smoothMouse.x * width;
    const cursorY = smoothMouse.y * height;

    dotCtx.clearRect(0, 0, width, height);
    const glowGradient = dotCtx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, options.glowRadius);
    glowGradient.addColorStop(0, `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.92)`);
    glowGradient.addColorStop(1, `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0)`);
    dotCtx.fillStyle = glowGradient;
    dotCtx.fillRect(0, 0, width, height);

    points.forEach((point) => {
      const dx = point.x - cursorX;
      const dy = point.y - cursorY;
      const distance = Math.hypot(dx, dy);
      const influence = mouse.active ? Math.max(0, 1 - distance / options.cursorRadius) : 0;
      const power = influence * influence;
      const angle = Math.atan2(dy, dx);
      const displacement = power * options.bulgeStrength * options.cursorForce;
      const x = point.x + Math.cos(angle) * displacement;
      const y = point.y + Math.sin(angle) * displacement;
      const color = mixRgb(from, to, point.ratio);
      const alpha = clampNumber(0.3 + power * 0.58, 0.12, 1);
      const radius = options.dotRadius + power * options.dotRadius * 1.45;

      dotCtx.beginPath();
      dotCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      dotCtx.arc(x, y, radius, 0, Math.PI * 2);
      dotCtx.fill();
    });

    requestAnimationFrame(render);
  };

  wrapper.addEventListener("pointermove", (event) => {
    const rect = wrapper.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / rect.width;
    mouse.y = (event.clientY - rect.top) / rect.height;
    mouse.active = true;
    wrapper.style.setProperty("--cursor-x", `${mouse.x * 100}%`);
    wrapper.style.setProperty("--cursor-y", `${mouse.y * 100}%`);
  });

  wrapper.addEventListener("pointerleave", () => {
    mouse.active = false;
  });

  window.addEventListener("resize", resize);
  resize();
  render();

  return { resize, wrapper };
}

function openInteractionModal() {
  if (!interactionModal) return;
  interactionModal.hidden = false;
  document.body.classList.add("interaction-modal-open", "modal-open");
  requestAnimationFrame(() => {
    dotFieldInstances.forEach((instance) => instance.resize());
  });
}

function closeInteractionModal() {
  if (!interactionModal) return;
  interactionModal.hidden = true;
  document.body.classList.remove("interaction-modal-open", "modal-open");
}

function updateInteractionGallery() {
  if (!interactionGallery || !interactionCards.length || window.innerWidth <= 760) return;

  interactionGalleryCurrent += (interactionGalleryTarget - interactionGalleryCurrent) * 0.05;
  const count = interactionCards.length;
  const rect = interactionGallery.getBoundingClientRect();
  const radius = Math.max(420, rect.width * 0.48);
  const angleStep = Math.PI / 7;
  const centerOffset = count * 500;

  interactionCards.forEach((card, index) => {
    const rawOffset = index - (interactionGalleryCurrent % count);
    const wrappedOffset = ((rawOffset + count / 2 + centerOffset) % count) - count / 2;
    const angle = wrappedOffset * angleStep;
    const depth = Math.cos(angle);
    const x = Math.sin(angle) * radius;
    const z = depth * radius - radius;
    const y = Math.abs(wrappedOffset) * Math.abs(wrappedOffset) * 9;
    const rotateY = -angle * 0.78;
    const rotateZ = wrappedOffset * -1.8;
    const opacity = clampNumber(1.18 - Math.abs(wrappedOffset) * 0.18, 0.16, 1);
    const brightness = clampNumber(1.08 - Math.abs(wrappedOffset) * 0.12, 0.42, 1);

    card.style.zIndex = String(Math.round((depth + 1) * 100));
    card.style.opacity = String(opacity);
    card.style.filter = `brightness(${brightness})`;
    card.style.transform = [
      "translate(-50%, -50%)",
      `translate3d(${x}px, ${y}px, ${z}px)`,
      `rotateY(${rotateY}rad)`,
      `rotateZ(${rotateZ}deg)`,
    ].join(" ");
  });

  interactionGalleryFrame = requestAnimationFrame(updateInteractionGallery);
}

function resetInteractionGalleryMobile() {
  if (window.innerWidth > 760) return;
  interactionCards.forEach((card) => {
    card.style.removeProperty("z-index");
    card.style.removeProperty("opacity");
    card.style.removeProperty("filter");
    card.style.removeProperty("transform");
  });
}

function initInteractionLab() {
  dotFieldInstances = dotFieldMounts.map(initDotField).filter(Boolean);
  if (!interactionGallery || !interactionCards.length) return;

  interactionOpenButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openInteractionModal();
    });
  });

  interactionCloseControls.forEach((control) => {
    control.addEventListener("click", closeInteractionModal);
  });

  interactionContact?.addEventListener("click", () => {
    closeInteractionModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && interactionModal && !interactionModal.hidden) {
      closeInteractionModal();
    }
  });

  interactionGallery.addEventListener("wheel", (event) => {
    if (window.innerWidth <= 760) return;
    event.preventDefault();
    interactionGalleryTarget += (event.deltaY || event.deltaX) * 0.012;
  }, { passive: false });

  interactionGallery.addEventListener("pointerdown", (event) => {
    if (window.innerWidth <= 760) return;
    interactionGalleryDragging = true;
    interactionGalleryStartX = event.clientX;
    interactionGalleryStartTarget = interactionGalleryTarget;
    interactionGallery.classList.add("is-dragging");
    interactionGallery.setPointerCapture(event.pointerId);
  });

  interactionGallery.addEventListener("pointermove", (event) => {
    if (!interactionGalleryDragging || window.innerWidth <= 760) return;
    const distance = event.clientX - interactionGalleryStartX;
    interactionGalleryTarget = interactionGalleryStartTarget - distance * 0.036;
  });

  const stopDragging = (event) => {
    interactionGalleryDragging = false;
    interactionGallery.classList.remove("is-dragging");
    if (interactionGallery.hasPointerCapture(event.pointerId)) {
      interactionGallery.releasePointerCapture(event.pointerId);
    }
  };

  interactionGallery.addEventListener("pointerup", stopDragging);
  interactionGallery.addEventListener("pointercancel", stopDragging);
  window.addEventListener("resize", resetInteractionGalleryMobile);

  if (!prefersReducedMotion) {
    updateInteractionGallery();
  } else {
    resetInteractionGalleryMobile();
  }
}
let workScrollDistance = 1;

let width = 0;
let height = 0;
let dpr = 1;
let nodes = [];
let pointer = { x: 0, y: 0, active: false };

document.documentElement.classList.toggle("is-edge", isEdge);

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function prepareGlitchTitle() {
  if (!glitchTitle) return;
  const text = glitchTitle.textContent.trim().replace("，让", "， 让");
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
  if (!ctx) return;
  dpr = prefersReducedMotion ? 1 : Math.min(window.devicePixelRatio || 1, isEdge ? 1.2 : 1.6);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const density = isEdge ? 30000 : 22000;
  const minNodes = isEdge ? 28 : 38;
  const maxNodes = isEdge ? 52 : 72;
  const nodeCount = Math.min(maxNodes, Math.max(minNodes, Math.floor((width * height) / density)));
  nodes = Array.from({ length: nodeCount }, (_, index) => ({
    x: (index * 197) % width,
    y: (index * 113) % height,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    r: Math.random() * 1.8 + 0.8
  }));
}

function canAnimateCanvas() {
  return useCanvas && Boolean(ctx) && canvasVisible && !scrolling && width > 0 && height > 0;
}

function scheduleCanvas() {
  if (canvasFrame || !canAnimateCanvas()) return;
  canvasFrame = requestAnimationFrame(drawCanvas);
}

function drawCanvas(timestamp = 0) {
  canvasFrame = null;
  if (!canAnimateCanvas()) return;

  const minFrameGap = isEdge ? 34 : 24;
  if (timestamp - lastCanvasTime < minFrameGap) {
    scheduleCanvas();
    return;
  }
  lastCanvasTime = timestamp;

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

  scheduleCanvas();
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
  if (window.scrollY > window.innerHeight * 1.15) return;
  const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.72)));
  heroFrame.style.setProperty("--hero-opacity", String(1 - progress * 0.46));
  heroFrame.style.setProperty("--hero-shift", `${progress * 54}px`);
  heroFrame.style.setProperty("--hero-scale", String(1 + progress * 0.08));
}

function setupHorizontalWork() {
  if (!horizontalWork || !workViewport || !workTrack || workCards.length < 2) return;
  if (workResizeFrame) cancelAnimationFrame(workResizeFrame);

  workResizeFrame = requestAnimationFrame(() => {
    const desktopQuery = window.matchMedia("(min-width: 981px) and (hover: hover)");
    workEnabled = desktopQuery.matches && !prefersReducedMotion;
    document.documentElement.classList.toggle("horizontal-work-ready", workEnabled);

    if (!workEnabled) {
      horizontalWork.style.removeProperty("--work-scroll-height");
      horizontalWork.style.setProperty("--work-progress", "0");
      horizontalWork.style.setProperty("--work-track-x", "0px");
      workCards.forEach((card) => {
        card.classList.remove("is-work-active");
        card.style.removeProperty("--work-card-scale");
        card.style.removeProperty("--work-card-y");
        card.style.removeProperty("--work-card-opacity");
      });
      return;
    }

    workMaxX = Math.max(0, workTrack.scrollWidth - workViewport.clientWidth);
    workScrollDistance = Math.max(window.innerHeight * 1.55, workMaxX * (isEdge ? 1.12 : 1.02));
    horizontalWork.style.setProperty("--work-scroll-height", `${window.innerHeight + workScrollDistance}px`);
    updateHorizontalWork();
    workResizeFrame = null;
  });
}

function updateHorizontalWork() {
  if (!workEnabled || !horizontalWork || !workViewport || !workTrack) return;

  const stickyTop = 76;
  const sectionStart = horizontalWork.offsetTop - stickyTop;
  const progress = Math.min(1, Math.max(0, (window.scrollY - sectionStart) / workScrollDistance));
  const trackX = -workMaxX * progress;
  const viewportCenter = workViewport.clientWidth * 0.5;
  let activeIndex = 0;
  let nearestDistance = Infinity;

  horizontalWork.style.setProperty("--work-progress", progress.toFixed(4));
  horizontalWork.style.setProperty("--work-track-x", `${trackX.toFixed(2)}px`);

  workCards.forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth * 0.5 + trackX;
    const distance = Math.abs(cardCenter - viewportCenter);
    const focus = Math.max(0, 1 - distance / Math.max(viewportCenter, card.offsetWidth));
    const scale = (isEdge ? 0.95 : 0.92) + focus * (isEdge ? 0.05 : 0.08);
    const opacity = (isEdge ? 0.7 : 0.58) + focus * (isEdge ? 0.3 : 0.42);

    card.style.setProperty("--work-card-scale", scale.toFixed(4));
    card.style.setProperty("--work-card-y", `${((1 - focus) * (isEdge ? 10 : 18)).toFixed(2)}px`);
    card.style.setProperty("--work-card-opacity", opacity.toFixed(4));

    if (distance < nearestDistance) {
      nearestDistance = distance;
      activeIndex = index;
    }
  });

  workCards.forEach((card, index) => card.classList.toggle("is-work-active", index === activeIndex));
  if (workCurrent) workCurrent.textContent = String(activeIndex + 1).padStart(2, "0");
}

function updateMobileWorkProgress() {
  if (workEnabled || !horizontalWork || !workViewport || workCards.length < 2) return;
  const maxScroll = Math.max(1, workViewport.scrollWidth - workViewport.clientWidth);
  const progress = Math.min(1, Math.max(0, workViewport.scrollLeft / maxScroll));
  const activeIndex = Math.min(workCards.length - 1, Math.round(progress * (workCards.length - 1)));
  horizontalWork.style.setProperty("--work-progress", progress.toFixed(4));
  if (workCurrent) workCurrent.textContent = String(activeIndex + 1).padStart(2, "0");
}

function handleScroll() {
  scrolling = true;
  if (scrollResumeTimer) {
    window.clearTimeout(scrollResumeTimer);
  }

  scrollResumeTimer = window.setTimeout(() => {
    scrolling = false;
    scheduleCanvas();
  }, isEdge ? 180 : 120);

  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    const now = performance.now();
    if (!isEdge || now - lastActiveUpdate > 120) {
      updateActiveSection();
      lastActiveUpdate = now;
    }
    updateHeroScroll();
    updateHorizontalWork();
    scrollFrame = null;
  });
}

function getProofCardText(card) {
  const title = card.querySelector("h3")?.textContent.trim() || "";
  const rows = getProofFieldRows(title);
  return [title, ...rows.map((item) => `${item.label}：${item.value}`)].filter(Boolean).join("\n");
}

const proofFieldMeanings = {
  purpose: "说明这个作品解决什么场景，客户为什么需要它。",
  tools: "说明制作链路和工具组合，判断是否能稳定复用。",
  ai: "说明哪些环节由 AI 提效，而不是包装成全自动。",
  human: "说明人工介入的审美、筛选、改稿和质量控制。",
  deliverable: "说明最后能交付给客户什么文件、页面或资料。",
  next: "说明这个作品还要用什么数据或场景继续验证。"
};

const proofFieldContent = {
  "小红书AI副业封面系统": {
    purpose: "验证 AI 能不能辅助做出更有点击感的小红书封面，并形成账号视觉模板。",
    tools: "ChatGPT、AI 图像工具、Canva / Photoshop、人工排版检查。",
    ai: "生成风格方向、标题备选、画面初稿和封面视觉参考。",
    human: "判断标题点击感、统一字体层级、修正色彩和版式，筛掉不适合发布的方案。",
    deliverable: "6-9 张封面样张、同主题多风格版本、标题优化前后对比。",
    next: "放到小红书测试点击率、收藏率和评论反馈，继续筛选稳定风格。"
  },
  "AI副业图文卡片": {
    purpose: "把一个 AI 副业观点做成可阅读、可收藏、适合发布的图文笔记。",
    tools: "ChatGPT、Canva / Figma、AI 配图工具、人工信息整理。",
    ai: "辅助拆观点、生成标题方向、整理内容页文案和配图建议。",
    human: "控制信息密度、排版层级、阅读顺序和首图吸引力。",
    deliverable: "6-8 页图文卡片，包含首图、内容页和总结页。",
    next: "测试哪类观点更容易被收藏，再决定是否扩展成系列模板。"
  },
  "0基础AI工具清单": {
    purpose: "帮助新手按真实任务选择工具，而不是看一堆无重点的工具合集。",
    tools: "ChatGPT、Notion / 表格、主流 AI 写作、设计、PPT、视频和网页工具。",
    ai: "辅助归类工具、生成使用场景说明和新手路径草稿。",
    human: "筛掉不稳定、不适合新手或学习成本过高的工具。",
    deliverable: "按写文案、做封面、做 PPT、剪视频、整理资料、做网页分类的工具清单。",
    next: "用真实任务逐个测试工具效果，保留可交付链路里的工具。"
  },
  "AI副业项目验证页": {
    purpose: "把一个 AI 副业方向拆成是否值得测试的判断页。",
    tools: "ChatGPT、网页原型、案例拆解表、需求分析模板。",
    ai: "辅助整理方向、用户需求、交付物、工具链和测试路径。",
    human: "判断真实需求、风险点、交付难度和 3-7 天验证方式。",
    deliverable: "一页项目拆解页，包含方向、用户、交付物、工具、风险和测试计划。",
    next: "用一个具体方向做小样，观察是否有人愿意咨询或付费。"
  },
  "AI PPT / 资料整理": {
    purpose: "验证 AI 能不能辅助做出可交付的 PPT 或资料包。",
    tools: "ChatGPT、Kimi / 通义文档、PPT、Canva / Figma。",
    ai: "提炼资料重点、生成 PPT 大纲、整理页面结构和表达顺序。",
    human: "重排逻辑、压缩废话、调整版式，让内容更像可交付文件。",
    deliverable: "一份 PPT 大纲、3-5 页 PPT 样稿、一页资料整理图和前后结构对比。",
    next: "找真实资料做测试，验证整理速度和客户能否直接使用。"
  },
  "AI作品前后对比": {
    purpose: "展示 AI 初稿到人工可交付版本之间的差距。",
    tools: "ChatGPT、AI 图像工具、Canva / Photoshop、人工审美修正。",
    ai: "生成初稿文案、初版封面、资料摘要和基础页面方向。",
    human: "修正标题、版式、信息层级、视觉一致性和最终交付质量。",
    deliverable: "AI 原始稿与人工优化稿对比，包括封面、文案、卡片和 PPT。",
    next: "持续记录不同类型作品的改稿过程，形成可展示的交付标准。"
  }
};

function getProofFieldRows(title) {
  const content = proofFieldContent[title] || {};
  return [
    { label: "作品用途", meaning: proofFieldMeanings.purpose, value: content.purpose || "说明这个作品服务的具体场景和客户需求。" },
    { label: "使用工具", meaning: proofFieldMeanings.tools, value: content.tools || "列出完成作品用到的 AI、设计、整理或网页工具。" },
    { label: "AI负责", meaning: proofFieldMeanings.ai, value: content.ai || "说明 AI 参与生成、整理、扩展或提效的部分。" },
    { label: "人工判断", meaning: proofFieldMeanings.human, value: content.human || "说明人工负责的审美、筛选、修改和质量判断。" },
    { label: "交付物", meaning: proofFieldMeanings.deliverable, value: content.deliverable || "说明最终可以交给客户的具体文件或结果。" },
    { label: "下一步验证", meaning: proofFieldMeanings.next, value: content.next || "说明接下来如何通过真实发布或咨询反馈继续验证。" }
  ];
}

function renderProofFields(title) {
  return getProofFieldRows(title).map((item) => {
    const row = document.createElement("article");
    row.className = "proof-field";

    const heading = document.createElement("h4");
    heading.textContent = item.label;

    const meaning = document.createElement("small");
    meaning.textContent = item.meaning;

    const value = document.createElement("p");
    value.textContent = item.value;

    row.append(heading, meaning, value);
    return row;
  });
}

function openProofModal(card) {
  if (!proofModal || !proofModalMedia || !proofModalTitle || !proofModalDetails) return;

  activeProofCard = card;
  const cardImage = card.querySelector("img");
  const title = card.querySelector("h3")?.textContent.trim() || "作品详情";
  const label = card.querySelector("span")?.textContent.trim() || "AI Proof";
  const status = card.querySelector(".validation-status")?.textContent.trim() || "验证中";
  const imageSources = (card.dataset.detailImages || card.dataset.detailImage || cardImage?.getAttribute("src") || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  const mediaItems = imageSources.map((src, index) => {
    const item = document.createElement("figure");
    item.className = "proof-modal-image-item";

    const preview = document.createElement("a");
    preview.className = "proof-modal-image-link";
    preview.href = src;
    preview.target = "_blank";
    preview.rel = "noopener";
    preview.title = "打开大图";
    preview.setAttribute("aria-label", `打开${title}第 ${index + 1} 张大图`);

    const image = document.createElement("img");
    image.src = src;
    image.alt = index === 0 ? cardImage?.getAttribute("alt") || title : `${title} image ${index + 1}`;
    preview.append(image);

    const download = document.createElement("a");
    download.className = "proof-modal-download";
    download.href = src;
    download.download = src.split("/").pop() || `${title}-${index + 1}.jpg`;
    download.textContent = `下载图片 ${index + 1}`;

    item.append(preview, download);
    return item;
  });

  if (imageSources.length > 1) {
    const hint = document.createElement("figcaption");
    hint.className = "proof-modal-hint";
    hint.textContent = `${imageSources.length} 张作品图，可上下滑动查看`;
    mediaItems.unshift(hint);
  }

  proofModalMedia.replaceChildren(...mediaItems);
  proofModalMedia.scrollTop = 0;
  proofModalTitle.textContent = title;

  if (proofModalLabel) proofModalLabel.textContent = label;
  if (proofModalStatus) proofModalStatus.textContent = status;

  proofModalDetails.replaceChildren(...renderProofFields(title));

  proofModal.hidden = false;
  window.requestAnimationFrame(() => {
    proofModalMedia.scrollTop = 0;
    proofModalDetails.scrollTop = 0;
  });
  document.body.classList.add("modal-open");
  proofModal.querySelector(".proof-modal-close")?.focus();
}

function closeProofModal() {
  if (!proofModal || proofModal.hidden) return;
  proofModal.hidden = true;
  document.body.classList.remove("modal-open");
  activeProofCard?.focus();
  activeProofCard = null;
}

async function copyProofDetails() {
  if (!activeProofCard || !proofModalCopy) return;
  const defaultLabel = "复制作品说明";
  try {
    await navigator.clipboard.writeText(getProofCardText(activeProofCard));
    proofModalCopy.textContent = "已复制";
  } catch (error) {
    proofModalCopy.textContent = "复制失败";
  }
  window.setTimeout(() => {
    proofModalCopy.textContent = defaultLabel;
  }, 1600);
}

function updateParallax(event) {
  if (!heroFrame) return;
  if (isEdge) {
    const rect = heroFrame.getBoundingClientRect();
    const localX = (event.clientX - rect.left) / Math.max(1, rect.width);
    const localY = (event.clientY - rect.top) / Math.max(1, rect.height);
    const x = (localX - 0.5) * 2;
    const y = (localY - 0.5) * 2;
    const xPercent = localX * 100;
    const yPercent = localY * 100;
    heroFrame.style.setProperty("--cursor-x", `${xPercent}%`);
    heroFrame.style.setProperty("--cursor-y", `${yPercent}%`);
    heroFrame.style.setProperty("--edge-window-x", `${x * -8}px`);
    heroFrame.style.setProperty("--edge-window-y", `${y * -6 - 5}px`);
    heroFrame.style.setProperty("--edge-title-x", `${x * -4}px`);
    heroFrame.style.setProperty("--edge-title-y", `${y * -3}px`);
    return;
  }
  const rect = heroFrame.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
  const xPercent = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
  const yPercent = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;

  heroFrame.style.setProperty("--cursor-x", `${xPercent}%`);
  heroFrame.style.setProperty("--cursor-y", `${yPercent}%`);
  heroFrame.style.setProperty("--stage-x", `${x * -22}px`);
  heroFrame.style.setProperty("--stage-y", `${y * -14}px`);
  heroFrame.style.setProperty("--edge-title-x", `${x * -4}px`);
  heroFrame.style.setProperty("--edge-title-y", `${y * -3}px`);

  parallaxItems.forEach((item) => {
    const depth = Number(item.dataset.depth || 0);
    item.style.setProperty("--px", `${x * depth * 120}px`);
    item.style.setProperty("--py", `${y * depth * 90}px`);
  });
}

function resetParallax() {
  if (heroFrame) {
    heroFrame.classList.remove("glitch-active", "motion-active");
    heroFrame.style.setProperty("--stage-x", "0px");
    heroFrame.style.setProperty("--stage-y", "0px");
    heroFrame.style.setProperty("--edge-window-x", "0px");
    heroFrame.style.setProperty("--edge-window-y", "0px");
    heroFrame.style.setProperty("--edge-title-x", "0px");
    heroFrame.style.setProperty("--edge-title-y", "0px");
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
  if (!canvasVisible) return;
  pointer = { x: event.clientX, y: event.clientY, active: true };
  if (heroFrame) {
    heroFrame.classList.add("motion-active");
  }
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

function releaseVisibleReveals() {
  revealItems.forEach((item) => {
    if (item.classList.contains("visible")) return;
    const rect = item.getBoundingClientRect();
    const withinViewport = rect.top < window.innerHeight * 1.18 && rect.bottom > -window.innerHeight * 0.18;
    if (withinViewport) {
      item.classList.add("visible");
      revealObserver.unobserve(item);
    }
  });
}

window.addEventListener("load", () => {
  setTimeout(releaseVisibleReveals, 900);
});

window.addEventListener("hashchange", () => {
  setTimeout(releaseVisibleReveals, 450);
});

const heroObserver = new IntersectionObserver(
  ([entry]) => {
    canvasVisible = entry.isIntersecting;
    if (canvasVisible) {
      scheduleCanvas();
    }
  },
  { threshold: 0.02 }
);

const heroSection = document.getElementById("hero");
if (heroSection) {
  heroObserver.observe(heroSection);
}

function navigateToSection(targetId, { replace = false } = {}) {
  if (!targetId || targetId === "#") return;

  const target = document.querySelector(targetId);
  if (!target) return;

  const headerOffset = siteHeader?.offsetHeight || 0;
  const targetTop =
    targetId === "#hero"
      ? 0
      : Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset - 16);

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.history[replace ? "replaceState" : "pushState"](null, "", targetId);
  window.scrollTo({ top: targetTop, behavior: "auto" });

  requestAnimationFrame(() => {
    root.style.scrollBehavior = previousScrollBehavior;
    updateActiveSection();
    updateHeroScroll();
    updateHorizontalWork();
  });
}

function updateValidationSwap() {
  if (!validationSwap || !swapCards.length) return;

  swapCards.forEach((card, index) => {
    const offset = (index - swapIndex + swapCards.length) % swapCards.length;
    const visibleOffset = Math.min(offset, 2);
    const isHidden = offset > 2;

    card.style.setProperty("--swap-x", `${visibleOffset * 54}px`);
    card.style.setProperty("--swap-y", `${visibleOffset * 40}px`);
    card.style.setProperty("--swap-scale", String(1 - visibleOffset * 0.045));
    card.style.setProperty("--swap-opacity", String(isHidden ? 0 : 1 - visibleOffset * 0.14));
    card.style.setProperty("--swap-rotate", `${visibleOffset * -2.2}deg`);
    card.style.setProperty("--swap-z", String(swapCards.length - offset));
    card.classList.toggle("is-swap-active", offset === 0);
    card.setAttribute("aria-hidden", isHidden ? "true" : "false");
  });

  if (swapCurrent) {
    swapCurrent.textContent = String(swapIndex + 1).padStart(2, "0");
  }

  if (swapBar) {
    swapBar.style.transform = `scaleX(${(swapIndex + 1) / swapCards.length})`;
  }
}

function setValidationSwap(index) {
  if (!swapCards.length) return;
  swapIndex = (index + swapCards.length) % swapCards.length;
  updateValidationSwap();
}

function stopValidationSwap() {
  if (!swapTimer) return;
  window.clearInterval(swapTimer);
  swapTimer = null;
}

function startValidationSwap() {
  stopValidationSwap();
  updateValidationSwap();

  if (!validationSwap || swapCards.length < 2 || prefersReducedMotion) return;

  swapTimer = window.setInterval(() => {
    setValidationSwap(swapIndex + 1);
  }, 5000);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || !document.querySelector(targetId)) return;

    event.preventDefault();
    navigateToSection(targetId, { replace: targetId === "#hero" });
  });
});

if (validationSwap) {
  validationSwap.addEventListener("mouseenter", stopValidationSwap);
  validationSwap.addEventListener("mouseleave", startValidationSwap);
}

swapCards.forEach((card, index) => {
  card.addEventListener("click", () => {
    setValidationSwap(index);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setValidationSwap(index);
    }
  });
});

swapPrevButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  setValidationSwap(swapIndex - 1);
});

swapNextButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  setValidationSwap(swapIndex + 1);
});

proofOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const card = button.closest("[data-swap-card]");
    if (card) openProofModal(card);
  });
});

startValidationSwap();

proofCards.forEach((card) => {
  card.addEventListener("click", () => openProofModal(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProofModal(card);
    }
  });
});

document.querySelectorAll("[data-project-visit]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

document.querySelectorAll("[data-proof-close]").forEach((control) => {
  control.addEventListener("click", closeProofModal);
});

proofModalCopy?.addEventListener("click", copyProofDetails);
proofModalContact?.addEventListener("click", closeProofModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProofModal();
  }
});

if (copyTemplateButton && consultTemplate) {
  const defaultCopyLabel = copyTemplateButton.textContent;
  copyTemplateButton.addEventListener("click", async () => {
    const text = consultTemplate.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      copyTemplateButton.textContent = "已复制，可以直接发我";
      copyTemplateButton.classList.add("copied");
      window.setTimeout(() => {
        copyTemplateButton.textContent = defaultCopyLabel;
        copyTemplateButton.classList.remove("copied");
      }, 1800);
    } catch (error) {
      copyTemplateButton.textContent = "复制失败，请手动复制";
      window.setTimeout(() => {
        copyTemplateButton.textContent = defaultCopyLabel;
      }, 1800);
    }
  });
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("resize", setupHorizontalWork);
window.addEventListener("scroll", handleScroll, { passive: true });
workViewport?.addEventListener("scroll", updateMobileWorkProgress, { passive: true });

if (heroFrame) {
  heroFrame.addEventListener("pointermove", queuePointerFrame);
  heroFrame.addEventListener("pointerleave", () => {
    pointer.active = false;
    resetParallax();
  });
}

prepareGlitchTitle();
initHeroVideoLoop();
initInteractionLab();
resizeCanvas();
setupHorizontalWork();
if (window.location.hash === "#hero") {
  window.scrollTo(0, 0);
}
updateActiveSection();
updateHeroScroll();
scheduleCanvas();

window.addEventListener("load", () => {
  if (!window.location.hash || window.location.hash === "#hero") {
    window.scrollTo(0, 0);
    updateActiveSection();
    updateHeroScroll();
    updateHorizontalWork();
  }
});
