(() => {
  const CONSUMED_STORAGE_KEY = "consumedInviteCodes";
  const code = sessionStorage.getItem("activeInviteCode");
  const data = code ? MESSAGE_DATABASE[code] : null;

  if (!data || isInviteConsumed(code)) {
    if (code && isInviteConsumed(code)) {
      sessionStorage.setItem("consumedNotice", data?.name || "This ticket");
    }
    sessionStorage.removeItem("activeInviteCode");
    window.location.replace("index.html");
    return;
  }

  const THEME_EXTRAS = {
    eulalie: {
      transitionCaption: "Butterflies part the air for one last letter from our KKN days."
    },
    iliad: {
      transitionCaption: "A warm light opens for a memory from the days we shared."
    },
    ostara: {
      transitionCaption: "Petals gather around a thank-you from our KKN story."
    },
    minouet: {
      transitionCaption: "Clouds drift apart as our KKN days settle into memory."
    },
    sotb: {
      transitionCaption: "A sunset clears the page for one last note before we go."
    }
  };

  const extras = THEME_EXTRAS[data.theme] || THEME_EXTRAS.eulalie;

  const body = document.body;
  const title = document.getElementById("messageTitle");
  const subtitle = document.getElementById("messageSubtitle");
  const letterDate = document.getElementById("letterDate");
  const greeting = document.getElementById("letterGreeting");
  const letterBody = document.getElementById("letterBody");
  const pauseScene = document.getElementById("pauseScene");
  const pauseQuote = document.getElementById("pauseQuote");
  const pauseCaption = document.getElementById("pauseCaption");
  const closing = document.getElementById("closingText");
  const signature = document.getElementById("signatureName");
  const finalNote = document.getElementById("finalNote");
  const finalEcho = document.getElementById("finalEcho");
  const themeLabel = document.getElementById("themeLabel");
  const introThemeLabel = document.getElementById("introThemeLabel");
  const letterThemeLabel = document.getElementById("letterThemeLabel");
  const envelope = document.getElementById("openLetterButton");
  const openTextButton = document.getElementById("openTextButton");
  const introScene = document.getElementById("introScene");
  const letterScene = document.getElementById("letterScene");
  const themeTransition = document.getElementById("themeTransition");
  const transitionCaption = document.getElementById("transitionCaption");
  const finishReadingButton = document.getElementById("finishReadingButton");
  const finishDialog = document.getElementById("finishDialog");
  const keepReadingButton = document.getElementById("keepReadingButton");
  const confirmFinishButton = document.getElementById("confirmFinishButton");
  const eraseDust = document.getElementById("eraseDust");
  const goodbyeScreen = document.getElementById("goodbyeScreen");
  const privacyShield = document.getElementById("privacyShield");
  const privacyNotice = document.getElementById("privacyNotice");
  const backgroundMusic = document.getElementById("backgroundMusic");
  const musicToggle = document.getElementById("musicToggle");
  const letterCard = document.querySelector(".letter-card");

  let isTransitioning = false;
  let isErasing = false;
  let lastFocusedElement = null;
  const MUSIC_TARGET_VOLUME = 0.16;
  let musicFadeFrame = null;
  let musicHasStarted = false;
  let musicMutedByUser = false;
  let musicPausedForVisibility = false;

  body.dataset.theme = data.theme;
  body.dataset.design = data.design || "warm-home";

  const transitionState = sessionStorage.getItem("pageTransitionState");
  if (transitionState === "from-landing") {
    body.classList.add("page-transition-in");
    window.setTimeout(() => body.classList.add("page-transition-in-ready"), 30);
    window.setTimeout(() => {
      body.classList.remove("page-transition-in", "page-transition-in-ready");
      sessionStorage.removeItem("pageTransitionState");
    }, 1100);
  }

  document.title = `Farewell Letter for ${data.name}`;
  body.dataset.recipient = data.name;
  if (letterCard) {
    letterCard.dataset.watermark = `KKN FAREWELL • ${data.name.toUpperCase()} • PERSONAL`;
    letterCard.dataset.designLabel = data.designLabel || "KKN FAREWELL";
    const decor = document.createElement("div");
    decor.className = "recipient-decor";
    decor.setAttribute("aria-hidden", "true");
    decor.innerHTML = '<span class="decor-a"></span><span class="decor-b"></span><span class="decor-c"></span><span class="decor-d"></span>';
    letterCard.appendChild(decor);
  }
  title.textContent = data.name;
  subtitle.textContent = data.subtitle;
  letterDate.textContent = data.date;
  greeting.textContent = data.greeting;
  closing.textContent = data.closing || "";
  signature.textContent = data.signature || "";
  if (finalNote) finalNote.textContent = "";
  if (finalEcho) finalEcho.textContent = "";
  themeLabel.textContent = data.themeLabel;
  introThemeLabel.textContent = data.themeLabel;
  letterThemeLabel.textContent = data.designLabel || data.themeLabel;
  if (pauseQuote) pauseQuote.textContent = "";
  if (pauseCaption) pauseCaption.textContent = "";
  transitionCaption.textContent = extras.transitionCaption;

  const letterClosing = closing.closest(".letter-closing");
  if (letterClosing && !data.closing && !data.signature) letterClosing.style.display = "none";
  if (pauseScene) pauseScene.style.display = "none";
  if (finalNote) finalNote.style.display = "none";
  if (finalEcho) finalEcho.style.display = "none";

  buildLetterFlow(data.paragraphs);
  createParticles();
  setupSceneReveal();
  setupPrivacyProtection();

  envelope.addEventListener("click", () => {
    startBackgroundMusic();
    beginOpenSequence(1320);
  });
  openTextButton.addEventListener("click", () => {
    startBackgroundMusic();
    beginOpenSequence(1160);
  });

  if (backgroundMusic) {
    backgroundMusic.volume = 0;
  }

  if (musicToggle) {
    musicToggle.addEventListener("click", toggleBackgroundMusic);
  }

  document.addEventListener("visibilitychange", () => {
    if (!backgroundMusic || !musicHasStarted || musicMutedByUser) return;

    if (document.hidden && !backgroundMusic.paused) {
      musicPausedForVisibility = true;
      backgroundMusic.pause();
    } else if (!document.hidden && musicPausedForVisibility) {
      musicPausedForVisibility = false;
      backgroundMusic.play().catch(() => {});
    }
  });

  finishReadingButton.addEventListener("click", openFinishDialog);
  keepReadingButton.addEventListener("click", closeFinishDialog);
  confirmFinishButton.addEventListener("click", eraseMessageForever);

  finishDialog.addEventListener("click", (event) => {
    if (event.target.matches("[data-dialog-close]")) closeFinishDialog();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && finishDialog.classList.contains("active") && !isErasing) {
      closeFinishDialog();
    }
  });

  function startBackgroundMusic() {
    if (!backgroundMusic || musicMutedByUser) return;

    if (musicHasStarted && !backgroundMusic.paused) return;
    musicHasStarted = true;
    musicPausedForVisibility = false;
    backgroundMusic.volume = 0;

    const playPromise = backgroundMusic.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          fadeMusicTo(MUSIC_TARGET_VOLUME, 2400);
          updateMusicToggle(true);
        })
        .catch(() => {
          updateMusicToggle(false);
        });
    }
  }

  function toggleBackgroundMusic() {
    if (!backgroundMusic) return;

    if (!musicHasStarted) {
      musicMutedByUser = false;
      startBackgroundMusic();
      return;
    }

    if (backgroundMusic.paused || musicMutedByUser) {
      musicMutedByUser = false;
      backgroundMusic.play()
        .then(() => {
          fadeMusicTo(MUSIC_TARGET_VOLUME, 900);
          updateMusicToggle(true);
        })
        .catch(() => updateMusicToggle(false));
    } else {
      musicMutedByUser = true;
      fadeMusicTo(0, 500, () => {
        backgroundMusic.pause();
        updateMusicToggle(false);
      });
    }
  }

  function updateMusicToggle(isPlaying) {
    if (!musicToggle) return;
    musicToggle.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    musicToggle.title = isPlaying ? "Pause background music" : "Play background music";
  }

  function fadeMusicTo(targetVolume, duration = 1000, onComplete = null) {
    if (!backgroundMusic) return;
    if (musicFadeFrame) cancelAnimationFrame(musicFadeFrame);

    const startVolume = backgroundMusic.volume;
    const safeTarget = Math.max(0, Math.min(1, targetVolume));
    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startedAt) / Math.max(duration, 1), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      backgroundMusic.volume = startVolume + (safeTarget - startVolume) * eased;

      if (progress < 1) {
        musicFadeFrame = requestAnimationFrame(step);
      } else {
        musicFadeFrame = null;
        backgroundMusic.volume = safeTarget;
        if (typeof onComplete === "function") onComplete();
      }
    };

    musicFadeFrame = requestAnimationFrame(step);
  }

  function buildLetterFlow(paragraphs) {
    letterBody.innerHTML = "";
    const beforePause = paragraphs.slice(0, 2);
    const afterPause = paragraphs.slice(2, 4);
    const finale = paragraphs.slice(4);
    const blocks = [beforePause, afterPause, finale].filter((group) => group.length);

    blocks.forEach((group, index) => {
      const section = document.createElement("section");
      section.className = "message-section reveal-block";
      section.setAttribute("data-block", `${index + 1}`);

      group.forEach((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        section.appendChild(paragraph);
      });

      letterBody.appendChild(section);
    });
  }

  function beginOpenSequence(delay) {
    if (isTransitioning) return;
    isTransitioning = true;
    body.classList.add("transition-playing");
    envelope.classList.add("opened");
    themeTransition.classList.add("active");
    themeTransition.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      introScene.classList.add("leaving");
      themeTransition.classList.add("soften");
    }, Math.max(180, delay - 560));

    window.setTimeout(showLetter, delay);
  }

  function showLetter() {
    body.classList.add("letter-opened");
    letterScene.style.display = "block";
    letterScene.classList.add("preparing");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        letterScene.classList.add("visible");
        letterScene.setAttribute("aria-hidden", "false");

        const sections = [...letterBody.querySelectorAll(".message-section")];
        sections.forEach((section, sectionIndex) => {
          window.setTimeout(() => {
            section.classList.add("visible");
            section.querySelectorAll("p").forEach((paragraph, paragraphIndex) => {
              window.setTimeout(() => paragraph.classList.add("visible"), paragraphIndex * 90);
            });
          }, 180 + sectionIndex * 220);
        });
      });
    });

    window.setTimeout(() => themeTransition.classList.add("dissolve"), 220);

    window.setTimeout(() => {
      introScene.style.display = "none";
      themeTransition.classList.remove("active", "soften", "dissolve");
      themeTransition.setAttribute("aria-hidden", "true");
      body.classList.remove("transition-playing");
      window.scrollTo({ top: 0, behavior: "smooth" });
      isTransitioning = false;
    }, 1200);
  }

  function setupSceneReveal() {
    const targets = [...document.querySelectorAll(".reveal-block, .after-message")];
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px"
    });

    targets.forEach((target) => observer.observe(target));
  }

  function openFinishDialog() {
    if (isErasing) return;
    lastFocusedElement = document.activeElement;
    finishDialog.classList.add("active");
    finishDialog.setAttribute("aria-hidden", "false");
    body.classList.add("dialog-open");
    window.setTimeout(() => keepReadingButton.focus(), 120);
  }

  function closeFinishDialog() {
    if (isErasing) return;
    finishDialog.classList.remove("active");
    finishDialog.setAttribute("aria-hidden", "true");
    body.classList.remove("dialog-open");
    lastFocusedElement?.focus();
  }

  function eraseMessageForever() {
    if (isErasing) return;
    isErasing = true;
    confirmFinishButton.disabled = true;
    keepReadingButton.disabled = true;
    markInviteConsumed(code);
    sessionStorage.removeItem("activeInviteCode");
    sessionStorage.setItem("consumedNotice", data.name);

    finishDialog.classList.add("confirming");
    createEraseDust();
    if (backgroundMusic && !backgroundMusic.paused) {
      fadeMusicTo(0, 2600, () => backgroundMusic.pause());
      updateMusicToggle(false);
    }

    window.setTimeout(() => {
      finishDialog.classList.remove("active");
      finishDialog.setAttribute("aria-hidden", "true");
      body.classList.remove("dialog-open");
      body.classList.add("message-erasing");
      letterScene.classList.add("erasing");

      const disappearingItems = [
        ...letterScene.querySelectorAll(".letter-topline, .letter-greeting, .message-section p, .letter-closing, .letter-poster-band, .letter-side-title, .completion-panel")
      ]
        .filter((item) => item.getClientRects().length > 0)
        .sort((first, second) => {
          const firstTop = first.getBoundingClientRect().top + window.scrollY;
          const secondTop = second.getBoundingClientRect().top + window.scrollY;
          return secondTop - firstTop;
        });

      disappearingItems.forEach((item, index) => {
        item.style.setProperty("--erase-delay", `${Math.min(index * 68, 1650)}ms`);
        item.classList.add("erase-item");
      });

      startEraseAutoScroll(2800);
    }, 420);

    window.setTimeout(() => {
      goodbyeScreen.classList.add("active");
      goodbyeScreen.setAttribute("aria-hidden", "false");
    }, 3400);

    window.setTimeout(() => {
      window.location.replace("index.html");
    }, 4750);
  }

  function startEraseAutoScroll(duration = 2800) {
    const startY = window.scrollY;
    const sceneTop = letterScene.getBoundingClientRect().top + window.scrollY;
    const targetY = Math.max(0, sceneTop - 18);
    const distance = targetY - startY;

    if (Math.abs(distance) < 12) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      window.scrollTo(0, targetY);
      return;
    }

    document.documentElement.classList.add("erase-auto-scrolling");
    const startedAt = performance.now();

    const easeInOutCubic = (progress) => (
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
    );

    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        document.documentElement.classList.remove("erase-auto-scrolling");
      }
    };

    window.requestAnimationFrame(step);
  }

  function createEraseDust() {
    const count = window.innerWidth < 700 ? 42 : 76;
    eraseDust.innerHTML = "";
    eraseDust.classList.add("active");

    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("span");
      const x = 12 + Math.random() * 76;
      const y = 12 + Math.random() * 76;
      const driftX = -80 + Math.random() * 160;
      const driftY = -90 - Math.random() * 150;
      const size = 2 + Math.random() * 7;
      const delay = Math.random() * 0.85;
      const duration = 1.15 + Math.random() * 1.15;

      particle.style.setProperty("--dust-x", `${x}vw`);
      particle.style.setProperty("--dust-y", `${y}vh`);
      particle.style.setProperty("--dust-dx", `${driftX}px`);
      particle.style.setProperty("--dust-dy", `${driftY}px`);
      particle.style.setProperty("--dust-size", `${size}px`);
      particle.style.setProperty("--dust-delay", `${delay}s`);
      particle.style.setProperty("--dust-duration", `${duration}s`);
      eraseDust.appendChild(particle);
    }
  }

  function setupPrivacyProtection() {
    const protectedArea = letterScene;
    const blockedShortcuts = new Set(["c", "x", "a", "s", "p", "u"]);
    let noticeTimer = null;
    let blurTimer = null;

    protectedArea.addEventListener("contextmenu", blockPrivateAction);
    protectedArea.addEventListener("copy", blockPrivateAction);
    protectedArea.addEventListener("cut", blockPrivateAction);
    protectedArea.addEventListener("dragstart", blockPrivateAction);
    protectedArea.addEventListener("selectstart", (event) => {
      if (!event.target.closest("button")) event.preventDefault();
    });

    document.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      const shortcutPressed = event.ctrlKey || event.metaKey;

      if (shortcutPressed && blockedShortcuts.has(key)) {
        event.preventDefault();
        showPrivacyNotice(
          key === "p"
            ? "Printing this personal farewell letter is disabled."
            : "This personal farewell letter cannot be copied or saved."
        );
      }

      if (event.key === "PrintScreen") {
        event.preventDefault();
        brieflyObscureMessage("Screen capture is discouraged for this personal farewell letter.");
        tryClearClipboard();
      }
    }, true);

    window.addEventListener("keyup", (event) => {
      if (event.key === "PrintScreen") {
        brieflyObscureMessage("Screen capture is discouraged for this personal farewell letter.");
        tryClearClipboard();
      }
    }, true);

    window.addEventListener("blur", () => setPrivacyShield(true));
    window.addEventListener("focus", () => setPrivacyShield(false));

    document.addEventListener("visibilitychange", () => {
      setPrivacyShield(document.hidden);
    });

    function blockPrivateAction(event) {
      event.preventDefault();
      showPrivacyNotice("This personal farewell letter cannot be copied.");
    }

    function showPrivacyNotice(message) {
      if (!privacyNotice) return;
      privacyNotice.textContent = message;
      privacyNotice.classList.add("active");
      window.clearTimeout(noticeTimer);
      noticeTimer = window.setTimeout(() => privacyNotice.classList.remove("active"), 1900);
    }

    function setPrivacyShield(isActive) {
      if (!privacyShield || isErasing) return;
      body.classList.toggle("privacy-obscured", isActive);
      privacyShield.classList.toggle("active", isActive);
      privacyShield.setAttribute("aria-hidden", String(!isActive));
    }

    function brieflyObscureMessage(message) {
      showPrivacyNotice(message);
      body.classList.add("privacy-obscured");
      window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        if (!document.hidden && document.hasFocus()) body.classList.remove("privacy-obscured");
      }, 1300);
    }

    async function tryClearClipboard() {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText("");
        }
      } catch (error) {
        // Clipboard access is browser-controlled and may be unavailable.
      }
    }
  }

  function createParticles() {
    const container = document.getElementById("particles");
    const particleCount = window.innerWidth < 700 ? 18 : 32;

    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${10 + Math.random() * 16}s`;
      particle.style.animationDelay = `${Math.random() * -20}s`;
      particle.style.opacity = `${0.25 + Math.random() * 0.65}`;
      particle.style.width = `${2 + Math.random() * 4}px`;
      particle.style.height = particle.style.width;
      container.appendChild(particle);
    }
  }

  function readConsumedInvites() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONSUMED_STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function isInviteConsumed(inviteCode) {
    if (!inviteCode) return false;
    const consumed = readConsumedInvites();
    return Boolean(consumed[inviteCode]);
  }

  function markInviteConsumed(inviteCode) {
    try {
      const consumed = readConsumedInvites();
      consumed[inviteCode] = {
        consumedAt: new Date().toISOString(),
        recipient: data.name
      };
      localStorage.setItem(CONSUMED_STORAGE_KEY, JSON.stringify(consumed));
    } catch (error) {
      // The visual ending still works even when storage is unavailable.
    }
  }
})();
