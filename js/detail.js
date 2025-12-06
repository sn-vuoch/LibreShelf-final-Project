import { Books } from "./api.js";

// DOM Elements
const els = {
  cover: document.getElementById("book-cover"),
  title: document.getElementById("book-title"),
  author: document.getElementById("book-author"),
  desc: document.getElementById("book-description"),
  genres: document.getElementById("book-categories"),
  downloadBtn: document.getElementById("download-btn"),
  pdfViewer: document.getElementById("pdf-viewer"),
  pdfFallback: document.getElementById("pdf-fallback"),
  loading: document.getElementById("loading-state"),
  fallbackDownload: document.getElementById("fallback-download"),
  pdfContainer: document.getElementById("pdf-container"),
};

// --- INITIALIZE ---
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("id");

  if (!bookId) {
    alert("No book specified!");
    window.location.href = "../index.html";
    return;
  }

  try {
    const book = await Books.getById(bookId);
    renderBookDetails(book);
  } catch (error) {
    console.error("Detail Error:", error);
    els.title.innerText = "Book not found";
    els.desc.innerText = "The book you are looking for does not exist or has been removed.";
    els.loading.classList.add("hidden");
  }
});

// --- RENDER FUNCTION ---
function renderBookDetails(book) {
  const mockPages = Math.floor(Math.random() * (500 - 100 + 1) + 100);
  const pageCountEl = document.getElementById("page-count");
  if (pageCountEl) pageCountEl.innerText = `${mockPages} Pages`;

  // Basic Info
  els.title.innerText = book.title || "Untitled";
  els.author.innerText = book.author || "Unknown Author";
  els.desc.innerText = book.description || "No description available for this title.";

  // Images
  const coverUrl = book.thumbnail || "https://placehold.co/300x450/112d4e/FFF?text=No+Cover";
  els.cover.src = coverUrl;

  // Categories
  els.genres.innerHTML = "";
  const cats = Array.isArray(book.categories) ? book.categories : [];

  if (cats.length > 0) {
    cats.forEach((cat) => {
      const name = typeof cat === "object" ? cat.name : cat;
      const badge = document.createElement("span");
      badge.className = "px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white backdrop-blur-sm uppercase tracking-wide";
      badge.innerText = name;
      els.genres.appendChild(badge);
    });
  } else {
    els.genres.innerHTML = '<span class="text-sm text-gray-400 italic">General</span>';
  }

  // --- PDF LOGIC (Updated) ---
  if (book.file_url) {
    // 1. Force HTTPS
    const secureUrl = book.file_url.replace(/^http:\/\//i, 'https://');

    els.downloadBtn.href = secureUrl;
    els.fallbackDownload.href = secureUrl;

    // 2. Setup Google Viewer URL
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=true`;
    
    // 3. Setup PDF Loading State
    setupPdfLoader();
    els.pdfViewer.src = googleViewerUrl;

    // 4. Handle "No Preview" / Reload Logic
    injectReloadButton(googleViewerUrl);

    // 5. robust .pdf check (ignores query params like ?t=123)
    const cleanUrl = secureUrl.split('?')[0].toLowerCase();
    if (!cleanUrl.endsWith(".pdf")) {
      els.pdfViewer.classList.add("hidden");
      els.pdfFallback.classList.remove("hidden");
      // Hide loader if falling back
      const loader = document.getElementById("pdf-frame-loader");
      if(loader) loader.classList.add("hidden");
    }
  } else {
    els.downloadBtn.classList.add("opacity-50", "cursor-not-allowed");
    els.downloadBtn.innerText = "Unavailable";
    els.pdfViewer.classList.add("hidden");
    els.pdfFallback.classList.remove("hidden");
  }

  els.loading.classList.add("hidden");
  addToHistory(book);
}

// --- HELPER: PDF LOADER ---
function setupPdfLoader() {
  if (!els.pdfContainer) return;

  // Create loader if it doesn't exist
  let loader = document.getElementById("pdf-frame-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "pdf-frame-loader";
    loader.className = "absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 rounded-2xl";
    loader.innerHTML = `
      <i class="ph-bold ph-spinner animate-spin text-3xl text-secondary"></i>
      <p class="mt-2 text-sm text-gray-500 font-medium">Loading Book Preview...</p>
    `;
    // Ensure container is relative so loader sits on top
    els.pdfContainer.classList.add("relative");
    els.pdfContainer.insertBefore(loader, els.pdfViewer);
  }

  // Show loader initially
  loader.classList.remove("hidden");

  // Hide loader when iframe loads
  els.pdfViewer.onload = () => {
    loader.classList.add("hidden");
  };
}

// --- HELPER: RELOAD BUTTON ---
function injectReloadButton(url) {
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  if (!fullscreenBtn || document.getElementById("reload-pdf-btn")) return;

  // Create Reload Button
  const reloadBtn = document.createElement("button");
  reloadBtn.id = "reload-pdf-btn";
  reloadBtn.className = "p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300 mr-1";
  reloadBtn.title = "Reload Preview";
  reloadBtn.innerHTML = '<i class="ph-bold ph-arrows-clockwise text-xl"></i>';
  
  // Reload Logic
  reloadBtn.onclick = () => {
    // Show loader again
    const loader = document.getElementById("pdf-frame-loader");
    if(loader) loader.classList.remove("hidden");
    
    // Reset src to trigger reload
    els.pdfViewer.src = 'about:blank';
    setTimeout(() => {
        els.pdfViewer.src = url;
    }, 100);
  };

  // Insert before the fullscreen button
  fullscreenBtn.parentNode.insertBefore(reloadBtn, fullscreenBtn);
}

// --- FAVORITE LOGIC ---
const favBtn = document.getElementById("favorite-btn");
const bookId = new URLSearchParams(window.location.search).get("id");
let isFavorite = false;

async function checkFavoriteStatus() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const bookmarks = await Books.getBookmarks();
    isFavorite = bookmarks.some((bookmark) => bookmark.book_id == bookId);
    updateFavoriteUI(isFavorite);
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
  }
}

function updateFavoriteUI(active) {
  if (active) {
    favBtn.classList.add("bg-red-500", "border-red-500", "text-white");
    favBtn.classList.remove("border-white/30");
    favBtn.innerHTML = `<i class="ph-fill ph-heart text-xl"></i> <span>Saved</span>`;
  } else {
    favBtn.classList.remove("bg-red-500", "border-red-500");
    favBtn.classList.add("border-white/30", "text-white");
    favBtn.innerHTML = `<i class="ph-bold ph-heart text-xl"></i> <span>Favorite</span>`;
  }
}

favBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Please sign in to save favorites.");
    window.location.href = "../pages/signin.html";
    return;
  }

  isFavorite = !isFavorite;
  updateFavoriteUI(isFavorite);

  try {
    if (isFavorite) {
      await Books.addBookmark(bookId);
    } else {
      await Books.removeBookmark(bookId);
    }
  } catch (error) {
    isFavorite = !isFavorite;
    updateFavoriteUI(isFavorite);
    alert("Failed to update favorite. " + error.message);
  }
});

checkFavoriteStatus();

// --- FULLSCREEN LOGIC ---
const fullscreenBtn = document.getElementById("fullscreen-btn");
const pdfContainer = document.getElementById("pdf-container");

if (fullscreenBtn && pdfContainer) {
  fullscreenBtn.addEventListener("click", () => {
    // 1. iPhone/iOS Check
    if (!pdfContainer.requestFullscreen) {
        window.open(els.downloadBtn.href, '_blank');
        return;
    }

    // 2. Android/Desktop Logic
    if (!document.fullscreenElement) {
      pdfContainer.requestFullscreen().catch((err) => {
        console.warn("Fullscreen blocked, opening in new tab", err);
        window.open(els.downloadBtn.href, '_blank');
      });
      fullscreenBtn.innerHTML = '<i class="ph-bold ph-corners-in text-xl"></i>';
    } else {
      document.exitFullscreen();
      fullscreenBtn.innerHTML = '<i class="ph-bold ph-corners-out text-xl"></i>';
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      fullscreenBtn.innerHTML = '<i class="ph-bold ph-corners-out text-xl"></i>';
    }
  });
}

// --- HISTORY LOGIC ---
function addToHistory(book) {
  let history = JSON.parse(localStorage.getItem("read_history") || "[]");
  history = history.filter((item) => item.id != book.id);

  const historyItem = {
    id: book.id,
    title: book.title,
    author: book.author || "Unknown",
    thumbnail: book.thumbnail || "https://placehold.co/100",
    category: Array.isArray(book.categories) && book.categories[0] ? book.categories[0].name : "General",
    date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
    timestamp: Date.now(),
  };

  history.unshift(historyItem);
  if (history.length > 20) history.pop();
  localStorage.setItem("read_history", JSON.stringify(history));
}