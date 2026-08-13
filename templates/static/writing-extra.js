/* ==========================================
   MIKALLEARN - SKRIVA EXTRA
   Manuell "Ny text"-knapp
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (
            window.location.pathname !==
            "/skriva"
        ) {
            return;
        }


        const panel =
            document.getElementById("copy");

        const textBox =
            document.getElementById(
                "copyText"
            );

        const answer =
            document.getElementById(
                "copyAnswer"
            );

        const result =
            document.getElementById(
                "copyResult"
            );


        if (
            !panel ||
            !textBox ||
            !answer ||
            !result
        ) {
            return;
        }


        /* ==================================
           TA BORT GAMMAL AUTO-NY-TEXT
           men behåll Kontrollera-funktionen
        ================================== */

        const oldCheck =
            panel.querySelector(
                ".check-button"
            );


        if (!oldCheck) {
            return;
        }


        const checkButton =
            oldCheck.cloneNode(true);


        oldCheck.replaceWith(
            checkButton
        );


        /* ==================================
           KNAPPRAD
        ================================== */

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "writing-action-row";


        checkButton.parentNode.insertBefore(
            row,
            checkButton
        );


        row.appendChild(
            checkButton
        );


        const newButton =
            document.createElement(
                "button"
            );


        newButton.type =
            "button";


        newButton.className =
            "new-writing-button";


        newButton.innerHTML =
            "↻ Ny text";


        row.appendChild(
            newButton
        );


        /* ==================================
           DESIGN
        ================================== */

        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            .writing-action-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                margin-top: 17px;
            }

            .writing-action-row .check-button {
                margin-top: 0;
            }

            .new-writing-button {
                margin: 0;

                color: #404350;
                background: white;

                border:
                    1px solid
                    rgba(20, 23, 31, .09);

                box-shadow:
                    0 7px 18px
                    rgba(31, 38, 68, .07);
            }

            .new-writing-button:hover {
                color: var(--primary);

                border-color:
                    rgba(91, 92, 240, .28);

                box-shadow:
                    0 10px 24px
                    rgba(31, 38, 68, .10);
            }

            .new-writing-button:disabled {
                opacity: .55;
                cursor: wait;
            }

            @media (max-width: 600px) {

                .writing-action-row {
                    flex-direction: column;
                    align-items: stretch;
                }

                .writing-action-row button {
                    width: 100%;
                }

            }

        `;


        document.head.appendChild(
            style
        );


        /* ==================================
           SPARA TEXTER SOM REDAN VISATS
        ================================== */

        function normalize(text) {

            return String(text || "")
                .toLowerCase()
                .replace(/\\s+/g, " ")
                .trim();

        }


        function getSeen() {

            try {

                const data =
                    JSON.parse(
                        localStorage.getItem(
                            "mikal_seen_writing_texts"
                        ) || "[]"
                    );


                return Array.isArray(data)
                    ? data
                    : [];

            }

            catch {

                return [];

            }

        }


        function saveSeen(text) {

            let seen =
                getSeen();


            const exists =
                seen.some(
                    old =>
                        normalize(old) ===
                        normalize(text)
                );


            if (!exists) {

                seen.push(text);

            }


            seen =
                seen.slice(-500);


            localStorage.setItem(
                "mikal_seen_writing_texts",
                JSON.stringify(seen)
            );

        }


        saveSeen(
            textBox.innerText
        );


        /* ==================================
           HÄMTA NY TEXT
        ================================== */

        async function loadNewText() {

            newButton.disabled =
                true;


            newButton.innerHTML =
                "Skapar...";


            result.innerHTML =
                "";


            try {

                let newText = null;


                for (
                    let attempt = 0;
                    attempt < 5;
                    attempt++
                ) {

                    const seen =
                        getSeen();


                    const response =
                        await fetch(
                            "/api/writing/next",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        seen_texts:
                                            seen
                                    })
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            "Serverfel"
                        );

                    }


                    const data =
                        await response.json();


                    if (
                        data.text &&
                        normalize(data.text) !==
                        normalize(
                            textBox.innerText
                        ) &&
                        !seen.some(
                            old =>
                                normalize(old) ===
                                normalize(data.text)
                        )
                    ) {

                        newText =
                            data.text.trim();

                        break;

                    }

                }


                if (!newText) {

                    result.className =
                        "result warning";


                    result.innerHTML =
                        "Kunde inte hitta en ny text just nu. Försök igen.";

                    return;

                }


                saveSeen(
                    newText
                );


                textBox.innerText =
                    newText;


                answer.value =
                    "";


                result.innerHTML =
                    "";


                answer.focus();


                textBox.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

            catch (error) {

                console.error(
                    error
                );


                result.className =
                    "result warning";


                result.innerHTML =
                    "Något gick fel när den nya texten skulle hämtas.";

            }

            finally {

                newButton.disabled =
                    false;


                newButton.innerHTML =
                    "↻ Ny text";

            }

        }


        newButton.addEventListener(
            "click",
            loadNewText
        );

    }
);