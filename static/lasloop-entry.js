
document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            window.location.pathname
            !== "/lasa"
        ) {

            return;

        }


        if (
            document.getElementById(
                "lasLoopEntry"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            .lasloop-entry {

                display: grid;

                grid-template-columns:
                    1fr auto;

                align-items: center;

                gap: 18px;

                margin:
                    18px 0 23px;

                padding:
                    21px 23px;

                color: white;

                background:
                    radial-gradient(
                        circle at 86% 12%,
                        rgba(105,107,255,.75),
                        transparent 170px
                    ),
                    linear-gradient(
                        135deg,
                        #1c1e29,
                        #292c44
                    );

                border-radius: 19px;

                box-shadow:
                    0 15px 40px
                    rgba(30,33,61,.12);
            }


            .lasloop-entry-label {

                margin:
                    0 0 4px;

                color:
                    #cbccff;

                font-size: 9px;

                font-weight: 950;

                letter-spacing: 1.4px;
            }


            .lasloop-entry h3 {

                margin: 0;

                color: white;

                font-size: 21px;
            }


            .lasloop-entry p {

                max-width: 570px;

                margin:
                    6px 0 0;

                color:
                    #c9cad7;

                font-size: 10px;

                line-height: 1.55;
            }


            .lasloop-entry a {

                display: inline-flex;

                align-items: center;

                min-height: 44px;

                padding:
                    0 16px;

                color:
                    #232531;

                background:
                    white;

                border-radius:
                    12px;

                text-decoration:
                    none;

                white-space:
                    nowrap;

                font-size: 10px;

                font-weight: 900;
            }


            @media (
                max-width: 650px
            ) {

                .lasloop-entry {

                    grid-template-columns:
                        1fr;

                }

            }

        `;


        document.head.appendChild(
            style
        );


        const card =
            document.createElement(
                "section"
            );


        card.id =
            "lasLoopEntry";


        card.className =
            "lasloop-entry";


        card.innerHTML = `

            <div>

                <p class="lasloop-entry-label">
                    ⚡ 500 VANLIGA ORD
                </p>

                <h3>
                    LäsLoop
                </h3>

                <p>
                    10 sekunder per ord.
                    Ett ord måste klaras 10 gånger
                    innan det räknas som automatiskt.
                </p>

            </div>


            <a href="/lasloop">

                Starta LäsLoop →

            </a>

        `;


        const main =
            document.querySelector(
                "main"
            )
            ||
            document.body;


        const h1 =
            main.querySelector(
                "h1"
            );


        if (
            h1
            &&
            h1.parentElement
        ) {

            h1.parentElement
                .insertAdjacentElement(
                    "afterend",
                    card
                );

        }

        else {

            main.insertBefore(
                card,
                main.firstChild
            );

        }

    }
);
