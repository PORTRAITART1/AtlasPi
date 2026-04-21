document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");
  const form = document.getElementById("waitlistForm");
  const emailInput = document.getElementById("emailInput");
  const formNote = document.getElementById("formNote");
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
      menu.classList.toggle("open");
    });

    document.querySelectorAll(".menu a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
      });
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();

      if (!email) {
        formNote.textContent = "Please enter your email address.";
        return;
      }

      if (!email.includes("@") || !email.includes(".")) {
        formNote.textContent = "Please enter a valid email address.";
        return;
      }

      formNote.textContent = "Thank you. Your early-interest request has been noted.";
      emailInput.value = "";
    });
  }
});