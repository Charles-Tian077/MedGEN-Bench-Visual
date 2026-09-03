(() => {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  const AUTOPLAY_DELAY = 5000;
  const slides = Array.from(gallery.querySelectorAll("[data-gallery-slide]"));
  const dots = Array.from(gallery.querySelectorAll("[data-gallery-dot]"));
  const previous = gallery.querySelector("[data-gallery-prev]");
  const next = gallery.querySelector("[data-gallery-next]");
  const status = gallery.querySelector("[data-gallery-status]");
  const autoplay = gallery.querySelector("[data-gallery-autoplay]");
  const autoplayIcon = gallery.querySelector("[data-gallery-autoplay-icon]");
  const autoplayLabel = gallery.querySelector("[data-gallery-autoplay-label]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let activeIndex = 0;
  let autoplayTimer = null;
  let hoverPaused = false;
  let userPaused = false;
  let touchStartX = null;

  const stopAutoplay = () => {
    if (autoplayTimer === null) return;
    window.clearTimeout(autoplayTimer);
    autoplayTimer = null;
  };

  const canAutoplay = () => (
    slides.length > 1
    && !userPaused
    && !hoverPaused
    && !document.hidden
    && !reducedMotion.matches
  );

  const showSlide = (requestedIndex, { automatic = false } = {}) => {
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
    status.setAttribute("aria-live", automatic ? "off" : "polite");
    status.textContent = `${activeIndex + 1} / ${slides.length} · ${label}`;
  };

  const scheduleAutoplay = () => {
    stopAutoplay();
    if (!canAutoplay()) return;
    autoplayTimer = window.setTimeout(() => {
      showSlide(activeIndex + 1, { automatic: true });
      scheduleAutoplay();
    }, AUTOPLAY_DELAY);
  };

  const showManualSlide = (index) => {
    showSlide(index);
    scheduleAutoplay();
  };

  const updateAutoplayControl = () => {
    if (!autoplay) return;
    autoplay.hidden = reducedMotion.matches || slides.length < 2;
    autoplay.setAttribute("aria-pressed", String(userPaused));
    autoplay.setAttribute(
      "aria-label",
      userPaused ? "Resume automatic gallery rotation" : "Pause automatic gallery rotation"
    );
    autoplayIcon.textContent = userPaused ? "▶" : "Ⅱ";
    autoplayLabel.textContent = userPaused ? "Play" : "Pause";
  };

  previous.addEventListener("click", () => showManualSlide(activeIndex - 1));
  next.addEventListener("click", () => showManualSlide(activeIndex + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => showManualSlide(index));
  });

  autoplay.addEventListener("click", () => {
    userPaused = !userPaused;
    updateAutoplayControl();
    if (userPaused) stopAutoplay();
    else scheduleAutoplay();
  });

  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showManualSlide(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showManualSlide(activeIndex + 1);
    }
  });

  gallery.addEventListener("mouseenter", () => {
    hoverPaused = true;
    stopAutoplay();
  });

  gallery.addEventListener("mouseleave", () => {
    hoverPaused = false;
    scheduleAutoplay();
  });

  gallery.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  gallery.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 55) return;
    showManualSlide(activeIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("visibilitychange", scheduleAutoplay);

  const handleMotionPreference = () => {
    updateAutoplayControl();
    scheduleAutoplay();
  };

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionPreference);
  } else {
    reducedMotion.addListener(handleMotionPreference);
  }

  updateAutoplayControl();
  scheduleAutoplay();
})();
