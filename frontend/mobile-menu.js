document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const menuPanel = document.getElementById("menuPanel");
  
    if (!menuToggle || !menuPanel) return;
  
    function openMenu() {
      menuPanel.hidden = false;
      menuToggle.setAttribute("aria-expanded", "true");
    }
  
    function closeMenu() {
      menuPanel.hidden = true;
      menuToggle.setAttribute("aria-expanded", "false");
    }
  
    function toggleMenu() {
      if (menuPanel.hidden) {
        openMenu();
      } else {
        closeMenu();
      }
    }
  
    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu();
    });
  
    menuPanel.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  
    document.addEventListener("click", () => {
      closeMenu();
    });
  
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });
  });