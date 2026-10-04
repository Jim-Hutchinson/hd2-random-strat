# Running the Randomizer Locally

Everything in this project is plain HTML/JavaScript — there is no build step
and nothing to install. Pick whichever option below suits you.

---

## Option 1: Just open it (zero setup)

Double-click **`randomizer/index.html`** (or any other page, e.g.
`randomizermarathon/index.html`).

That's it — the randomizer runs entirely in your browser. Your option
selections (warbonds, squad mode, etc.) are saved in your browser's local
storage, exactly like on the hosted site.

**Notes:**

- You still need an internet connection the first time (and for styling in
  general): Bootstrap, icons, and fonts are loaded from public CDNs. The
  randomizer logic and all item data are local.
- If your browser shows a blank page or the console complains about blocked
  scripts, use Option 2 instead — a local server is the most reliable way.

---

## Option 2: One-click launcher (recommended)

The launchers start a tiny local web server and open the randomizer in your
browser automatically.

### Windows

Double-click **`start-randomizer.bat`**.

- It looks for Python (the `python` or `py` command). If neither is found,
  install Python from https://www.python.org/downloads/ (any recent 3.x is
  fine; tick "Add python.exe to PATH" during install).
- A minimized window titled "HD2 Randomizer server" keeps the server running.
  Your browser opens at `http://127.0.0.1:8734/randomizer/`.
- Close that minimized window to stop the server.

### macOS / Linux

From a terminal in the project folder:

```bash
./start-randomizer.sh
```

- Uses `python3` (or `python`). Press `Ctrl+C` in the terminal to stop the
  server.
- If the browser doesn't open by itself, go to
  `http://127.0.0.1:8734/randomizer/` manually.

### If the port is taken

Both launchers use port **8734**. If something else on your machine already
uses it, change the `PORT` value at the top of the launcher script to any
free port (e.g. `8740`) — or just use Option 1, since the site works without
a server anyway.

---

## Option 3: Manual server (for developers)

Any static file server pointed at this folder works:

```bash
cd <this folder>
python -m http.server 8734
# or: npx serve .
# or: php -S 127.0.0.1:8734
```

Then open `http://127.0.0.1:8734/randomizer/`.

---

## Squad mode reminder

Flip the **Squad (4P)** switch on the randomizer page to roll four full
loadouts at once. The Options menu controls how the rules apply across the
team (shared pool, guaranteed supports, per-player limits, and so on).
