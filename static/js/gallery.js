(() => {
  "use strict";

  const AUTOPLAY_DELAY = 5000;
  const SWIPE_THRESHOLD = 55;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const belongsTo = (carousel) => (element) => (
    element.closest("[data-carousel]") === carousel
  );

  const carouselControllers = Array.from(
    document.querySelectorAll("[data-carousel]")
  ).map((carousel) => {
    const isOwned = belongsTo(carousel);
    const findAll = (selector) => Array.from(
      carousel.querySelectorAll(selector)
    ).filter(isOwned);
    const findOne = (selector) => findAll(selector)[0] || null;

    const slides = findAll("[data-carousel-slide]");
    const dots = findAll("[data-carousel-dot]");
    const previous = findOne("[data-carousel-prev]");
    const next = findOne("[data-carousel-next]");
    const status = findOne("[data-carousel-status]");
    const toggle = findOne("[data-carousel-toggle]");
    const toggleIcon = findOne("[data-carousel-toggle-icon]");
    const toggleLabel = findOne("[data-carousel-toggle-label]");

    if (slides.length === 0) return null;

    const classActiveIndex = slides.findIndex((slide) => (
      slide.classList.contains("is-active")
    ));
    const visibleIndex = slides.findIndex((slide) => !slide.hidden);
    const initiallyActive = classActiveIndex === -1 ? visibleIndex : classActiveIndex;

    let activeIndex = initiallyActive === -1 ? 0 : initiallyActive;
    let autoplayTimer = null;
    let hoverPaused = false;
    let focusPaused = carousel.contains(document.activeElement);
    let userPaused = false;
    let touchStart = null;

    const dotTarget = (dot, fallbackIndex) => {
      const value = dot.getAttribute("data-carousel-dot");
      if (value === null || value.trim() === "") return fallbackIndex;

      const parsed = Number(value);
      return Number.isInteger(parsed) ? parsed : fallbackIndex;
    };

    const stopAutoplay = () => {
      if (autoplayTimer === null) return;
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    };

    const canAutoplay = () => (
      slides.length > 1
      && !userPaused
      && !hoverPaused
      && !focusPaused
      && !document.hidden
      && !reducedMotion.matches
    );

    const updateToggle = () => {
      if (!toggle) return;

      toggle.hidden = reducedMotion.matches || slides.length < 2;
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.setAttribute(
        "aria-label",
        userPaused ? "Resume automatic slide rotation" : "Pause automatic slide rotation"
      );

      if (toggleIcon) toggleIcon.textContent = userPaused ? "▶" : "Ⅱ";
      if (toggleLabel) toggleLabel.textContent = userPaused ? "Play" : "Pause";
    };

    const showSlide = (requestedIndex, { automatic = false } = {}) => {
      activeIndex = ((requestedIndex % slides.length) + slides.length) % slides.length;

      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.hidden = !isActive;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });

      dots.forEach((dot, index) => {
        const isActive = dotTarget(dot, index) === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));

        if (isActive) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });

      if (status) {
        const label = slides[activeIndex].dataset.carouselLabel || "";
        status.setAttribute("aria-live", automatic ? "off" : "polite");
        status.textContent = `${activeIndex + 1} / ${slides.length}${label ? ` · ${label}` : ""}`;
      }
    };

    const scheduleAutoplay = () => {
      stopAutoplay();
      if (!canAutoplay()) return;

      autoplayTimer = window.setTimeout(() => {
        autoplayTimer = null;
        showSlide(activeIndex + 1, { automatic: true });
        scheduleAutoplay();
      }, AUTOPLAY_DELAY);
    };

    const showManualSlide = (index) => {
      showSlide(index);
      scheduleAutoplay();
    };

    if (previous) {
      previous.addEventListener("click", () => showManualSlide(activeIndex - 1));
      previous.disabled = slides.length < 2;
    }

    if (next) {
      next.addEventListener("click", () => showManualSlide(activeIndex + 1));
      next.disabled = slides.length < 2;
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => showManualSlide(dotTarget(dot, index)));
    });

    if (toggle) {
      toggle.addEventListener("click", () => {
        userPaused = !userPaused;
        updateToggle();

        if (userPaused) stopAutoplay();
        else scheduleAutoplay();
      });
    }

    carousel.addEventListener("keydown", (event) => {
      if (event.target.closest("[data-carousel]") !== carousel) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showManualSlide(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showManualSlide(activeIndex + 1);
      }
    });

    carousel.addEventListener("mouseenter", () => {
      hoverPaused = true;
      stopAutoplay();
    });

    carousel.addEventListener("mouseleave", () => {
      hoverPaused = false;
      scheduleAutoplay();
    });

    carousel.addEventListener("focusin", () => {
      focusPaused = true;
      stopAutoplay();
    });

    carousel.addEventListener("focusout", (event) => {
      if (event.relatedTarget && carousel.contains(event.relatedTarget)) return;
      focusPaused = false;
      scheduleAutoplay();
    });

    carousel.addEventListener("touchstart", (event) => {
      if (event.target.closest("[data-carousel]") !== carousel) return;
      if (event.changedTouches.length === 0) return;
      const touch = event.changedTouches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    carousel.addEventListener("touchend", (event) => {
      if (event.target.closest("[data-carousel]") !== carousel) return;
      if (!touchStart || event.changedTouches.length === 0) return;

      const touch = event.changedTouches[0];
      const distanceX = touch.clientX - touchStart.x;
      const distanceY = touch.clientY - touchStart.y;
      touchStart = null;

      if (
        Math.abs(distanceX) < SWIPE_THRESHOLD
        || Math.abs(distanceX) <= Math.abs(distanceY)
      ) return;

      showManualSlide(activeIndex + (distanceX < 0 ? 1 : -1));
    }, { passive: true });

    carousel.addEventListener("touchcancel", () => {
      touchStart = null;
    }, { passive: true });

    const refreshAutoplay = () => {
      updateToggle();
      scheduleAutoplay();
    };

    showSlide(activeIndex, { automatic: true });
    updateToggle();
    scheduleAutoplay();

    return { refreshAutoplay };
  }).filter(Boolean);

  if (carouselControllers.length === 0) return;

  const refreshCarousels = () => {
    carouselControllers.forEach(({ refreshAutoplay }) => refreshAutoplay());
  };

  document.addEventListener("visibilitychange", refreshCarousels);

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", refreshCarousels);
  } else {
    reducedMotion.addListener(refreshCarousels);
  }
})();
