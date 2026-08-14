import hashlib
import json
import os
import re
import time
from collections import deque
from pathlib import Path

import httpx
from flask import Blueprint, request, Response, jsonify


tts_bp = Blueprint("tts_bp", __name__)

BASE_DIR = Path(__file__).resolve().parent

CACHE_DIR = Path("/tmp/mikallearn_tts")

CACHE_DIR.mkdir(
    parents=True,
    exist_ok=True
)

OPENAI_API_KEY = os.getenv(
    "OPENAI_API_KEY"
)


# ============================================================
# TILLÅT BARA MIKALLEARN-ORD + MIKALLEARN-MENINGAR
# Detta hjälper till att skydda API-kostnaden.
# ============================================================

def load_allowed_texts():

    allowed = set()


    # --------------------------------------------------------
    # ORD
    # --------------------------------------------------------

    words_file = (
        BASE_DIR
        / "static"
        / "words.json"
    )


    if words_file.exists():

        try:

            data = json.loads(
                words_file.read_text(
                    encoding="utf-8"
                )
            )


            for item in data:

                if isinstance(
                    item,
                    dict
                ):

                    word = str(
                        item.get(
                            "word",
                            ""
                        )
                    ).strip()


                    if word:

                        allowed.add(
                            word
                        )

        except Exception as error:

            print(
                "TTS WORD LOAD ERROR:",
                repr(error)
            )


    # --------------------------------------------------------
    # LYSSNA-MENINGAR
    # --------------------------------------------------------

    listening_file = (
        BASE_DIR
        / "static"
        / "listening.js"
    )


    if listening_file.exists():

        try:

            javascript = (
                listening_file
                .read_text(
                    encoding="utf-8"
                )
            )


            match = re.search(
                r"const\s+sentences\s*=\s*\[(.*?)\]\s*;",
                javascript,
                re.DOTALL
            )


            if match:

                block = (
                    match.group(1)
                )


                strings = re.findall(
                    r'"((?:\\.|[^"\\])*)"',
                    block
                )


                for raw in strings:

                    try:

                        sentence = json.loads(
                            '"' + raw + '"'
                        )


                        sentence = (
                            str(sentence)
                            .strip()
                        )


                        if sentence:

                            allowed.add(
                                sentence
                            )

                    except Exception:

                        pass


        except Exception as error:

            print(
                "TTS SENTENCE LOAD ERROR:",
                repr(error)
            )


    print(
        "TTS allowed texts:",
        len(allowed)
    )


    return allowed


ALLOWED_TEXTS = load_allowed_texts()


# ============================================================
# ENKEL RATE LIMIT
# ============================================================

RATE_LIMIT = {}

RATE_WINDOW_SECONDS = 60

MAX_REQUESTS_PER_MINUTE = 40


def rate_limit_ok(ip):

    now = time.time()


    bucket = RATE_LIMIT.get(
        ip
    )


    if bucket is None:

        bucket = deque()

        RATE_LIMIT[ip] = bucket


    while (
        bucket
        and
        now - bucket[0]
        >
        RATE_WINDOW_SECONDS
    ):

        bucket.popleft()


    if (
        len(bucket)
        >=
        MAX_REQUESTS_PER_MINUTE
    ):

        return False


    bucket.append(
        now
    )


    return True


# ============================================================
# CACHE
# ============================================================

def cache_path(
    text,
    mode
):

    key = hashlib.sha256(
        (
            mode
            +
            "|"
            +
            text
        ).encode(
            "utf-8"
        )
    ).hexdigest()


    return (
        CACHE_DIR
        /
        (
            key
            +
            ".mp3"
        )
    )


# ============================================================
# OPENAI TTS
# ============================================================

def create_ai_audio(
    text,
    mode
):

    if not OPENAI_API_KEY:

        raise RuntimeError(
            "OPENAI_API_KEY saknas"
        )


    if mode == "slow":

        instructions = (
            "Speak only in Swedish. "
            "Use a natural Swedish pronunciation. "
            "Read exactly the provided text and do not add anything. "
            "Speak slowly and very clearly for a Swedish language learner. "
            "Articulate every word carefully. "
            "Use natural pauses between words and phrases. "
            "Do not exaggerate or stretch sounds unnaturally."
        )

    else:

        instructions = (
            "Speak only in Swedish. "
            "Use a natural Swedish pronunciation. "
            "Read exactly the provided text and do not add anything. "
            "Speak clearly and naturally at a calm educational pace. "
            "Articulate every word carefully for a Swedish language learner."
        )


    payload = {

        "model":
            "gpt-4o-mini-tts",

        "voice":
            "marin",

        "input":
            text,

        "instructions":
            instructions,

        "response_format":
            "mp3"

    }


    headers = {

        "Authorization":
            "Bearer "
            +
            OPENAI_API_KEY,

        "Content-Type":
            "application/json"

    }


    with httpx.Client(
        timeout=60.0
    ) as client:

        response = client.post(

            "https://api.openai.com/v1/audio/speech",

            headers=headers,

            json=payload

        )


    if response.status_code != 200:

        print(
            "OPENAI TTS ERROR:",
            response.status_code,
            response.text[:500]
        )


        raise RuntimeError(
            "OpenAI TTS request failed"
        )


    return response.content


# ============================================================
# ROUTE
# ============================================================

@tts_bp.route(
    "/api/tts",
    methods=["POST"]
)
def api_tts():

    data = (
        request.get_json(
            silent=True
        )
        or {}
    )


    text = str(
        data.get(
            "text",
            ""
        )
    ).strip()


    mode = str(
        data.get(
            "mode",
            "normal"
        )
    ).strip().lower()


    if mode not in (
        "normal",
        "slow"
    ):

        mode = "normal"


    if not text:

        return jsonify({
            "error":
                "Text saknas."
        }), 400


    if len(text) > 600:

        return jsonify({
            "error":
                "Texten är för lång."
        }), 400


    # --------------------------------------------------------
    # Säkerhet:
    # Bara ord/meningar som finns i MikalLearn
    # --------------------------------------------------------

    if text not in ALLOWED_TEXTS:

        return jsonify({
            "error":
                "Den här texten finns inte i MikalLearn."
        }), 403


    # --------------------------------------------------------
    # Rate limit
    # --------------------------------------------------------

    ip = (
        request.headers.get(
            "X-Forwarded-For",
            request.remote_addr
            or "unknown"
        )
        .split(",")[0]
        .strip()
    )


    if not rate_limit_ok(ip):

        return jsonify({
            "error":
                "För många ljudförfrågningar. Vänta lite."
        }), 429


    if not OPENAI_API_KEY:

        return jsonify({
            "error":
                "AI-rösten är inte konfigurerad."
        }), 503


    # --------------------------------------------------------
    # CACHE
    # --------------------------------------------------------

    file_path = cache_path(
        text,
        mode
    )


    try:

        if file_path.exists():

            audio = (
                file_path
                .read_bytes()
            )

        else:

            audio = create_ai_audio(
                text,
                mode
            )


            file_path.write_bytes(
                audio
            )


        response = Response(
            audio,
            mimetype="audio/mpeg"
        )


        response.headers[
            "Cache-Control"
        ] = (
            "private, max-age=86400"
        )


        response.headers[
            "X-Content-Type-Options"
        ] = "nosniff"


        return response


    except Exception as error:

        print(
            "TTS ERROR:",
            repr(error)
        )


        return jsonify({
            "error":
                "AI-rösten kunde inte skapas just nu."
        }), 500
