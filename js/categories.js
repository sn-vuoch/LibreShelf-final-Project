import { Books, Utils } from "./api.js";

// State
let state = {
  page: 1,
  limit: 12,
  search: "",
  categoryId: null,
  isLoading: false,
  hasMore: true,
};

// Elements
const grid = document.getElementById("books-grid");
const categoryList = document.getElementById("category-list");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const loadingIndicator = document.getElementById("loading-indicator");
const emptyState = document.getElementById("empty-state");
const sentinel = document.getElementById("scroll-sentinel");
const bookCount = document.getElementById("book-count");
const clearFilterBtn = document.getElementById("clear-filters");

// --- 1. INITIALIZE ---
async function init() {
  await loadCategories();
  loadBooks(true); // Initial load
  setupEvents();
  setupInfiniteScroll();
}

// --- 2. LOAD CATEGORIES (Sidebar) ---
async function loadCategories() {
  try {
    const categories = await Utils.getCategories();

    if (categories && categories.length > 0) {
      categoryList.innerHTML = categories
        .map(
          (cat) => `
                <label class="flex items-center gap-3 cursor-pointer group py-1">
                    <input type="radio" name="category" value="${cat.id}" class="w-4 h-4 text-accent focus:ring-accent border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-slate-700">
                    <span class="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-white transition capitalize">
                        ${cat.name}
                    </span>
                </label>
            `
        )
        .join("");
    } else {
      categoryList.innerHTML =
        '<p class="text-sm text-gray-400">No categories found.</p>';
    }
  } catch (error) {
    console.error("Cat Load Error:", error);
    categoryList.innerHTML =
      '<p class="text-sm text-red-400">Error loading categories.</p>';
  }
}

// --- 3. LOAD BOOKS (Main Logic) ---
async function loadBooks(reset = false) {
  if (state.isLoading) return;
  if (reset) {
    state.page = 1;
    state.hasMore = true;
    grid.innerHTML = "";
    emptyState.classList.add("hidden");
  }
  if (!state.hasMore) return;

  state.isLoading = true;
  loadingIndicator.classList.remove("hidden");

  try {
    // API Call using your helper
    const response = await Books.getAll({
      page: state.page,
      limit: state.limit,
      search: state.search,
      category_id: state.categoryId,
    });

    // Normalize response (some APIs return {data: []} vs [])
    const books =
      response.books || (Array.isArray(response) ? response : []) || [];
    const total = response.total || books.length; // Fallback if total missing

    // Update Count
    if (reset) bookCount.textContent = total;

    // Check if empty
    if (books.length === 0 && reset) {
      emptyState.classList.remove("hidden");
      state.hasMore = false;
    } else if (books.length < state.limit) {
      state.hasMore = false; // End of list
    }

    // Render Cards
    books.forEach((book) => {
      grid.innerHTML += createCardHTML(book);
    });

    state.page++;
  } catch (error) {
    console.error("Book Fetch Error:", error);
    if (reset)
      grid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load books.</p>`;
  } finally {
    state.isLoading = false;
    loadingIndicator.classList.add("hidden");
  }
}

// --- 4. HTML CARD GENERATOR ---
function createCardHTML(book) {
  const title = book.title || "Untitled";
  const desc = book.description || "No description.";
  const image =
    book.thumbnail || "https://placehold.co/300x400/112d4e/FFF?text=No+Cover";
  const id = book.id;
  const fileUrl = book.file_url || "#";
  const target = book.file_url ? "_blank" : "_self";

  return `
        <div class="group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full animate-fade-in">
            <!-- Cover -->
             <a href="detail.html?id=${id}" class="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-slate-700 cursor-pointer">
                <img src="${image}" alt="${title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='https://placehold.co/300x400/112d4e/FFF?text=Error'">
            </a>
            
            <!-- Body -->
            <div class="p-4 flex flex-col flex-1">
                <!-- 2. Title Link -> Goes to Detail Page -->
                <a href="detail.html?id=${id}" class="block group-hover:text-accent transition-colors">
                    <h3 class="font-bold text-primary dark:text-white text-lg line-clamp-1 mb-1" title="${title}">
                        ${title}
                    </h3>
                </a>
                
                <p class="text-xs text-primary dark:text-white line-clamp-2 mb-3 h-8">
                    ${desc}
                </p>

                <hr class="border-gray-200 dark:border-slate-700 my-2">

                <!-- Icons Row -->
                <div class="flex items-center justify-between mt-auto pt-1">
                    <div class="flex gap-3">
                        <button class="text-gray-400 hover:text-red-500 transition-colors" title="Favorite">
                            <i class="ph-bold ph-heart text-xl"></i>
                        </button>
                        <button class="text-gray-400 hover:text-blue-500 transition-colors" title="Share">
                            <i class="ph-bold ph-share-network text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- 3. Download Link -> Goes to actual file (NOT detail page) -->
                    <a href="${fileUrl}" target="${target}" class="text-primary dark:text-accent hover:text-secondary transition-colors" title="Download PDF">
                        <i class="ph-bold ph-download-simple text-xl"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}

// --- 5. EVENT LISTENERS ---
function setupEvents() {
  // Search Debounce
  let timeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      state.search = e.target.value.trim();
      loadBooks(true);
    }, 600);
  });

  searchBtn.addEventListener("click", () => {
    state.search = searchInput.value.trim();
    loadBooks(true);
  });

  // Filter Change
  categoryList.addEventListener("change", (e) => {
    if (e.target.type === "radio") {
      state.categoryId = e.target.value;
      loadBooks(true);
      clearFilterBtn.classList.remove("hidden");
    }
  });

  // Clear Filter
  clearFilterBtn.addEventListener("click", () => {
    const radios = categoryList.querySelectorAll('input[type="radio"]');
    radios.forEach((r) => (r.checked = false));
    state.categoryId = null;
    loadBooks(true);
    clearFilterBtn.classList.add("hidden");
  });
}

// --- 6. INFINITE SCROLL ---
function setupInfiniteScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !state.isLoading && state.hasMore) {
        loadBooks(false); // Load next page
      }
    },
    { rootMargin: "200px" }
  );

  if (sentinel) observer.observe(sentinel);
}

// Run
init();
