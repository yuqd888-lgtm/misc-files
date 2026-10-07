const isEdge = /\bEdg\//.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const siteHeader = document.querySelector(".site-header");
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
const interactionModal = document.querySelector("[data-interaction-modal]");
const modalDotFieldMount = document.querySelector("[data-interaction-modal-dot]");
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
let activeProofCard = null;
let swapIndex = 0;
let dotFieldInstances = [];

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
    dotSpacing: 20,
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
  let visible = false;
  let frame = null;
  const modal = mount.closest("[data-interaction-modal]");

  const canRender = () => visible && !document.hidden &&
    (!modal || !modal.hidden) &&
    (modal || !interactionModal || interactionModal.hidden);

  const refresh = () => {
    if (!canRender()) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    } else if (frame === null) {
      frame = requestAnimationFrame(render);
    }
  };

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
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    dotCanvas.width = Math.round(width * dpr);
    dotCanvas.height = Math.round(height * dpr);
    dotCanvas.style.width = `${width}px`;
    dotCanvas.style.height = `${height}px`;
    dotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createPoints();
    refresh();
  };

  const render = () => {
    frame = null;
    if (!canRender()) return;
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

    if (!prefersReducedMotion && mouse.active &&
        (Math.abs(smoothMouse.x - mouse.x) > 0.001 || Math.abs(smoothMouse.y - mouse.y) > 0.001)) {
      refresh();
    }
  };

  wrapper.addEventListener("pointermove", (event) => {
    const rect = wrapper.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / rect.width;
    mouse.y = (event.clientY - rect.top) / rect.height;
    mouse.active = true;
    wrapper.style.setProperty("--cursor-x", `${mouse.x * 100}%`);
    wrapper.style.setProperty("--cursor-y", `${mouse.y * 100}%`);
    refresh();
  });

  wrapper.addEventListener("pointerleave", () => {
    mouse.active = false;
    refresh();
  });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    refresh();
  }, { threshold: 0.01 });

  observer.observe(wrapper);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("resize", resize);
  resize();

  return { resize, refresh, wrapper };
}

function openInteractionModal() {
  if (!interactionModal) return;
  interactionModal.hidden = false;
  document.body.classList.add("interaction-modal-open", "modal-open");
  if (!dotFieldInstances.length && modalDotFieldMount) {
    dotFieldInstances = [initDotField(modalDotFieldMount)].filter(Boolean);
  }
  dotFieldInstances.forEach((instance) => instance.refresh());
  requestAnimationFrame(() => {
    dotFieldInstances.forEach((instance) => instance.resize());
  });
}

function closeInteractionModal() {
  if (!interactionModal) return;
  interactionModal.hidden = true;
  document.body.classList.remove("interaction-modal-open", "modal-open");
  dotFieldInstances.forEach((instance) => instance.refresh());
}

function initInteractionLab() {
  interactionOpenButtons.forEach((button) => {
    button.addEventListener("click", openInteractionModal);
  });

  interactionCloseControls.forEach((control) => {
    control.addEventListener("click", closeInteractionModal);
  });

  interactionContact?.addEventListener("click", closeInteractionModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && interactionModal && !interactionModal.hidden) {
      closeInteractionModal();
    }
  });
}

document.documentElement.classList.toggle("is-edge", isEdge);

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
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

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || !document.querySelector(targetId)) return;

    event.preventDefault();
    navigateToSection(targetId, { replace: targetId === "#hero" });
  });
});

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

initInteractionLab();
if (window.location.hash === "#hero") {
  window.scrollTo(0, 0);
}

window.addEventListener("load", () => {
  if (!window.location.hash || window.location.hash === "#hero") {
    window.scrollTo(0, 0);
  }
});
