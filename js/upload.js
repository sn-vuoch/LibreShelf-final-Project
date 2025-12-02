import { Utils, Books } from "./api.js";

// Elements
const els = {
  form: document.getElementById("upload-form"),
  catSelect: document.getElementById("category-select"),
  catInput: document.getElementById("category-input"),
  toggleCatBtn: document.getElementById("toggle-cat-mode"),

  coverInput: document.getElementById("cover-file"),
  coverPreview: document.getElementById("cover-preview"),
  coverPlaceholder: document.getElementById("cover-placeholder"),

  pdfInput: document.getElementById("book-file"),
  fileNameDisplay: document.getElementById("file-name-display"),

  submitBtn: document.getElementById("submit-btn"),
  pageTitle: document.getElementById("page-title"),
  errorMsg: document.getElementById("error-message"),
  loader: document.getElementById("form-loader"),

  // Hidden fields for edit mode
  existingCover: document.getElementById("existing-cover"),
  existingPdf: document.getElementById("existing-pdf"),
};

// State
let isEditMode = false;
let editBookId = null;
let isNewCategoryMode = false;

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  // Auth Check
  const role = localStorage.getItem("user_role");
  if (!role || (role !== "teacher" && role !== "admin")) {
    alert("Access Denied.");
    window.location.href = "../pages/signin.html";
    return;
  }

  // 1. Load Categories
  await loadCategories();

  // 2. Check for Edit Mode
  const params = new URLSearchParams(window.location.search);
  if (params.has("edit")) {
    isEditMode = true;
    editBookId = params.get("edit");
    setupEditMode(editBookId);
  }
});

// --- LOAD CATEGORIES ---
async function loadCategories() {
  try {
    const categories = await Utils.getCategories();
    els.catSelect.innerHTML =
      '<option value="" disabled selected>Select a genre</option>';
    if (categories && categories.length > 0) {
      els.catSelect.innerHTML += categories
        .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
        .join("");
    }
  } catch (err) {
    console.error(err);
  }
}

// --- SETUP EDIT MODE ---
async function setupEditMode(id) {
  els.pageTitle.textContent = "Edit Book";
  els.submitBtn.innerHTML = `<i class="ph-bold ph-pencil"></i> Update Book`;
  els.loader.classList.remove("hidden");

  try {
    const book = await Books.getById(id);

    // Fill Form
    document.getElementById("title").value = book.title;
    document.getElementById("description").value = book.description;

    // Handle Category
    // Assumption: book.categories is array of objects. We take first one.
    if (book.categories && book.categories.length > 0) {
      els.catSelect.value = book.categories[0].id;
    }

    // Fill Images/Files (Visual only)
    if (book.thumbnail) {
      els.coverPreview.src = book.thumbnail;
      els.coverPreview.classList.remove("hidden");
      els.coverPlaceholder.classList.add("hidden");
      els.existingCover.value = book.thumbnail;
    }
    if (book.file_url) {
      els.fileNameDisplay.textContent = "Current PDF Loaded";
      els.existingPdf.value = book.file_url;
    }
  } catch (error) {
    alert("Failed to load book data.");
  } finally {
    els.loader.classList.add("hidden");
  }
}

// --- CATEGORY TOGGLE LOGIC ---
els.toggleCatBtn.addEventListener("click", () => {
  isNewCategoryMode = !isNewCategoryMode;
  if (isNewCategoryMode) {
    els.catSelect.classList.add("hidden");
    els.catSelect.disabled = true;
    els.catInput.classList.remove("hidden");
    els.catInput.disabled = false;
    els.toggleCatBtn.textContent = "Cancel (Select Existing)";
  } else {
    els.catSelect.classList.remove("hidden");
    els.catSelect.disabled = false;
    els.catInput.classList.add("hidden");
    els.catInput.disabled = true;
    els.toggleCatBtn.textContent = "+ Create New";
  }
});

// --- SUBMIT LOGIC ---
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.errorMsg.classList.add("hidden");
  els.loader.classList.remove("hidden");

  try {
    // 1. Handle Category
    let finalCategoryId = els.catSelect.value;

    if (isNewCategoryMode) {
      const newCatName = els.catInput.value;
      if (!newCatName) throw new Error("Please enter a category name.");

      // Create Category via API (assuming POST /categories works)
      // Note: Check api.js if you have a method for this. If not, use raw fetch.
      // Using raw fetch here for safety based on your provided file list
      const token = localStorage.getItem("access_token");
      const catRes = await fetch(
        "https://stem-api.anajak-khmer.site/categories/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newCatName,
            description: "User created",
          }),
        }
      );
      if (!catRes.ok) throw new Error("Failed to create category");
      const newCat = await catRes.json();
      finalCategoryId = newCat.id;
    }

    // 2. Handle Files
    let coverUrl = els.existingCover.value;
    let pdfUrl = els.existingPdf.value;

    // Upload Cover if changed
    if (els.coverInput.files.length > 0) {
      const formData = new FormData();
      formData.append("file", els.coverInput.files[0]);
      const res = await Utils.uploadFile(formData);
      coverUrl = typeof res === "string" ? res : res.url || res.file_url;
    }

    // Upload PDF if changed
    if (els.pdfInput.files.length > 0) {
      const formData = new FormData();
      formData.append("file", els.pdfInput.files[0]);
      const res = await Utils.uploadFile(formData);
      pdfUrl = typeof res === "string" ? res : res.url || res.file_url;
    }

    // Validation for Create Mode
    if (!isEditMode && (!coverUrl || !pdfUrl)) {
      throw new Error("Cover image and PDF are required.");
    }

    // 3. Prepare Payload
    const payload = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      category_ids: [parseInt(finalCategoryId)],
      thumbnail: coverUrl,
      file_url: pdfUrl,
      metadata: "{}",
    };

    // 4. Send Request (Create or Update)
    if (isEditMode) {
      await Books.update(editBookId, payload); // Ensure api.js has update()
      alert("Book Updated Successfully!");
    } else {
      await Books.create(payload);
      alert("Book Published Successfully!");
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    els.errorMsg.textContent = error.message || "Operation failed.";
    els.errorMsg.classList.remove("hidden");
  } finally {
    els.loader.classList.add("hidden");
  }
});

// --- UI HELPERS ---
els.coverInput.addEventListener("change", function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      els.coverPreview.src = e.target.result;
      els.coverPreview.classList.remove("hidden");
      els.coverPlaceholder.classList.add("hidden");
    };
    reader.readAsDataURL(this.files[0]);
  }
});

els.pdfInput.addEventListener("change", function () {
  if (this.files && this.files[0]) {
    els.fileNameDisplay.textContent = this.files[0].name;
    els.fileNameDisplay.className = "text-primary font-bold px-2";
  }
});
