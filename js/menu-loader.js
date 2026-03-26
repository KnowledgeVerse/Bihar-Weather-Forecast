document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector('link[href*="menu.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "css/menu.css";
    document.head.appendChild(link);
  }
  fetch("components/menu.html")
    .then((res) => res.text())
    .then((data) => {
      document.getElementById("menu-container").innerHTML = data;

      // Collapse Menu Toggle Logic
      const toggleBtn = document.getElementById("sidebarToggle");
      if (toggleBtn) {
        if (localStorage.getItem("sidebarCollapsed") === "true") {
          document.body.classList.add("sidebar-collapsed");
        }
        toggleBtn.addEventListener("click", () => {
          document.body.classList.toggle("sidebar-collapsed");
          localStorage.setItem(
            "sidebarCollapsed",
            document.body.classList.contains("sidebar-collapsed"),
          );
        });
      }

      // Highlight the active menu item
      const currentPage = window.location.pathname.split("/").pop();
      if (currentPage) {
        const menuLinks = document.querySelectorAll(".main-menu a");
        menuLinks.forEach((link) => {
          if (link.getAttribute("href").endsWith(currentPage)) {
            // Add 'active' to the specific li
            link.parentElement.classList.add("active");

            // Add 'active-parent' to the top-level dropdown
            const parentDropdown = link.closest(".menu-item.dropdown");
            if (parentDropdown) {
              parentDropdown.classList.add("active-parent");
            } else if (link.parentElement.classList.contains("menu-item")) {
              // For top-level links like 'Home'
              link.parentElement.classList.add("active-parent");
            }
          }
        });
      }

      // FIX: Trigger a window resize event after the menu is loaded.
      // This allows Leaflet maps (and other layout-dependent components)
      // to recalculate their size after the sidebar menu is added.
      // A small delay ensures the browser has applied the new CSS layout.
      setTimeout(() => window.dispatchEvent(new Event("resize")), 250);
    });
});
