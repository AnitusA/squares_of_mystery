# Square of Mysteries

Simple static web game (Snake-like events and tiles) implemented as HTML/CSS/JS.

How to run

- Run the Python server:

```bash
python server.py
# then open http://localhost:5000/
```

- Open [a:/squares_of_mystery/index.html](index.html) and [a:/squares_of_mystery/hall.html](hall.html) through that server so both devices share the same state.

Features

- Shared login page at [a:/squares_of_mystery/login.html](login.html)
- Admin password: `02052004`
- Hall login: no password
- 67 tiles board generated once and persisted in localStorage
- Admin panel: create teams and control the board
- First 45 tiles randomized with: 15 dares, 10 quizzes, 10 hex, 10 treasures (no 3-in-a-row)
- Last 22 tiles contain 9 randomized snakes, 9 empty, with last 4 tiles always empty (no 3-in-a-row)
- Dice roll to move current team; modal displays events
- Use real dice and enter the rolled number in the admin UI (`moveSteps`) then press `Move`.
- The Hall page is display-only and follows the latest tile update from the shared Python backend.
- Dare, Quiz, Hex, Treasure, and Snake only show an event label plus a `Completed` button.

Running the local server for LAN access

1. (Optional) Create a virtual environment and activate it:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Start the server:

```powershell
python server.py
```

4. From another device on the same network open:

```
http://<HOST_IP>:5000/hall.html
```

Notes: The admin page will attempt to POST events to `/update` on the same host; if the Flask server is not running, the client falls back to `localStorage`.

Notes / next steps

- You can edit `app.js` to change quiz Q/A, tweak points, or add ladder behavior.
- The login is client-side only. If you need real access control across devices on Vercel, add a backend auth layer.
