import { Utils, Books } from "./api.js";

const els = {
  avatar: document.getElementById("sidebar-avatar"),
  avatarInput: document.getElementById("avatar-input"),
  name: document.getElementById("sidebar-name"),
  role: document.getElementById("sidebar-role"),
  inputName: document.getElementById("input-fullname"),
  inputEmail: document.getElementById("input-email"),
  inputPhone: document.getElementById("input-phone"),
  inputBio: document.getElementById("input-bio"),
  inputGender: document.getElementById("input-gender"),
  form: document.getElementById("profile-form"),
  booksGrid: document.getElementById("my-books-grid"),
  favGrid: document.getElementById("favorites-grid"),
};

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const profile = await Utils.getMyProfile();
    renderProfile(profile);

    // Listen for tab changes to load data
    document.addEventListener("tab-changed", (e) => {
      if (e.detail === "books") loadUserBooks(profile.id);
      if (e.detail === "favorites") loadFavorites();
    });
  } catch (error) {
    console.error("Dashboard Auth Error:", error);
    window.location.href = "signin.html";
  }
});

// --- 1. PROFILE & AVATAR LOGIC ---
function renderProfile(user) {
  // Sidebar
  els.avatar.src = user.profile_url || "https://placehold.co/100";
  els.name.textContent = user.full_name || user.username;
  els.role.textContent =
    localStorage.getItem("user_role") === "teacher" ? "User" : "Admin";

  // Form
  els.inputName.value = user.full_name || "";
  els.inputEmail.value = user.email || "";
  els.inputPhone.value = user.phone_number || "";
  els.inputBio.value = user.bio || "";
  if (user.gender) els.inputGender.value = user.gender;

  localStorage.setItem("user_id", user.id);
}

// Avatar Upload Listener
if (els.avatarInput) {
  els.avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    els.avatar.style.opacity = "0.5"; // Loading indicator

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await Utils.uploadFile(formData);
      const newAvatarUrl =
        typeof response === "string"
          ? response
          : response.url || response.file_url;

      // Update UI immediately
      els.avatar.src = newAvatarUrl;

      // Save to Profile
      await saveProfileAvatar(newAvatarUrl);
    } catch (err) {
      alert("Failed to upload profile picture.");
      console.error(err);
    } finally {
      els.avatar.style.opacity = "1";
    }
  });
}

async function saveProfileAvatar(url) {
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("access_token");

  // We send existing form values + new URL
  const updateData = {
    full_name: els.inputName.value,
    phone_number: els.inputPhone.value,
    bio: els.inputBio.value,
    gender: els.inputGender.value,
    profile_url: url,
  };

  const res = await fetch(
    `https://stem-api.anajak-khmer.site/users/${userId}/`,
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
    localStorage.setItem("user_avatar", url); // Update local storage for navbar
  }
}

// Profile Form Submit
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = els.form.querySelector("button");
  const oldText = btn.innerHTML;
  btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> Saving...`;
  btn.disabled = true;

  const userId = localStorage.getItem("user_id");
  const updateData = {
    full_name: els.inputName.value,
    bio: els.inputBio.value,
    gender: els.inputGender.value,
    phone_number: els.inputPhone.value,
    profile_url: els.avatar.src,
  };

  try {
    const token = localStorage.getItem("access_token");
    const res = await fetch(
      `https://stem-api.anajak-khmer.site/users/${userId}/`,
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
      localStorage.setItem("user_name", updateData.full_name);
      els.name.textContent = updateData.full_name;
    } else {
      throw new Error("Update failed");
    }
  } catch (err) {
    alert("Error updating profile.");
  } finally {
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
});

// --- 2. MY BOOKS LOGIC (With Edit Button) ---
async function loadUserBooks(userId) {
  if (!els.booksGrid) return;
  els.booksGrid.innerHTML =
    '<p class="col-span-full text-center py-8 text-gray-500">Loading your books...</p>';

  try {
    const response = await Books.getAll({ limit: 100 });
    const allBooks = response.books || response.data || [];
    const myBooks = allBooks.filter((book) => book.author_id === userId);

    if (myBooks.length === 0) {
      els.booksGrid.innerHTML = `
                <div class="col-span-full text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                    <p class="text-gray-400">You haven't uploaded any books.</p>
                    <a href="upload.html" class="text-accent hover:underline font-bold mt-2 inline-block">Upload Now</a>
                </div>`;
      return;
    }

    els.booksGrid.innerHTML = myBooks
      .map(
        (book) => `
            <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4 hover:shadow-md transition-all">
                <img src="${
                  book.thumbnail || "https://placehold.co/100"
                }" class="w-20 h-28 object-cover rounded bg-gray-200">
                <div class="flex-1 flex flex-col">
                    <h4 class="font-bold text-primary dark:text-white line-clamp-1 text-lg">${
                      book.title
                    }</h4>
                    <p class="text-xs text-gray-500 mb-auto">ID: ${book.id}</p>
                    
                    <div class="flex gap-2 mt-2">
                        <!-- EDIT BUTTON -->
                        <a href="upload.html?edit=${
                          book.id
                        }" class="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 font-bold">
                            <i class="ph-bold ph-pencil-simple"></i> Edit
                        </a>
                        <!-- DELETE BUTTON -->
                        <button onclick="deleteBook(${
                          book.id
                        })" class="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1 font-bold">
                            <i class="ph-bold ph-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    els.booksGrid.innerHTML =
      '<p class="text-red-500 text-center">Failed to load books.</p>';
  }
}

// Global Delete
window.deleteBook = async (id) => {
  if (!confirm("Permanently delete this book?")) return;
  try {
    await Books.delete(id);
    const userId = parseInt(localStorage.getItem("user_id"));
    loadUserBooks(userId); // Reload list
  } catch (e) {
    alert("Failed to delete.");
  }
};

// --- 3. FAVORITES LOGIC ---
async function loadFavorites() {
  if (!els.favGrid) return;
  els.favGrid.innerHTML =
    '<p class="col-span-full text-center py-8 text-gray-500">Loading favorites...</p>';

  try {
    const bookmarks = await Books.getBookmarks();

    if (!bookmarks || bookmarks.length === 0) {
      els.favGrid.innerHTML = `<div class="col-span-full text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl"><p class="text-gray-400">No favorites yet.</p></div>`;
      return;
    }

    els.favGrid.innerHTML = bookmarks
      .map(
        (book) => `
            <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4">
                <a href="detail.html?id=${book.id}" class="flex-shrink-0"><img src="${book.thumbnail}" class="w-16 h-24 object-cover rounded"></a>
                <div class="flex-1">
                    <a href="detail.html?id=${book.id}" class="font-bold text-primary dark:text-white line-clamp-1 hover:text-accent">${book.title}</a>
                    <button onclick="removeFav(${book.id})" class="text-xs text-red-500 hover:text-red-600 mt-2"><i class="ph-bold ph-heart-break"></i> Remove</button>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    els.favGrid.innerHTML =
      '<p class="text-red-500 text-center">Failed to load favorites.</p>';
  }
}

window.removeFav = async (id) => {
  if (!confirm("Remove?")) return;
  try {
    await Books.removeBookmark(id);
    loadFavorites();
  } catch (e) {
    alert("Failed.");
  }
};
