// Handles fetching, authentication, token, and role management.

const API_BASE_URL = "https://stem-api.anajak-khmer.site";

// --- Local Storage Helpers ---
function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function getRole() {
  return localStorage.getItem("user_role");
}

function setRole(role) {
  localStorage.setItem("user_role", role);
}

function removeAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_avatar");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_id");
}

// Fetching Data Core Function
async function protectedRequest(endpoint, method = "GET", body = null) {
  const token = getToken();
  if (!token) {
    console.error("Authorization Required: No token found.");
    throw new Error("Authentication failed. Please log in.");
  }

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Attaching the Bearer token
    },
  };

  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorDetail = await response.json().catch(() => ({}));
    console.error(
      `API Error on ${endpoint}:`,
      errorDetail.detail || response.statusText
    );
    throw new Error(
      `API Request failed: ${response.status} - ${JSON.stringify(errorDetail)}`
    );
  }

  // Handle 204 No Content responses (like DELETE)
  if (response.status === 204) return {};

  return response.json();
}

// Used by Auth and other sections
export const Utils = {
  async getMyProfile() {
    return protectedRequest("/users/me", "GET");
  },

  // Fetches all categories
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories/`);
    if (!response.ok) throw new Error("Failed to fetch categories.");
    return response.json();
  },

  // Checks if the user has a specific role (e.g., isAllowed('teacher'))
  isAllowed: (requiredRole) => {
    const userRole = getRole();
    if (requiredRole === "teacher" && userRole === "admin") return true; // Admin can do teacher tasks
    return userRole === requiredRole;
  },

  // Checks if user is Admin
  isAdmin: () => getRole() === "admin",
  // Checks if user is Teacher (our standard logged-in user)
  isUser: () => getRole() === "teacher" || getRole() === "student",

  // File Upload (Requires FormData, handled as a special case)
  async uploadFile(fileFormData) {
    const token = getToken();
    if (!token) throw new Error("Authentication failed for file upload.");

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fileFormData, // FormData is handled by the browser
    });

    if (!response.ok) throw new Error("File upload failed.");
    return response.json();
  },
};

// API Categories Auth
export const Auth = {
  async login(identifier, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();

    if (response.ok) {
      setToken(data.access_token);
      try {
        // Fetch Profile to get Role, ID, Name, and Avatar
        const profile = await Utils.getMyProfile();

        setRole(profile.role);
        localStorage.setItem(
          "user_name",
          profile.full_name || profile.username
        );
        localStorage.setItem("user_id", profile.id); // <--- SAVE ID
        localStorage.setItem("user_avatar", profile.profile_url); // <--- SAVE AVATAR

        return { success: true, role: profile.role, profile };
      } catch (profileError) {
        console.error("Profile fetch error", profileError);
        removeAuth();
        return { success: false, error: "Login success but profile failed." };
      }
    } else {
      return { success: false, error: data.detail || "Login failed." };
    }
  },

  async register(userData) {
    // NOTE: Swagger shows 'role' is part of the registration body.
    // Ensure you set the role (e.g., 'teacher' for content creators)
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response.json(); // Should return token/detail error
  },

  // Clear all auth data
  logout: () => {
    removeAuth();
    localStorage.removeItem("user_name");
    window.location.href = "/";
  },

  // Check if any token exists
  isAuthenticated: () => !!getToken(),

  // Attempt to log in again with existing token (useful on page load)
  async checkAuthOnLoad() {
    if (!getToken()) return false;
    try {
      // Attempt to fetch profile to validate token/role
      const profile = await Utils.getMyProfile();
      setRole(profile.role);
      return true;
    } catch (e) {
      removeAuth();
      return false;
    }
  },
};

// API Categories Book
export const Books = {
  async getAll({ page = 1, limit = 20, search = "", category_id = null } = {}) {
    // Filter out empty values to avoid validation errors (e.g. sending category_id='')
    const params = { page, limit };
    if (search) params.search = search;
    if (category_id) params.category_id = category_id;

    const query = new URLSearchParams(params);
    // Added trailing slash as per your fix
    const url = `/books/?${query.toString()}`;

    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error("Failed to fetch books.");
    return response.json();
  },

  // Get a single book detail
  async getById(bookId) {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
    if (!response.ok) throw new Error("Book not found.");
    return response.json();
  },

  // Create a book
  async create(bookData) {
    return protectedRequest("/books/", "POST", bookData);
  },
  // Update a book
  async update(bookId, bookData) {
    return protectedRequest(`/books/${bookId}`, "PATCH", bookData);
  },
  // Delete a book
  async delete(bookId) {
    return protectedRequest(`/books/${bookId}`, "DELETE");
  },
};

// --- API CATEGORY: CATEGORIES (Admin) ---
export const Categories = {
  async getAll() {
    // We already have Utils.getCategories, but this keeps it organized
    const response = await fetch(`${API_BASE_URL}/categories/`);
    if (!response.ok) throw new Error("Failed to fetch categories.");
    return response.json();
  },

  // Create a new category (Admin only)
  async create(name, description, parentId = 1) {
    return protectedRequest("/categories", "POST", {
      name,
      description,
      parent_id: parentId,
    });
  },

  // Delete a category (Admin only)
  async delete(id) {
    return protectedRequest(`/categories/${id}`, "DELETE");
  },

  // Bookmarks
  async getBookmarks() {
    return protectedRequest("/books/bookmark/me/", "GET");
  },
  async addBookmark(bookId) {
    return protectedRequest("/books/bookmark/", "POST", { book_id: bookId });
  }, // Check logic if body needed
  async removeBookmark(bookId) {
    return protectedRequest(`/books/bookmark/${bookId}/`, "DELETE");
  },

  // Reports
  async report(bookId, reason) {
    return protectedRequest("/books/report/", "POST", {
      book_id: bookId,
      reason: reason,
    });
  },
};
