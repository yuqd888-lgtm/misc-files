const canvas = document.getElementById("heroCanvas");
const isEdge = /\bEdg\//.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useCanvas = false;
const ctx = canvas && useCanvas ? canvas.getContext("2d", { alpha: true }) : null;
const sectionLinks = Array.from(document.querySelectorAll(".scroll-index a"));
const sections = Array.from(document.querySelectorAll("section[id]"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const heroFrame = document.querySelector("[data-parallax-root]");
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
let glitchChars = [];
let activeProofCard = null;
let pointerFrame = null;
let scrollFrame = null;
let scrollResumeTimer = null;
let canvasFrame = null;
let canvasVisible = true;
let scrolling = false;
let lastCanvasTime = 0;
let lastActiveUpdate = 0;

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
    const image = document.createElement("img");
    image.src = src;
    image.alt = index === 0 ? cardImage?.getAttribute("alt") || title : `${title} image ${index + 1}`;
    return image;
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

proofCards.forEach((card) => {
  card.addEventListener("click", () => openProofModal(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProofModal(card);
    }
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
window.addEventListener("scroll", handleScroll, { passive: true });

if (heroFrame) {
  heroFrame.addEventListener("pointermove", queuePointerFrame);
  heroFrame.addEventListener("pointerleave", () => {
    pointer.active = false;
    resetParallax();
  });
}

prepareGlitchTitle();
resizeCanvas();
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
  }
});
