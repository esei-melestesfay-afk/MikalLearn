
(() => {
    "use strict";

    const DATA_URL = "/static/lasloop-data.json";
    const audioByWord = new Map();

    let dataReady = null;
    let activeOverlay = null;
    let activeAudio = null;
    let cleanupTimer = null;
    let holdActive = false;
    let syntheticActivation = false;

    const hiddenElements = new Map();


    /*
      LäsLoop-kärnan använder detta för att veta
      om nästa ord fortfarande är dolt medan
      bekräftelseljudet spelas.
    */
    window.MikalLasLoopConfirmation = {
        isHolding: () => holdActive
    };

    function normalizeWord(value) {
        return String(value || "")
            .trim()
            .replace(/\s+/g, " ")
            .toLocaleLowerCase("sv-SE");
    }

    function looksLikeAudio(value) {
        if (typeof value !== "string") return false;
        const lower = value.toLowerCase();

        return (
            lower.includes("/static/")
            || lower.endsWith(".mp3")
            || lower.endsWith(".wav")
            || lower.endsWith(".ogg")
            || lower.endsWith(".m4a")
        );
    }

    function resolveAudioUrl(value) {
        try {
            return new URL(value, window.location.origin).href;
        } catch {
            return value;
        }
    }

    function addPair(word, audio) {
        if (typeof word !== "string" || !looksLikeAudio(audio)) return;

        const key = normalizeWord(word);

        if (!key || key.includes(" ")) return;

        if (!audioByWord.has(key)) {
            audioByWord.set(key, resolveAudioUrl(audio));
        }
    }

    function scanData(node, depth = 0) {
        if (node == null || depth > 8) return;

        if (Array.isArray(node)) {
            node.forEach(item => scanData(item, depth + 1));
            return;
        }

        if (typeof node !== "object") return;

        const word =
            node.word
            ?? node.ord
            ?? node.text
            ?? node.label
            ?? node.value;

        const audio =
            node.audio
            ?? node.audio_url
            ?? node.audioUrl
            ?? node.audio_file
            ?? node.audioFile
            ?? node.src
            ?? node.file
            ?? node.url;

        addPair(word, audio);

        for (const [key, value] of Object.entries(node)) {
            if (typeof value === "string" && looksLikeAudio(value)) {
                addPair(key, value);
            }
        }

        Object.values(node).forEach(
            value => scanData(value, depth + 1)
        );
    }

    async function loadData() {
        try {
            const response = await fetch(
                DATA_URL,
                { cache: "force-cache" }
            );

            if (!response.ok) {
                throw new Error("Kunde inte läsa LäsLoop-data.");
            }

            const data = await response.json();
            scanData(data);

            console.log(
                `[LäsLoop] ${audioByWord.size} ord redo för bekräftelseljud.`
            );
        } catch (error) {
            console.warn(
                "[LäsLoop] Kunde inte ladda ordljud:",
                error
            );
        }
    }

    dataReady = loadData();

    function isSingleWord(text) {
        return /^[A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäöÉéÜü'-]+$/u.test(text);
    }

    function candidateInfo(element) {
        if (!(element instanceof Element)) return null;
        if (element === activeOverlay) return null;

        const text = String(element.textContent || "").trim();

        if (!isSingleWord(text)) return null;

        const style = getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize) || 0;
        const rect = element.getBoundingClientRect();

        const interactive = (
            element.tagName === "BUTTON"
            || element.getAttribute("role") === "button"
            || style.cursor === "pointer"
            || typeof element.onclick === "function"
        );

        if (
            !interactive
            || fontSize < 30
            || rect.width < 35
            || rect.height < 25
            || rect.width > window.innerWidth * 0.95
            || rect.bottom < 0
            || rect.top > window.innerHeight
        ) {
            return null;
        }

        return {
            element,
            word: text,
            rect,
            style
        };
    }

    function clickableLargeWord(start) {
        let element =
            start instanceof Element
                ? start
                : start?.parentElement;

        let steps = 0;

        while (
            element
            && element !== document.body
            && steps < 7
        ) {
            const info = candidateInfo(element);

            if (info) return info;

            element = element.parentElement;
            steps += 1;
        }

        return null;
    }

    function findCurrentWord() {
        const selectors = [
            "button",
            "[role='button']",
            "[onclick]",
            ".word",
            ".big-word",
            ".current-word",
            ".lasloop-word",
            ".word-button"
        ];

        const elements = [
            ...document.querySelectorAll(
                selectors.join(",")
            )
        ];

        let best = null;

        for (const element of elements) {
            const info = candidateInfo(element);

            if (!info) continue;

            const score =
                (parseFloat(info.style.fontSize) || 0)
                + Math.min(info.rect.width, 500) / 25
                + Math.min(info.rect.height, 250) / 25;

            if (!best || score > best.score) {
                best = {
                    ...info,
                    score
                };
            }
        }

        return best;
    }

    function findBackground(element) {
        let current = element;

        while (
            current
            && current !== document.documentElement
        ) {
            const style = getComputedStyle(current);
            const color = style.backgroundColor;
            const image = style.backgroundImage;

            if (image && image !== "none") {
                return { color, image };
            }

            if (
                color
                && color !== "transparent"
                && color !== "rgba(0, 0, 0, 0)"
            ) {
                return { color, image: "none" };
            }

            current = current.parentElement;
        }

        return {
            color: "#ffffff",
            image: "none"
        };
    }

    function hideElement(element) {
        if (
            !(element instanceof Element)
            || element === activeOverlay
            || hiddenElements.has(element)
        ) {
            return;
        }

        hiddenElements.set(
            element,
            element.style.visibility
        );

        element.style.visibility = "hidden";
    }

    function hideLiveWord() {
        if (!holdActive) return;

        const current = findCurrentWord();

        if (current) {
            hideElement(current.element);
        }
    }

    const holdObserver = new MutationObserver(() => {
        if (holdActive) {
            hideLiveWord();
        }
    });

    function restoreHiddenWords() {
        for (const [element, oldVisibility] of hiddenElements.entries()) {
            if (element.isConnected) {
                element.style.visibility = oldVisibility;
            }
        }

        hiddenElements.clear();
    }

    function clearActive() {
        const wasHolding = holdActive;

        holdActive = false;

        if (cleanupTimer) {
            clearTimeout(cleanupTimer);
            cleanupTimer = null;
        }

        if (activeAudio) {
            try {
                activeAudio.pause();
                activeAudio.currentTime = 0;
            } catch {
            }

            activeAudio = null;
        }

        if (activeOverlay) {
            activeOverlay.remove();
            activeOverlay = null;
        }

        restoreHiddenWords();

        if (wasHolding) {
            document.dispatchEvent(
                new CustomEvent(
                    "mikal-lasloop-confirmation-finished"
                )
            );
        }
    }

    function makeOverlay(info) {
        clearActive();

        const {
            element,
            word,
            rect,
            style
        } = info;

        const background = findBackground(element);

        const overlay = document.createElement("div");

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        overlay.textContent = word;

        Object.assign(
            overlay.style,
            {
                position: "fixed",
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                zIndex: "2147483647",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",

                color: style.color,
                backgroundColor: background.color,
                backgroundImage: background.image,

                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                fontStyle: style.fontStyle,
                letterSpacing: style.letterSpacing,
                lineHeight: style.lineHeight,
                textAlign: "center",

                borderRadius: style.borderRadius,
                border: style.border,
                boxShadow: style.boxShadow,

                opacity: "1",
                transform: "none",
                transition: "none"
            }
        );

        document.body.appendChild(overlay);

        activeOverlay = overlay;
        holdActive = true;

        /*
          Dölj den riktiga ord-knappen direkt.
          Overlayn visar fortfarande det gamla ordet.
          När LäsLoop byter till nästa ord är det
          ordet också dolt tills ljudet är klart.
        */
        hideElement(element);
        hideLiveWord();

        return overlay;
    }

    async function sayThenReveal(word, overlay) {
        await Promise.race([
            dataReady,
            new Promise(resolve =>
                setTimeout(resolve, 300)
            )
        ]);

        if (overlay !== activeOverlay) return;

        const src =
            audioByWord.get(
                normalizeWord(word)
            );

        if (!src) {
            cleanupTimer =
                setTimeout(
                    clearActive,
                    40
                );

            return;
        }

        const audio = new Audio(src);

        activeAudio = audio;
        audio.preload = "auto";
        audio.playbackRate = 1.18;

        let finished = false;

        const finish = () => {
            if (finished) return;

            finished = true;

            cleanupTimer =
                setTimeout(
                    clearActive,
                    10
                );
        };

        audio.addEventListener(
            "ended",
            finish,
            { once: true }
        );

        audio.addEventListener(
            "error",
            finish,
            { once: true }
        );

        try {
            const promise = audio.play();

            if (
                promise
                && typeof promise.catch === "function"
            ) {
                promise.catch(finish);
            }
        } catch {
            finish();
        }

        cleanupTimer =
            setTimeout(
                finish,
                1800
            );
    }

    function startConfirmation(info) {
        if (!info || holdActive) return;

        const overlay = makeOverlay(info);

        queueMicrotask(() => {
            hideLiveWord();

            sayThenReveal(
                info.word,
                overlay
            );
        });
    }

    /*
      MUS / TOUCH:
      Vanliga klicket får fortsätta till LäsLoop
      så att svaret räknas direkt precis som innan.
    */
    document.addEventListener(
        "click",
        event => {
            if (
                (!event.isTrusted && !syntheticActivation)
                || event.button > 0
            ) {
                return;
            }

            const info =
                clickableLargeWord(
                    event.target
                );

            if (!info) return;

            startConfirmation(info);
        },
        true
    );

    /*
      SPACE:
      Mellanslag gör exakt samma sak som att
      klicka på det stora ordet med musen.
      Vi stoppar också webbläsarens vanliga
      scroll med Space.
    */
    document.addEventListener(
        "keydown",
        event => {
            if (
                event.code !== "Space"
                || event.repeat
                || holdActive
            ) {
                return;
            }

            const target = event.target;

            if (
                target instanceof HTMLInputElement
                || target instanceof HTMLTextAreaElement
                || target instanceof HTMLSelectElement
                || target?.isContentEditable
            ) {
                return;
            }

            const info = findCurrentWord();

            if (!info) return;

            event.preventDefault();
            event.stopPropagation();

            syntheticActivation = true;

            try {
                info.element.click();
            } finally {
                syntheticActivation = false;
            }
        },
        true
    );

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            holdObserver.observe(
                document.body,
                {
                    childList: true,
                    subtree: true,
                    characterData: true
                }
            );
        }
    );

})();
