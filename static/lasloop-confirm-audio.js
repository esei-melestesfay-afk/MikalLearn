
(() => {
    "use strict";

    /*
      LäsLoop – säg ordet innan nästa ord visas.

      Viktigt:
      - Den vanliga LäsLoop-koden får fortfarande hantera klicket direkt.
        Då räknas ordet inom 10 sekunder precis som tidigare.
      - Vi lägger bara en kort visuell "gardin" ovanpå med det gamla ordet,
        spelar ordets befintliga MP3 och tar sedan bort gardinen.
      - Timeout utan klick påverkas inte alls.
    */

    const DATA_URL = "/static/lasloop-data.json";
    const audioByWord = new Map();

    let dataReady = null;
    let activeOverlay = null;
    let activeAudio = null;
    let cleanupTimer = null;

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
        if (typeof word !== "string" || !looksLikeAudio(audio)) {
            return;
        }

        const key = normalizeWord(word);

        if (!key || key.includes(" ")) {
            return;
        }

        if (!audioByWord.has(key)) {
            audioByWord.set(
                key,
                resolveAudioUrl(audio)
            );
        }
    }

    function scanData(node, depth = 0) {
        if (node == null || depth > 8) {
            return;
        }

        if (Array.isArray(node)) {
            node.forEach(item => scanData(item, depth + 1));
            return;
        }

        if (typeof node !== "object") {
            return;
        }

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

        /*
          Stöd även format som:
          {
            "hej": "/static/audio/hej.mp3",
            "jag": "/static/audio/jag.mp3"
          }
        */
        for (const [key, value] of Object.entries(node)) {
            if (
                typeof value === "string"
                && looksLikeAudio(value)
            ) {
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
                {
                    cache: "force-cache"
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Kunde inte läsa LäsLoop-data."
                );
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
        return /^[A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäöÉéÜü'-]+$/u
            .test(text);
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
            && steps < 6
        ) {
            const text = String(
                element.textContent || ""
            ).trim();

            const style =
                getComputedStyle(element);

            const fontSize =
                parseFloat(style.fontSize) || 0;

            const rect =
                element.getBoundingClientRect();

            const interactive = (
                element.tagName === "BUTTON"
                || element.getAttribute("role") === "button"
                || style.cursor === "pointer"
                || Boolean(
                    element.closest(
                        "button,[role='button']"
                    )
                )
            );

            if (
                interactive
                && fontSize >= 30
                && rect.width >= 35
                && rect.height >= 25
                && rect.width <= window.innerWidth * 0.95
                && isSingleWord(text)
            ) {
                return {
                    element,
                    word: text,
                    rect,
                    style
                };
            }

            element = element.parentElement;
            steps += 1;
        }

        return null;
    }

    function findBackground(element) {
        let current = element;

        while (
            current
            && current !== document.documentElement
        ) {
            const style =
                getComputedStyle(current);

            const color =
                style.backgroundColor;

            const image =
                style.backgroundImage;

            if (
                image
                && image !== "none"
            ) {
                return {
                    color,
                    image
                };
            }

            if (
                color
                && color !== "transparent"
                && color !== "rgba(0, 0, 0, 0)"
            ) {
                return {
                    color,
                    image: "none"
                };
            }

            current = current.parentElement;
        }

        return {
            color: "#ffffff",
            image: "none"
        };
    }

    function clearActive() {
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
    }

    function makeOverlay(info) {
        clearActive();

        const {
            element,
            word,
            rect,
            style
        } = info;

        const background =
            findBackground(element);

        const overlay =
            document.createElement("div");

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
                backgroundColor:
                    background.color,
                backgroundImage:
                    background.image,

                fontFamily:
                    style.fontFamily,
                fontSize:
                    style.fontSize,
                fontWeight:
                    style.fontWeight,
                fontStyle:
                    style.fontStyle,
                letterSpacing:
                    style.letterSpacing,
                lineHeight:
                    style.lineHeight,
                textAlign:
                    "center",

                borderRadius:
                    style.borderRadius,

                border:
                    style.border,

                boxShadow:
                    style.boxShadow,

                opacity: "1",
                transform: "none",
                transition: "none"
            }
        );

        document.body.appendChild(
            overlay
        );

        activeOverlay = overlay;

        return overlay;
    }

    async function sayThenReveal(
        word,
        overlay
    ) {
        /*
          Om JSON inte hunnit ladda klart
          väntar vi kort på den.
        */
        await Promise.race([
            dataReady,
            new Promise(resolve =>
                setTimeout(resolve, 350)
            )
        ]);

        if (
            overlay !== activeOverlay
        ) {
            return;
        }

        const src =
            audioByWord.get(
                normalizeWord(word)
            );

        if (!src) {
            /*
              Om något ord saknar ljud ska
              LäsLoop aldrig fastna.
            */
            cleanupTimer =
                setTimeout(
                    clearActive,
                    120
                );

            return;
        }

        const audio =
            new Audio(src);

        activeAudio = audio;

        audio.preload = "auto";
        audio.playbackRate = 1.0;

        let finished = false;

        const finish = () => {
            if (finished) return;

            finished = true;

            cleanupTimer =
                setTimeout(
                    clearActive,
                    90
                );
        };

        audio.addEventListener(
            "ended",
            finish,
            {
                once: true
            }
        );

        audio.addEventListener(
            "error",
            finish,
            {
                once: true
            }
        );

        try {
            const promise =
                audio.play();

            if (
                promise
                && typeof promise.catch === "function"
            ) {
                promise.catch(finish);
            }
        } catch {
            finish();
        }

        /*
          Säkerhetsgräns:
          ett trasigt MP3 får aldrig hålla
          kvar ordet på skärmen.
        */
        cleanupTimer =
            setTimeout(
                finish,
                2600
            );
    }

    /*
      Capture=true gör att vi hinner läsa
      det gamla ordet INNAN vanliga LäsLoop
      byter till nästa.

      Vi stoppar INTE klicket.
      Därför räknas svaret direkt och
      10-sekunderstimern fungerar som vanligt.
    */
    document.addEventListener(
        "click",
        event => {
            if (
                !event.isTrusted
                || event.button > 0
            ) {
                return;
            }

            const info =
                clickableLargeWord(
                    event.target
                );

            if (!info) {
                return;
            }

            const overlay =
                makeOverlay(info);

            /*
              Kör ljudet efter att klicket fått
              fortsätta till den vanliga LäsLoop-
              koden. Nästa ord ligger då redo
              bakom overlayn.
            */
            queueMicrotask(
                () => {
                    sayThenReveal(
                        info.word,
                        overlay
                    );
                }
            );
        },
        true
    );

})();
