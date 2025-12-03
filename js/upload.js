import { Utils, Books } from "./api.js";

// Elements
const els = {
  form: document.getElementById("upload-form"),
  catSelect: document.getElementById("category-select"),

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

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  // Auth Check
  const role = localStorage.getItem("user_role");
  if (!role || (role !== "teacher" && role !== "admin")) {
    alert("Access Denied.");
    window.location.href = "../pages/signin.html";
    return;
  }

  // 1. Load Categories FIRST and wait for it to finish
  await loadCategories();

  // 2. Check for Edit Mode AFTER categories are loaded
  const params = new URLSearchParams(window.location.search);
  if (params.has("edit")) {
    isEditMode = true;
    editBookId = params.get("edit");
    await setupEditMode(editBookId);
  }
});

// --- LOAD CATEGORIES ---
async function loadCategories() {
  try {
    const categories = await Utils.getCategories();

    // Clear and add default option
    els.catSelect.innerHTML =
      '<option value="" disabled selected>Select a genre</option>';

    if (categories && categories.length > 0) {
      els.catSelect.innerHTML += categories
        .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
        .join("");
    }
  } catch (err) {
    console.error("Failed to load categories", err);
    els.catSelect.innerHTML =
      '<option value="" disabled>Error loading categories</option>';
  }
}

// --- SETUP EDIT MODE (SUPER ROBUST FIX) ---
async function setupEditMode(id) {
  els.pageTitle.textContent = "Edit Book";
  els.submitBtn.innerHTML = `<i class="ph-bold ph-pencil"></i> Update Book`;
  els.loader.classList.remove("hidden");

  try {
    const book = await Books.getById(id);

    // 1. Fill Text Fields
    document.getElementById("title").value = book.title || "";
    document.getElementById("description").value = book.description || "";

    // 2. Handle Category Selection
    // We look for the ID in multiple potential properties to be safe
    let targetId = null;

    // Check 'categories' array (Standard)
    if (book.categories && book.categories.length > 0) {
      const first = book.categories[0];
      if (typeof first === "object" && first !== null && first.id)
        targetId = first.id;
      else if (typeof first === "number") targetId = first;
      else if (typeof first === "string") {
        // Try to match string name to option text
        const match = Array.from(els.catSelect.options).find(
          (o) => o.text.toLowerCase() === first.toLowerCase()
        );
        if (match) targetId = match.value;
      }
    }

    // Check 'category_ids' array (Common in Edit Payloads)
    if (!targetId && book.category_ids && book.category_ids.length > 0) {
      targetId = book.category_ids[0];
    }

    // Check 'category' object or 'category_id' (Singular)
    if (!targetId) {
      if (book.category_id) targetId = book.category_id;
      else if (book.category && book.category.id) targetId = book.category.id;
    }

    // Apply if found
    if (targetId) {
      // Force to string to match HTML value
      els.catSelect.value = targetId.toString();

      // Debugging: If it didn't select, verify why
      if (els.catSelect.value === "") {
        console.warn(
          `Found Book Category ID ${targetId}, but it does not match any options in the dropdown.`
        );
      }
    } else {
      console.warn("No category ID found in book object:", book);
    }

    // 3. Fill Images/Files (Visual only)
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
    console.error(error);
    alert("Failed to load book details. Please try again.");
  } finally {
    els.loader.classList.add("hidden");
  }
}

// --- SUBMIT LOGIC ---
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.errorMsg.classList.add("hidden");
  els.loader.classList.remove("hidden");

  try {
    // 1. Handle Category
    const finalCategoryId = els.catSelect.value;
    if (!finalCategoryId) throw new Error("Please select a category.");

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

    // Validation
    if (!isEditMode && (!coverUrl || !pdfUrl)) {
      throw new Error("Cover image and PDF are required.");
    }

    // 3. Prepare Payload
    const payload = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      category_ids: [parseInt(finalCategoryId)], // Ensure integer array
      thumbnail: coverUrl,
      file_url: pdfUrl,
      metadata: "{}",
    };

    // 4. Send Request (Create or Update)
    if (isEditMode) {
      await Books.update(editBookId, payload);
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
