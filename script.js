const galleryGrid = document.querySelector("#gallery-grid");
const categoryFilters = document.querySelector("#category-filters");
const modal = document.querySelector("#work-modal");
const modalCloseButton = document.querySelector("#modal-close");
const modalImage = document.querySelector("#modal-image");
const modalDate = document.querySelector("#modal-date");
const modalTitle = document.querySelector("#modal-title");
const modalCategory = document.querySelector("#modal-category");
const modalSummary = document.querySelector("#modal-summary");
const categoryOrder = ["植物", "家居", "建筑", "人物", "食物", "动物", "UI", "其他"];

let worksStore = [];
let activeCategory = "全部";
let lastFocusedCard = null;

function setCardOffsets(card, event) {
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  const frame = card.querySelector(".art-frame");

  if (!frame) return;

  const offsetX = Math.round(x * 3);
  const offsetY = Math.round(y * 3);
  frame.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

function resetCardOffsets(card) {
  const frame = card.querySelector(".art-frame");
  if (frame) {
    frame.style.transform = "";
  }
}

function attachCardInteractions(card) {
  card.addEventListener("pointermove", (event) => {
    setCardOffsets(card, event);
  });

  card.addEventListener("pointerleave", () => {
    resetCardOffsets(card);
  });

  card.addEventListener("click", () => {
    const id = card.dataset.id;
    const work = worksStore.find((entry) => entry.id === id);
    if (!work) return;

    lastFocusedCard = card;
    openModal(work);
  });
}

function createCardMarkup(work) {
  return `
    <button class="gallery-card" type="button" data-id="${work.id}">
      <span class="gallery-meta">${work.date}</span>
      <figure class="art-frame">
        <img src="${work.src}" alt="${work.title}" loading="lazy" />
      </figure>
      <div class="gallery-title-row">
        <h2>${work.title}</h2>
        <span class="arrow" aria-hidden="true">›</span>
      </div>
    </button>
  `;
}

function renderEmptyState() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = `
    <div class="gallery-empty" role="status">
      <p>暂时还没有作品。</p>
      <p>将图片放入 assets/works 后运行 npm run generate:works。</p>
    </div>
  `;
}

function getFilteredWorks() {
  if (activeCategory === "全部") {
    return worksStore;
  }

  return worksStore.filter((work) => work.category === activeCategory);
}

function renderFilters() {
  if (!categoryFilters) return;

  const categories = ["全部", ...categoryOrder];
  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          class="filter-chip${category === activeCategory ? " is-active" : ""}"
          type="button"
          data-category="${category}"
        >
          ${category}
        </button>
      `
    )
    .join("");

  categoryFilters.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.category || "全部";
      renderFilters();
      renderWorks();
    });
  });
}

function renderWorks() {
  if (!galleryGrid) return;

  const works = getFilteredWorks();
  if (!works.length) {
    renderEmptyState();
    return;
  }

  galleryGrid.innerHTML = works.map(createCardMarkup).join("");
  galleryGrid.querySelectorAll(".gallery-card").forEach(attachCardInteractions);
}

function openModal(work) {
  if (!modal || !modalImage || !modalDate || !modalTitle || !modalCategory || !modalSummary) {
    return;
  }

  modalImage.src = work.src;
  modalImage.alt = work.title;
  modalDate.textContent = work.date;
  modalTitle.textContent = work.title;
  modalCategory.textContent = work.category;
  modalSummary.textContent = work.summary;

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalCloseButton?.focus();
}

function closeModal() {
  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedCard instanceof HTMLElement) {
    lastFocusedCard.focus();
  }
}

function attachModalInteractions() {
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeModal === "true") {
      closeModal();
    }
  });

  modalCloseButton?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeModal();
    }
  });
}

async function loadWorks() {
  try {
    const response = await fetch("works.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load works.json: ${response.status}`);
    }

    const works = await response.json();
    worksStore = Array.isArray(works) ? works : [];
    renderFilters();
    renderWorks();
  } catch (error) {
    console.error(error);
    renderEmptyState();
  }
}

attachModalInteractions();
loadWorks();
