/* =========================================================
   MIKALLEARN AI TTS
   OpenAI server-side voice
========================================================= */

window.MikalTTS = (() => {

    const audioCache =
        new Map();


    let currentAudio =
        null;


    let statusElement =
        null;


    /* =====================================================
       STATUS
    ===================================================== */

    function ensureStatus() {

        if (statusElement) {

            return statusElement;

        }


        statusElement =
            document.createElement(
                "div"
            );


        statusElement.id =
            "mikalAiVoiceStatus";


        statusElement.className =
            "mikal-ai-status";


        document.body.appendChild(
            statusElement
        );


        return statusElement;

    }


    function setStatus(
        text,
        type = ""
    ) {

        const element =
            ensureStatus();


        element.textContent =
            text;


        element.className =
            (
                "mikal-ai-status "
                +
                type
            );


        if (
            type === "ok"
        ) {

            clearTimeout(
                element.hideTimer
            );


            element.hideTimer =
                setTimeout(
                    () => {

                        element.classList.add(
                            "hide"
                        );

                    },
                    1800
                );

        }
        else {

            element.classList.remove(
                "hide"
            );

        }

    }


    /* =====================================================
       GET AUDIO
    ===================================================== */

    async function getAudioURL(
        text,
        mode
    ) {

        const key =
            mode
            +
            "::"
            +
            text;


        if (
            audioCache.has(
                key
            )
        ) {

            return audioCache.get(
                key
            );

        }


        const response =
            await fetch(
                "/api/tts",
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            text:
                                text,

                            mode:
                                mode
                        })

                }
            );


        if (!response.ok) {

            let message =
                "AI-rösten kunde inte spelas.";


            try {

                const data =
                    await response.json();


                if (data.error) {

                    message =
                        data.error;

                }

            }
            catch {
            }


            throw new Error(
                message
            );

        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(
                blob
            );


        audioCache.set(
            key,
            url
        );


        return url;

    }


    /* =====================================================
       PLAY
    ===================================================== */

    async function play(
        text,
        mode = "normal"
    ) {

        if (!text) {
            return;
        }


        try {

            if (currentAudio) {

                currentAudio.pause();

                currentAudio.currentTime =
                    0;

            }


            setStatus(
                mode === "slow"
                    ? "Skapar långsam AI-röst..."
                    : "Skapar tydlig AI-röst...",
                "loading"
            );


            const url =
                await getAudioURL(
                    text,
                    mode
                );


            const audio =
                new Audio(
                    url
                );


            currentAudio =
                audio;


            /* MAX VOLYM */

            audio.volume =
                1.0;


            audio.addEventListener(
                "playing",
                () => {

                    setStatus(
                        mode === "slow"
                            ? "🎧 AI-röst • långsam"
                            : "🎧 AI-röst • tydlig",
                        "ok"
                    );

                }
            );


            audio.addEventListener(
                "error",
                () => {

                    setStatus(
                        "Kunde inte spela ljudet.",
                        "error"
                    );

                }
            );


            await audio.play();

        }

        catch (error) {

            console.error(
                "MikalTTS:",
                error
            );


            setStatus(
                error.message
                ||
                "AI-rösten kunde inte spelas.",
                "error"
            );

        }

    }


    /* =====================================================
       DISCLOSURE
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            const host =
                document.querySelector(
                    ".listening-panel, .word-v2-main"
                );


            if (
                host &&
                !document.getElementById(
                    "aiVoiceDisclosure"
                )
            ) {

                const disclosure =
                    document.createElement(
                        "div"
                    );


                disclosure.id =
                    "aiVoiceDisclosure";


                disclosure.className =
                    "ai-voice-disclosure";


                disclosure.innerHTML =
                    "✨ Rösten är AI-genererad och inte en mänsklig inspelning.";


                host.insertBefore(
                    disclosure,
                    host.firstChild
                );

            }

        }
    );


    return {
        play
    };

})();


/* =========================================================
   DESIGN
========================================================= */

(() => {

    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        .ai-voice-disclosure {
            margin-bottom: 18px;
            padding: 10px 13px;

            color: #666b79;
            background: #f5f5fb;

            border: 1px solid #e8e8f1;
            border-radius: 11px;

            font-size: 10px;
            line-height: 1.5;
        }


        .mikal-ai-status {
            position: fixed;

            left: 50%;
            bottom: 26px;

            z-index: 99999;

            transform:
                translateX(-50%);

            padding:
                11px 16px;

            color: white;
            background: #222431;

            border-radius: 12px;

            box-shadow:
                0 13px 35px
                rgba(20, 23, 31, .22);

            font-family:
                inherit;

            font-size: 11px;
            font-weight: 750;

            opacity: 1;

            transition:
                opacity .25s ease;
        }


        .mikal-ai-status.loading {
            background: #5657dc;
        }


        .mikal-ai-status.error {
            background: #a8463c;
        }


        .mikal-ai-status.ok {
            background: #252833;
        }


        .mikal-ai-status.hide {
            opacity: 0;

            pointer-events: none;
        }

    `;


    document.head.appendChild(
        style
    );

})();
