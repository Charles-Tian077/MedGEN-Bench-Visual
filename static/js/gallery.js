(() => {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  const slides = Array.from(gallery.querySelectorAll("[data-gallery-slide]"));
  const dots = Array.from(gallery.querySelectorAll("[data-gallery-dot]"));
  const previous = gallery.querySelector("[data-gallery-prev]");
  const next = gallery.querySelector("[data-gallery-next]");
  const status = gallery.querySelector("[data-gallery-status]");
  let activeIndex = 0;
  let touchStartX = null;

  const showSlide = (requestedIndex) => {
    activeIndex = (requestedIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.hidden = !isActive;
      slide.classList.toggle("is-active", isActive);
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
      dot.toggleAttribute("aria-current", isActive);
    });

    const label = slides[activeIndex].dataset.galleryLabel;
    status.textContent = `${activeIndex + 1} / ${slides.length} · ${label}`;
  };

  previous.addEventListener("click", () => showSlide(activeIndex - 1));
  next.addEventListener("click", () => showSlide(activeIndex + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => showSlide(index));
  });

  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(activeIndex + 1);
    }
  });

  gallery.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  gallery.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 55) return;
    showSlide(activeIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
})();
