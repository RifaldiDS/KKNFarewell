(() => {
  const form = document.getElementById("inviteForm");
  const codeInput = document.getElementById("inviteCode");
  const formMessage = document.getElementById("formMessage");
  const submitButton = document.getElementById("submitButton");
  const buttonLabel = submitButton?.querySelector(".button-label");
  const buttonArrow = submitButton?.querySelector(".button-arrow");
  const successOverlay = document.getElementById("successOverlay");
  const guestName = document.getElementById("guestName");
  const inputWrap = document.querySelector(".input-wrap");
  const posterStage = document.getElementById("posterStage");
  const defaultButtonLabel = buttonLabel?.textContent || "OPEN";
  const defaultButtonArrow = buttonArrow?.textContent || "↗";
  const CONSUMED_STORAGE_KEY = "consumedInviteCodes";
  const ownerResetButton = document.getElementById("ownerResetButton");
  let feedbackTimer = null;

  const normalizeCode = (value) => value.trim().toUpperCase().replace(/\s+/g, "");

  // Clear stale feedback restored by browser back/forward cache.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && formMessage) {
      clearFeedback();
    }
  });

  const consumedNotice = sessionStorage.getItem("consumedNotice");
  if (consumedNotice) {
    showConsumedError(`${consumedNotice}'s farewell letter has already closed.`, false);
    sessionStorage.removeItem("consumedNotice");
  }


  if (ownerResetButton) {
    ownerResetButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const confirmed = window.confirm(
        "Reset all one-time read records stored in this browser?\n\nAll Ticket No. codes will be available again on this browser."
      );

      if (!confirmed) return;

      localStorage.removeItem(CONSUMED_STORAGE_KEY);
      sessionStorage.removeItem("activeInviteCode");
      sessionStorage.removeItem("consumedNotice");

      // Owner maintenance stays silent and separate from invitation validation.
      clearFeedback();
      codeInput.value = "";
      submitButton.disabled = false;
      submitButton.classList.remove("checking");
      buttonLabel.textContent = defaultButtonLabel;
      buttonArrow.textContent = defaultButtonArrow;
    });
  }

  if (codeInput) {
    codeInput.addEventListener("input", () => {
      const caretPosition = codeInput.selectionStart;
      codeInput.value = codeInput.value.toUpperCase();
      codeInput.setSelectionRange(caretPosition, caretPosition);

      clearFeedback();
    });

    codeInput.addEventListener("focus", () => {
      window.setTimeout(() => {
        form?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    });
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const code = normalizeCode(codeInput.value);

      if (!code) {
        showError("Enter your Ticket No. first.");
        return;
      }

      setCheckingState(true);

      window.setTimeout(() => {
        const recipient = MESSAGE_DATABASE[code];

        if (!recipient) {
          setCheckingState(false);
          showError("This Ticket No. was not recognized. Please check it once more.");
          return;
        }

        if (isInviteConsumed(code)) {
          setCheckingState(false);
          showConsumedError("This farewell letter has already been read and is no longer available.");
          return;
        }

        formMessage.textContent = "Ticket found.";
        formMessage.classList.add("success");
        sessionStorage.setItem("activeInviteCode", code);
        guestName.textContent = recipient.name;
        document.body.classList.add("invite-accepted");
        successOverlay.classList.add("active");
        successOverlay.setAttribute("aria-hidden", "false");

        window.setTimeout(() => {
          document.body.classList.add("page-transition-out");
          successOverlay.classList.add("handoff");
          sessionStorage.setItem("pageTransitionState", "from-landing");
        }, 980);

        window.setTimeout(() => {
          window.location.href = "message.html";
        }, 1900);
      }, 560);
    });
  }

  function setCheckingState(isChecking) {
    if (isChecking) clearFeedbackTimer();
    submitButton.disabled = isChecking;
    submitButton.classList.toggle("checking", isChecking);
    buttonLabel.textContent = isChecking ? "CHECKING" : defaultButtonLabel;
    buttonArrow.textContent = isChecking ? "✦" : defaultButtonArrow;

    if (isChecking) {
      formMessage.textContent = "Checking your Ticket No.…";
      formMessage.classList.remove("success");
    }
  }

  function showError(message) {
    clearFeedbackTimer();
    formMessage.classList.remove("is-hiding", "success", "consumed", "auto-dismiss");
    formMessage.textContent = message;
    void formMessage.offsetWidth;
    formMessage.classList.add("auto-dismiss");
    inputWrap.classList.remove("error", "consumed");
    void inputWrap.offsetWidth;
    inputWrap.classList.add("error");
    codeInput.focus({ preventScroll: true });
    scheduleFeedbackClear();
  }

  function showConsumedError(message, selectInput = true) {
    clearFeedbackTimer();
    formMessage.classList.remove("is-hiding", "success", "auto-dismiss");
    formMessage.textContent = message;
    formMessage.classList.add("consumed");
    void formMessage.offsetWidth;
    formMessage.classList.add("auto-dismiss");
    inputWrap.classList.remove("error");
    inputWrap.classList.add("consumed");
    if (selectInput && codeInput.value) {
      codeInput.focus({ preventScroll: true });
      codeInput.select();
    }
    scheduleFeedbackClear(2400);
  }

  function scheduleFeedbackClear(delay = 2200) {
    clearFeedbackTimer();
    feedbackTimer = window.setTimeout(() => {
      formMessage.classList.add("is-hiding");
      window.setTimeout(() => clearFeedback(), 260);
    }, delay);
  }

  function clearFeedbackTimer() {
    if (feedbackTimer !== null) {
      window.clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
  }

  function clearFeedback() {
    clearFeedbackTimer();
    formMessage.classList.add("is-hiding");
    formMessage.textContent = "";
    formMessage.classList.remove("success", "consumed", "auto-dismiss");
    inputWrap.classList.remove("error", "consumed");
    window.setTimeout(() => formMessage.classList.remove("is-hiding"), 20);
  }

  function isInviteConsumed(inviteCode) {
    try {
      const consumed = JSON.parse(localStorage.getItem(CONSUMED_STORAGE_KEY) || "{}");
      return Boolean(consumed && consumed[inviteCode]);
    } catch (error) {
      return false;
    }
  }

  // A restrained parallax effect keeps the poster collage tactile without
  // making the page difficult to read. It is disabled for touch devices and
  // users who prefer reduced motion.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (posterStage && !reduceMotion && hasFinePointer) {
    const cards = [...posterStage.querySelectorAll(".poster-card")];

    posterStage.addEventListener("pointermove", (event) => {
      const rect = posterStage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      cards.forEach((card) => {
        const depth = Number(card.dataset.depth || 12);
        card.style.setProperty("--rx", `${(-y * depth * 0.32).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(x * depth * 0.32).toFixed(2)}deg`);
      });
    });

    posterStage.addEventListener("pointerleave", () => {
      cards.forEach((card) => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }
})();
