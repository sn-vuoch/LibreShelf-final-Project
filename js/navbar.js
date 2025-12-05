function renderNavbar(containerId, activePage = "") {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Get the current path
  const path = window.location.pathname;
  let pathPrefix = ".";
  if (path.includes("/pages/")) {
    const parts = path.split(/\/pages\//);
    const subPath = parts[1];
    const slashCount = (subPath.match(/\//g) || []).length;
    const depth = 1 + slashCount;
    pathPrefix = "../".repeat(depth);
    pathPrefix = "../".repeat(depth).slice(0, -1);
  }

  // Auth checking
  // Check if user is logged in by looking for the token in LocalStorage
  const accessToken = localStorage.getItem("access_token");
  const isLoggedIn = !!accessToken;

  // Active Link
  const getLinkClass = (pageName) => {
    const baseClass =
      "font-medium transition-colors duration-200 dark:text-gray-300";
    const activeClass = "text-primary font-bold dark:text-accent";
    const inactiveClass =
      "text-primary hover:text-secondary dark:hover:text-white";

    return activePage === pageName
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${inactiveClass}`;
  };

  // Dynamic Sign-up/Sign-in Button
  let authSectionHTML = "";
  if (isLoggedIn) {
    authSectionHTML = `
        <div class="relative">
            <!-- Profile Trigger (Generic Icon) -->
            <button style="margin-left: 7px;" id="profile-menu-btn" class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-primary dark:text-white transition-colors focus:ring-2 focus:ring-accent">
                <i class="ph-bold ph-user text-xl"></i>
            </button>

            <!-- Dropdown Menu -->
            <div id="profile-dropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 hidden transform origin-top-right transition-all duration-200 z-50">
                <div class="py-1">
                <!-- ADMIN LINK (Only show if role is admin) -->
                    ${
                      localStorage.getItem("user_role") === "admin"
                        ? `
                    <a href="${pathPrefix}/pages/admin.html" class="flex items-center gap-2 px-4 py-2 text-sm text-accent font-bold hover:bg-gray-50 dark:hover:bg-slate-700">
                        <i class="ph-bold ph-shield-check"></i> Admin Panel
                    </a>
                    `
                        : ""
                    }
                    <a href="${pathPrefix}/pages/dashboard.html" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <i class="ph-bold ph-user"></i> Dashboard
                    </a>
                    <a href="${pathPrefix}/pages/upload.html" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <i class="ph-bold ph-upload-simple"></i> Upload Book
                    </a>
                    <div class="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                    <button id="logout-btn" class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <i class="ph-bold ph-sign-out"></i> Logout
                    </button>
                </div>
            </div>
        </div>
      `;
  } else {
    authSectionHTML = `
        <a href="${pathPrefix}/pages/signin.html" class="px-6 py-2.5 bg-primary text-pure-white font-semibold rounded-lg hover:bg-secondary transition duration-300 shadow-md">
            Sign In
        </a>
      `;
  }

  // bg-white/10 backdrop-blur-md border border-white/20
  const navbarHTML = `
    <nav class="fixed w-full z-50 bg-pure-white dark:bg-slate-900 shadow-sm font-primary">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div class="flex justify-between items-center h-20">
                
                <!-- LOGO -->
                <a href="${pathPrefix}/index.html" class="flex-shrink-0 flex items-center gap-2 cursor-pointer decoration-0">
                   <!-- Ensure images folder is accessible -->
                   <img src="${pathPrefix}/img/Libreshelf.png" class="w-15 md:w-20 dark:hidden" alt="Light Logo">
                   <img  src="${pathPrefix}/img/white-logo.png" class="w-15 md:w-20  hidden dark:block" alt="Dark Logo">
                </a>

                <!-- DESKTOP MENU -->
                <div class="hidden md:flex space-x-8 items-center">
                    <a href="${pathPrefix}/index.html" class="${getLinkClass(
    "home"
  )}">Home</a>
                    <a href="${pathPrefix}/pages/categories.html" class="${getLinkClass(
    "categories"
  )}">Categories</a>
                    <a href="${pathPrefix}/pages/about-us.html" class="${getLinkClass(
    "about"
  )}">About Us</a>
                    <a href="${pathPrefix}/pages/book.html" class="${getLinkClass(
    "mybook"
  )}">My Book</a>
                </div>

                <!-- RIGHT ICONS & BUTTON -->
                <div class="hidden md:flex items-center">
                    <!-- 1. Theme Toggle -->
                    <button id="theme-toggle" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-dark-gray hover:text-primary dark:text-gray-300 dark:hover:text-accent transition-colors">
                        <i class="ph ph-moon text-2xl"></i>
                    </button>

                    <!-- 2. Heart (Favorites) -->
                    <!-- TODO: Implement popup later -->
                    <button id="nav-heart-btn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-dark-gray hover:text-red-500 dark:text-gray-300 transition-colors relative">
                        <i class="ph ph-heart text-2xl"></i>
                    </button>
                    
                    <!-- 3. User Auth (Icon or Sign In) -->
                    ${authSectionHTML}
                </div>

                 <!-- MOBILE HEADER ICONS -->
                <div class="md:hidden flex items-center gap-4">
                    <!-- Show User Icon on Mobile if Logged In -->
                    ${
                      isLoggedIn
                        ? `
                    <a href="${pathPrefix}/pages/dashboard.html" class="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 text-primary dark:text-white">
                        <i class="ph-fill ph-user text-xl"></i>
                    </a>`
                        : ""
                    }
                    
                    <button id="mobile-menu-btn" class="text-primary dark:text-white focus:outline-none">
                        <i class="ph ph-list text-3xl"></i>
                    </button>
                </div>
                
                </div>
            </div>
        </div>

        <!-- 5. MOBILE MENU DROPDOWN -->
        <div id="mobile-menu" class="mobile-menu md:hidden bg-pure-white dark:bg-slate-900 shadow-lg overflow-hidden max-h-0 opacity-0 transition-all duration-300 ease-in-out">
            <div class="px-4 py-4 space-y-3 flex flex-col">
                
                <a href="${pathPrefix}/index.html" class="block px-4 py-2 rounded-lg ${
    activePage === "home"
      ? "bg-gray-50 dark:bg-slate-800 text-primary dark:text-accent font-bold"
      : "text-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
  }">Home</a>

                <a href="${pathPrefix}/pages/categories.html" class="block px-4 py-2 rounded-lg ${
    activePage === "categories"
      ? "bg-gray-50 dark:bg-slate-800 text-primary dark:text-accent font-bold"
      : "text-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
  }">Categories</a>

                <a href="${pathPrefix}/pages/about-us.html" class="block px-4 py-2 rounded-lg ${
    activePage === "about"
      ? "bg-gray-50 dark:bg-slate-800 text-primary dark:text-accent font-bold"
      : "text-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
  }">About Us</a>

                <a href="${pathPrefix}/pages/book.html" class="block px-4 py-2 rounded-lg ${
    activePage === "mybook"
      ? "bg-gray-50 dark:bg-slate-800 text-primary dark:text-accent font-bold"
      : "text-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
  }">My Book</a>
                <hr class="border-gray-200">

                <!-- Mobile Theme Toggle -->
                <div class="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-slate-800 mt-2 pt-4">
                    <button id="mobile-theme-toggle" class="flex items-center gap-2 text-text-black dark:text-gray-300">
                        <i class="ph ph-moon text-xl"></i> <span>Dark Mode</span>
                    </button>
                    <!-- Mobile Heart -->
                    <button id="mobile-heart-btn" class="flex items-center gap-2 text-text-black dark:text-gray-300">
                        <i class="ph ph-heart text-xl"></i> <span>Favorites</span>
                    </button>
                </div>
                 <!-- Mobile Auth Button -->
                ${
                  !isLoggedIn
                    ? `<a href="${pathPrefix}/pages/signin.html" class="block text-center w-full px-6 py-3 bg-primary text-white rounded-lg mt-2">Sign In</a>`
                    : ""
                }
                ${
                  isLoggedIn
                    ? `<button id="mobile-logout-btn" class="block text-center w-full px-6 py-3 bg-red-50 text-red-600 font-bold rounded-lg mt-2">Logout</button>`
                    : ""
                }
            </div>
        </div>
    </nav>
    `;

  // Inject HTML
  container.innerHTML = navbarHTML;

  // Event Listener
  const profileBtn = document.getElementById("profile-menu-btn");
  const dropdown = document.getElementById("profile-dropdown");

  if (profileBtn && dropdown) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });
  }

  // 2. Mobile Menu
  const btn = container.querySelector("#mobile-menu-btn");
  const menu = container.querySelector("#mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      const isOpen = !menu.classList.contains("max-h-0");
      if (isOpen) {
        menu.classList.add("max-h-0", "opacity-0");
        menu.classList.remove("max-h-[500px]", "opacity-100");
      } else {
        menu.classList.remove("max-h-0", "opacity-0");
        menu.classList.add("max-h-[500px]", "opacity-100");
      }
    });
  }

  // 3. Logout
  const handleLogout = () => {
    if (confirm("Log out of LibreShelf?")) {
      localStorage.clear();
      window.location.href = `${pathPrefix}/index.html`;
    }
  };
  const logoutBtn = document.getElementById("logout-btn");
  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);

  // 4. Dark Mode Icons
  const updateIcons = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const iconClass = isDark ? "ph-sun" : "ph-moon";

    const desktopIcon = document.querySelector("#theme-toggle i");
    const mobileIcon = document.querySelector("#mobile-theme-toggle i");

    if (desktopIcon) desktopIcon.className = `ph ${iconClass} text-2xl`;
    if (mobileIcon) mobileIcon.className = `ph ${iconClass} text-xl`;
  };
  updateIcons();

  const toggleBtn = document.getElementById("theme-toggle");
  const mobileToggleBtn = document.getElementById("mobile-theme-toggle");

  const handleToggle = () => {
    if (window.LibreTheme) {
      window.LibreTheme.toggle();
      updateIcons();
    }
  };

  if (toggleBtn) toggleBtn.addEventListener("click", handleToggle);
  if (mobileToggleBtn) mobileToggleBtn.addEventListener("click", handleToggle);

  // 5. HEART CLICK LOGIC (NEW)
  const handleHeartClick = () => {
    if (isLoggedIn) {
      // Redirect to Dashboard with hash #favorites
      window.location.href = `${pathPrefix}/pages/dashboard.html#favorites`;
    } else {
      // Redirect to Sign In
      window.location.href = `${pathPrefix}/pages/signin.html`;
    }
  };

  const desktopHeart = document.getElementById("nav-heart-btn");
  const mobileHeart = document.getElementById("mobile-heart-btn");

  if (desktopHeart) desktopHeart.addEventListener("click", handleHeartClick);
  if (mobileHeart) mobileHeart.addEventListener("click", handleHeartClick);
}
