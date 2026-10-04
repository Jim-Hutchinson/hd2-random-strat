#!/usr/bin/env bash
# One-click launcher for the Helldivers 2 Randomizer (macOS / Linux).
# Starts a tiny local web server and opens the randomizer in your browser.

# Port the local server listens on. Change if 8734 is already in use.
PORT=8734
URL="http://127.0.0.1:${PORT}/randomizer/"

cd "$(dirname "$0")" || exit 1

if command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1; then
    PYTHON=python
else
    echo "Python 3 is required to run the local server."
    echo "Alternatively, open randomizer/index.html directly in your browser -"
    echo "no server needed."
    exit 1
fi

echo "Starting the Helldivers 2 Randomizer..."
echo "  ${URL}"
echo "Press Ctrl+C here to stop the server."

# Give the server a moment, then open the default browser (best effort).
(
    sleep 1
    xdg-open "$URL" 2>/dev/null ||
        open "$URL" 2>/dev/null ||
        echo "Open ${URL} in your browser."
) &

exec "${PYTHON}" -m http.server "${PORT}" --bind 127.0.0.1
