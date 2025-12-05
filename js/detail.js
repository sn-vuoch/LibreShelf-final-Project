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
};

// --- INITIALIZE ---
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Get ID from URL Query Params
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("id");

  if (!bookId) {
    alert("No book specified!");
    window.location.href = "../index.html";
    return;
  }

  try {
    // 2. Fetch Book Data
    const book = await Books.getById(bookId);

    // 3. Render Data
    renderBookDetails(book);
  } catch (error) {
    console.error("Detail Error:", error);
    els.title.innerText = "Book not found";
    els.desc.innerText =
      "The book you are looking for does not exist or has been removed.";
    els.loading.classList.add("hidden");
  }
});

// --- RENDER FUNCTION ---
function renderBookDetails(book) {
  // 1. Mock Page Count (Random number between 100-500 for demo)
  // If API had a 'pages' field, we would use: book.pages || 'N/A'
  const mockPages = Math.floor(Math.random() * (500 - 100 + 1) + 100);
  const pageCountEl = document.getElementById("page-count");
  if (pageCountEl) pageCountEl.innerText = `${mockPages} Pages`;

  // Basic Info
  els.title.innerText = book.title || "Untitled";
  els.author.innerText = book.author || "Unknown Author";
  els.desc.innerText =
    book.description || "No description available for this title.";

  // Images
  const coverUrl =
    book.thumbnail || "https://placehold.co/300x450/112d4e/FFF?text=No+Cover";
  els.cover.src = coverUrl;

  // Categories/Genres (Check if array or string)
  els.genres.innerHTML = "";
  const cats = Array.isArray(book.categories) ? book.categories : [];

  if (cats.length > 0) {
    cats.forEach((cat) => {
      // Check if cat is object {id, name} or string
      const name = typeof cat === "object" ? cat.name : cat;
      const badge = document.createElement("span");
      badge.className =
        "px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white backdrop-blur-sm uppercase tracking-wide";
      badge.innerText = name;
      els.genres.appendChild(badge);
    });
  } else {
    els.genres.innerHTML =
      '<span class="text-sm text-gray-400 italic">General</span>';
  }

  // PDF / Download Logic
  if (book.file_url) {
    const secureUrl = book.file_url.replace(/^http:\/\//i, 'https://');

    // Set Download Link
    els.downloadBtn.href = secureUrl;
    els.fallbackDownload.href = secureUrl;

    els.pdfViewer.src = secureUrl;

    // Simple check: If file_url is not a PDF, hide viewer
    if (!secureUrl.toLowerCase().endsWith(".pdf")) {
      els.pdfViewer.classList.add("hidden");
      els.pdfFallback.classList.remove("hidden");
    }
  } else {
    els.downloadBtn.classList.add("opacity-50", "cursor-not-allowed");
    els.downloadBtn.innerText = "Unavailable";
    els.pdfViewer.classList.add("hidden");
    els.pdfFallback.classList.remove("hidden");
  }

  // Hide Loading Overlay
  els.loading.classList.add("hidden");

  addToHistory(book);
}

// --- FAVORITE LOGIC ---
const favBtn = document.getElementById("favorite-btn");
const bookId = new URLSearchParams(window.location.search).get("id");
let isFavorite = false;

// 1. Check status from API on load
async function checkFavoriteStatus() {
  try {
    // Check if user is logged in first
    const token = localStorage.getItem("access_token");
    if (!token) return; // Leave as default (gray) if not logged in

    // Fetch user's bookmarks from Server
    const bookmarks = await Books.getBookmarks();

    // Check if current book is in the list
    isFavorite = bookmarks.some((bookmark) => bookmark.book_id == bookId);

    updateFavoriteUI(isFavorite);
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
  }
}

// 2. Update Button Style
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

// 3. Toggle Handler
favBtn.addEventListener("click", async () => {
  // 1. Auth Check
  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Please sign in to save favorites.");
    window.location.href = "../pages/signin.html";
    return;
  }

  // 2. Optimistic UI Update (Change color immediately)
  isFavorite = !isFavorite;
  updateFavoriteUI(isFavorite);

  try {
    if (isFavorite) {
      await Books.addBookmark(bookId);
    } else {
      await Books.removeBookmark(bookId);
    }
  } catch (error) {
    // Revert if API fails
    isFavorite = !isFavorite;
    updateFavoriteUI(isFavorite);
    alert("Failed to update favorite. " + error.message);
  }
});

// Call on load
checkFavoriteStatus();

// --- FULLSCREEN LOGIC ---
const fullscreenBtn = document.getElementById("fullscreen-btn");
const pdfContainer = document.getElementById("pdf-container");

if (fullscreenBtn && pdfContainer) {
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      // Enter Fullscreen
      pdfContainer.requestFullscreen().catch((err) => {
        alert(`Error attempting to enable fullscreen: ${err.message}`);
      });
      fullscreenBtn.innerHTML = '<i class="ph-bold ph-corners-in text-xl"></i>'; // Change icon to "Exit"
    } else {
      // Exit Fullscreen
      document.exitFullscreen();
      fullscreenBtn.innerHTML =
        '<i class="ph-bold ph-corners-out text-xl"></i>'; // Change icon to "Enter"
    }
  });

  // Listen for Escape key or manual exit to reset icon
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      fullscreenBtn.innerHTML =
        '<i class="ph-bold ph-corners-out text-xl"></i>';
    }
  });
}

// --- HISTORY LOGIC ---
function addToHistory(book) {
  // 1. Get existing history or empty array
  let history = JSON.parse(localStorage.getItem("read_history") || "[]");

  // 2. Remove if duplicate (so we can move it to the top)
  history = history.filter((item) => item.id != book.id);

  // 3. Create simple history object
  const historyItem = {
    id: book.id,
    title: book.title,
    author: book.author || "Unknown",
    thumbnail: book.thumbnail || "https://placehold.co/100",
    category:
      Array.isArray(book.categories) && book.categories[0]
        ? book.categories[0].name
        : "General",
    date: new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    timestamp: Date.now(), // Useful if you want to sort by time later
  };

  // 4. Add to the beginning of the array
  history.unshift(historyItem);

  // 5. Limit to last 20 items to keep storage clean
  if (history.length > 20) history.pop();

  // 6. Save back to storage
  localStorage.setItem("read_history", JSON.stringify(history));
}
