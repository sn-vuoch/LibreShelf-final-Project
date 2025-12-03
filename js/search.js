import { Books } from "./api.js";

const input = document.getElementById("hero-search-input");
const btn = document.getElementById("hero-search-btn");
const dropdown = document.getElementById("hero-search-dropdown");

let debounceTimer;

// --- 1. Event Listeners ---
if (input) {
  // Live Typing
  input.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer); // Clear previous timer

    if (query.length < 1) {
      dropdown.classList.add("hidden");
      return;
    }

    // Wait 400ms after user stops typing before fetching (Debounce)
    debounceTimer = setTimeout(() => fetchSuggestions(query), 400);
  });

  // Close dropdown if clicking outside
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });

  // Redirect on "Enter" key
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSearchRedirect();
    }
  });
}

if (btn) {
  btn.addEventListener("click", handleSearchRedirect);
}

function handleSearchRedirect() {
  const query = input.value.trim();
  if (query) {
    // Redirect to categories page with search param
    window.location.href = `./pages/categories.html?search=${encodeURIComponent(
      query
    )}`;
  }
}

// --- 2. Fetch Logic ---
async function fetchSuggestions(query) {
  try {
    // Show "Loading..." state (Optional polish)
    dropdown.innerHTML = `<div class="p-4 text-gray-400 text-sm text-center">Searching...</div>`;
    dropdown.classList.remove("hidden");

    const res = await Books.getAll({ search: query, limit: 5 });
    const books = res.books || res.data || [];
    renderDropdown(books);
  } catch (err) {
    console.error(err);
    dropdown.classList.add("hidden");
  }
}

// --- 3. Render Logic ---
function renderDropdown(books) {
  if (books.length === 0) {
    dropdown.innerHTML = `<div class="p-4 text-gray-500 text-center text-sm">No results found.</div>`;
    return;
  }

  // Generate HTML for books
  const itemsHTML = books
    .map(
      (book) => `
        <a href="./pages/detail.html?id=${
          book.id
        }" class="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition border-b border-gray-100 dark:border-slate-700 last:border-0 group">
            <img src="${
              book.thumbnail || "https://placehold.co/50"
            }" class="w-10 h-14 object-cover rounded shadow-sm group-hover:scale-105 transition-transform">
            <div>
                <h4 class="font-bold text-sm text-primary dark:text-white line-clamp-1">${
                  book.title
                }</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">${
                  book.author || "Unknown"
                }</p>
            </div>
        </a>
    `
    )
    .join("");

  // Add "View all results" link at the bottom
  const footerHTML = `
        <button onclick="window.location.href='./pages/categories.html?search=${encodeURIComponent(
          input.value
        )}'" class="w-full block p-3 text-center text-xs font-bold text-secondary bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-primary dark:text-white">
            View all results for "${input.value}"
        </button>
    `;

  dropdown.innerHTML = itemsHTML + footerHTML;
}
