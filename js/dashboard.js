import { Utils, Books } from "./api.js";

const els = {
  avatar: document.getElementById("sidebar-avatar"),
  name: document.getElementById("sidebar-name"),
  role: document.getElementById("sidebar-role"),
  inputName: document.getElementById("input-fullname"),
  inputEmail: document.getElementById("input-email"),
  inputPhone: document.getElementById("input-phone"),
  inputBio: document.getElementById("input-bio"),
  inputGender: document.getElementById("input-gender"),
  form: document.getElementById("profile-form"),
  booksGrid: document.getElementById("my-books-grid"),
};

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Load Profile Data
    const profile = await Utils.getMyProfile();
    renderProfile(profile);

    // 2. Load User's Books
    // We filter by the user's ID
    if (profile.id) {
      loadUserBooks(profile.id);
    }
  } catch (error) {
    console.error("Dashboard Error:", error);
    alert("Failed to load dashboard data. Please login again.");
    window.location.href = "../pages/signin.html";
  }
});

// --- RENDER PROFILE ---
function renderProfile(user) {
  // Sidebar
  els.avatar.src = user.profile_url || "https://placehold.co/100";
  els.name.textContent = user.full_name || user.username;
  els.role.textContent = user.role;

  // Form
  els.inputName.value = user.full_name || "";
  els.inputEmail.value = user.email || "";
  els.inputPhone.value = user.phone_number || "";
  els.inputBio.value = user.bio || "";
  if (user.gender) els.inputGender.value = user.gender;
}

// --- LOAD MY BOOKS ---
async function loadUserBooks(userId) {
  els.booksGrid.innerHTML =
    '<p class="col-span-full text-gray-500">Loading your books...</p>';

  try {
    // Fetch all books and filter client-side (unless API supports ?author_id=X)
    // Try: await Books.getAll({ author_id: userId });
    // Fallback if API doesn't filter: Fetch all and filter in JS
    const response = await Books.getAll({ limit: 100 });
    const allBooks = response.books || response.data || [];

    // Filter: Keep books where author_id matches current user
    const myBooks = allBooks.filter((book) => book.author_id === userId);

    if (myBooks.length === 0) {
      els.booksGrid.innerHTML = `
                <div class="col-span-full text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                    <p class="text-gray-400">You haven't uploaded any books yet.</p>
                </div>`;
      return;
    }

    els.booksGrid.innerHTML = myBooks
      .map(
        (book) => `
            <div class="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-600 flex gap-4">
                <img src="${book.thumbnail}" class="w-16 h-24 object-cover rounded bg-gray-200">
                <div class="flex-1">
                    <h4 class="font-bold text-primary dark:text-white line-clamp-1">${book.title}</h4>
                    <p class="text-xs text-gray-500 mb-2">Status: Published</p>
                    <div class="flex gap-2">
                        <button class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200" onclick="deleteBook(${book.id})">Delete</button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    els.booksGrid.innerHTML =
      '<p class="text-red-500">Failed to load books.</p>';
  }
}

// --- UPDATE PROFILE LOGIC ---
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = els.form.querySelector("button");
  const oldText = btn.innerText;
  btn.innerText = "Saving...";
  btn.disabled = true;

  // Get current ID
  const userId = localStorage.getItem("user_id");

  const updateData = {
    full_name: els.inputName.value,
    bio: els.inputBio.value,
    gender: els.inputGender.value,
    phone_number: els.inputPhone.value,
    // API requires profile_url, send existing or placeholder if not changing
    profile_url: els.avatar.src,
  };

  try {
    // Call API Helper
    // We need to implement Utils.updateProfile or use protectedRequest directly
    // Assuming you have a PATCH /users/{id} endpoint
    // You might need to add updateProfile to api.js or use raw fetch here

    // Let's use the raw fetch pattern since we didn't explicitly add updateProfile to api.js Utils yet
    const token = localStorage.getItem("access_token");
    const res = await fetch(
      `https://stem-api.anajak-khmer.site/users/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (res.ok) {
      alert("Profile updated successfully!");
      // Update local storage name for navbar
      localStorage.setItem("user_name", updateData.full_name);
    } else {
      alert("Failed to update profile.");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating profile.");
  } finally {
    btn.innerText = oldText;
    btn.disabled = false;
  }
});

// Expose delete function to global scope for the onclick handler
window.deleteBook = async (id) => {
  if (!confirm("Are you sure you want to delete this book?")) return;
  try {
    await Books.delete(id);
    alert("Book deleted.");
    location.reload();
  } catch (e) {
    alert("Failed to delete.");
  }
};
