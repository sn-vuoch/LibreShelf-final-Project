document.addEventListener("DOMContentLoaded", () => {
  renderHistory();

  // Setup Clear All Button
  // We look for the button containing "Clear All" text
  const buttons = document.querySelectorAll("button");
  const clearBtn = Array.from(buttons).find((b) =>
    b.innerText.includes("Clear All")
  );

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear all reading history?")) {
        localStorage.removeItem("read_history");
        renderHistory();
      }
    });
  }
});

function renderHistory() {
  // Use the specific container class from your HTML
  const container = document.querySelector(".space-y-5");
  if (!container) return;

  const history = JSON.parse(localStorage.getItem("read_history") || "[]");

  // Empty State
  if (history.length === 0) {
    container.innerHTML = `
        <div class="text-center py-12 flex flex-col items-center">
            <i class="ph-duotone ph-clock-counter-clockwise text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">No reading history yet.</p>
            <a href="../index.html" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition">Start Reading</a>
        </div>
    `;
    return;
  }

  // Clear existing static HTML
  container.innerHTML = `<section><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 dark:text-pure-white">Recent</h2><div id="history-list"></div></section>`;

  const listContainer = document.getElementById("history-list");

  // Generate HTML for each book
  listContainer.innerHTML = history
    .map(
      (book) => `
    <div class="history-item bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition duration-300 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-6 border border-gray-100 dark:bg-slate-800 dark:border-slate-700 animate-fade-in">
        <div class="flex items-start flex-grow">
            <a href="detail.html?id=${book.id}" class="flex-shrink-0">
                <img class="w-20 h-28 object-cover rounded shadow mr-4 bg-gray-200" 
                     src="${book.thumbnail}" 
                     onerror="this.src='https://placehold.co/80x120?text=No+Cover'">
            </a>
            
            <div>
                <a href="detail.html?id=${book.id}">
                    <h3 class="text-lg font-semibold text-gray-900 leading-snug dark:text-white hover:text-secondary transition-colors">
                        ${book.title}
                    </h3>
                </a>
                <p class="text-sm text-secondary dark:text-accent mt-1 font-medium">${book.category}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                   Last Viewed: <span class="font-medium text-gray-700 dark:text-gray-300">${book.date}</span>
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">by ${book.author}</p>
            </div>
        </div>

        <div class="flex items-center space-x-3 self-end md:self-center w-full md:w-auto">
            <a href="detail.html?id=${book.id}" 
               class="flex-1 md:flex-none px-4 py-2 text-sm font-medium border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition text-center dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-primary">
                Read Again
            </a>
            <button onclick="removeOneFromHistory(${book.id})" class="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove">
                <i class="ph-bold ph-trash text-xl"></i>
            </button>
        </div>
    </div>
  `
    )
    .join("");
}

// Global function for the specific delete button
window.removeOneFromHistory = (id) => {
  if (!confirm("Remove this book from history?")) return;

  let history = JSON.parse(localStorage.getItem("read_history") || "[]");
  history = history.filter((item) => item.id != id);
  localStorage.setItem("read_history", JSON.stringify(history));
  renderHistory();
};
