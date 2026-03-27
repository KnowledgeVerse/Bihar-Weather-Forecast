function initMenuDropdowns() {
  // Find all dropdown triggers
  const dropdownToggles = document.querySelectorAll(
    ".main-menu .dropdown-title",
  );

  dropdownToggles.forEach(function (toggle) {
    toggle.addEventListener("click", function (event) {
      // Prevent default action if it's a link
      event.preventDefault();

      // Get the parent .menu-item.dropdown
      const parentMenuItem = this.closest(".menu-item.dropdown");

      if (parentMenuItem) {
        // Toggle the .open class on the parent menu item
        parentMenuItem.classList.toggle("open");

        // Optional: Close other open dropdowns
        const allDropdowns = document.querySelectorAll(
          ".main-menu .menu-item.dropdown",
        );
        allDropdowns.forEach(function (dropdown) {
          if (dropdown !== parentMenuItem) {
            dropdown.classList.remove("open");
          }
        });
      }
    });
  });

  // Optional: Close dropdowns when clicking outside the menu
  document.addEventListener("click", function (event) {
    const menu = document.querySelector(".main-menu");
    if (menu && !menu.contains(event.target)) {
      const allDropdowns = document.querySelectorAll(
        ".main-menu .menu-item.dropdown.open",
      );
      allDropdowns.forEach((dropdown) => dropdown.classList.remove("open"));
    }
  });
}
