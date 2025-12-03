import { Books } from "./api.js";
import { initSeamlessMarquee } from "./marquee.js"; // Import your marquee logic

// DOM Elements
const els = {
  newReleaseTrack: document.getElementById("new-release-track"),
  trendingGrid: document.getElementById("trending-grid"), // Renamed from popular for clarity? No, stick to your layout
  popularGrid: document.getElementById("popular-books-grid"),
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Fetch "New Releases" (Page 1 - Latest 10)
    const newReleaseData = await Books.getAll({ page: 1, limit: 10 });
    const newBooks = newReleaseData.books || newReleaseData.data || [];
    renderNewReleases(newBooks);

    // 2. Fetch "Popular/Trending" (Page 2 - Next 8)
    // We simulate "Popular" by just getting a different set of books
    const popularData = await Books.getAll({ page: 2, limit: 8 });
    const popularBooks = popularData.books || popularData.data || [];
    renderPopularBooks(popularBooks);
  } catch (error) {
    console.error("Home Data Error:", error);
  }
});

// --- RENDERERS ---

/**
 * Renders the Infinite Marquee (New Releases)
 */
function renderNewReleases(books) {
  if (!els.newReleaseTrack) return;

  // Clear static placeholders
  els.newReleaseTrack.innerHTML = "";

  if (books.length === 0) {
    els.newReleaseTrack.innerHTML =
      '<p class="text-gray-400 p-4">No new releases.</p>';
    return;
  }

  // Generate Cards
  const cardsHTML = books
    .map(
      (book) => `
        <a href="./pages/detail.html?id=${
          book.id
        }" class="relative w-[140px] md:w-[160px] aspect-[2/3] flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-101 hover:z-10 hover:shadow-xl rounded-lg overflow-hidden block">
            <img src="${book.thumbnail || "https://placehold.co/200x300"}" 
                 onerror="this.src='https://placehold.co/160x240/112d4e/FFF?text=No+Cover'" 
                 class="w-full h-full object-cover">
            <!-- Optional: Hover Overlay -->
            <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="text-white font-bold text-xs px-2 text-center">${
                  book.title
                }</span>
            </div>
        </a>
    `
    )
    .join("");

  els.newReleaseTrack.innerHTML = cardsHTML;

  // Start Animation Logic (from marquee.js)
  // We delay slightly to ensure DOM is ready
  setTimeout(() => {
    if (window.initSeamlessMarquee) {
      window.initSeamlessMarquee("new-release-track");
    }
  }, 100);
}

/**
 * Renders the Grid (Popular Books)
 */
function renderPopularBooks(books) {
  if (!els.popularGrid) return;
  els.popularGrid.innerHTML = "";

  if (books.length === 0) {
    els.popularGrid.innerHTML =
      '<p class="col-span-full text-center">No popular books found.</p>';
    return;
  }

  els.popularGrid.innerHTML = books
    .map(
      (book) => `
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 flex flex-col h-full group overflow-hidden">
            
            <!-- Link Image to Detail -->
            <a href="./pages/detail.html?id=${
              book.id
            }" class="relative aspect-[3/4] w-full bg-gray-100 dark:bg-slate-700 overflow-hidden block">
                <img src="${book.thumbnail || "https://placehold.co/300x400"}" 
                     alt="${book.title}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                     loading="lazy">
            </a>

            <div class="p-4 flex flex-col flex-grow">
                <div class="mb-3">
                    <a href="./pages/detail.html?id=${
                      book.id
                    }" class="hover:text-accent transition-colors">
                        <h3 class="text-lg font-bold text-primary dark:text-white line-clamp-1" title="${
                          book.title
                        }">
                            ${book.title}
                        </h3>
                    </a>
                    <p class="text-sm text-dark-gray dark:text-gray-400 line-clamp-1">${
                      book.author || "Unknown"
                    }</p>
                </div>

                <div class="mt-auto flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-700">
                    <div class="flex items-center gap-3">
                        <!-- Add Bookmark -->
                        <button onclick="toggleHomeFavorite(${
                          book.id
                        }, this))" class="text-dark-gray dark:text-gray-400 hover:text-red-500 transition-colors" title="Add to Favorites">
                            <i class="ph-bold ph-heart text-xl"></i>
                        </button>
                        <!-- Download (Direct Link) -->
                        <a href="${
                          book.file_url || "#"
                        }" target="_blank" class="text-dark-gray dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors">
                            <i class="ph-bold ph-download-simple text-xl"></i>
                        </a>
                    </div>

                    <a href="./pages/detail.html?id=${
                      book.id
                    }" class="text-xs font-bold text-secondary dark:text-accent dark:hover:text-yellow-500 hover:text-primary uppercase tracking-wider transition-colors">
                        Read Now
                    </a>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// --- FAVORITE LOGIC ---

// 1. Helper to sync UI on load
async function highlightUserFavorites() {
  const token = localStorage.getItem("access_token");
  if (!token) return;

  try {
    const bookmarks = await Books.getBookmarks();
    // Get all heart icons on the page
    // Note: This requires your heart buttons to have a specific ID or class logic.
    // A better way is to check the ID passed to the onclick handler.

    // We will store IDs in a Set for fast lookup
    const favIds = new Set(bookmarks.map((b) => b.book_id));

    // Find all buttons that call toggleHomeFavorite
    const buttons = document.querySelectorAll(
      'button[onclick^="toggleHomeFavorite"]'
    );

    buttons.forEach((btn) => {
      // Extract ID from the onclick attribute string: toggleHomeFavorite(12)
      const onClickText = btn.getAttribute("onclick");
      const idMatch = onClickText.match(/\d+/); // Find the number
      if (idMatch && favIds.has(parseInt(idMatch[0]))) {
        const icon = btn.querySelector("i");
        icon.classList.remove(
          "ph-bold",
          "text-dark-gray",
          "dark:text-gray-400"
        );
        icon.classList.add("ph-fill", "text-red-500");
      }
    });
  } catch (err) {
    console.error("Error syncing home favorites", err);
  }
}

// 2. The Toggle Function (Global)
window.toggleHomeFavorite = async (id, btnElement) => {
  // Note: To change the icon instantly, we need the button element.
  // Update your HTML generation in renderNewReleases/renderPopularBooks
  // to pass 'this': onclick="toggleHomeFavorite(${book.id}, this)"

  // Fallback if 'this' wasn't passed (try to find event target)
  const btn = btnElement || event.currentTarget;
  const icon = btn.querySelector("i");

  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Please login to save favorites.");
    return;
  }

  // Toggle UI State
  const isFav = icon.classList.contains("ph-fill");

  if (isFav) {
    // Remove
    icon.classList.remove("ph-fill", "text-red-500");
    icon.classList.add("ph-bold", "text-dark-gray");
    try {
      await Books.removeBookmark(id);
    } catch (e) {
      console.error(e);
      // Revert on error
      icon.classList.add("ph-fill", "text-red-500");
      icon.classList.remove("ph-bold", "text-dark-gray");
    }
  } else {
    // Add
    icon.classList.remove("ph-bold", "text-dark-gray");
    icon.classList.add("ph-fill", "text-red-500");
    try {
      await Books.addBookmark(id);
    } catch (e) {
      console.error(e);
      // Revert on error
      icon.classList.add("ph-bold", "text-dark-gray");
      icon.classList.remove("ph-fill", "text-red-500");
    }
  }
};

// 3. Call highlighting after rendering is done
document.addEventListener("DOMContentLoaded", async () => {
  // ... (Your existing render calls) ...

  // Add this at the end of the try block:
  await highlightUserFavorites();
});
