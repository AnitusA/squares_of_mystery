# Square of Mysteries

Simple static web game (Snake-like events and tiles) implemented as HTML/CSS/JS.

How to run

- Open [a:/squares_of_mystery/index.html](index.html) in a browser, or run a local static server. Example using Python:

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

Features

- Shared login page at [a:/squares_of_mystery/login.html](login.html)
- Admin password: `02052004`
- Hall login: no password
- 67 tiles board generated once and persisted in localStorage
- Admin panel: create teams, add dares/treasures (one per line)
- First 50 tiles randomized with: 15 dares, 15 quizzes, 7 hex, 7 treasures (rest empty)
- Tiles 41-50 include 4 snake (minus 6-15 points) and others empty
- Last tiles empty
- Dice roll to move current team; modal displays events
- Use real dice and enter the rolled number in the admin UI (`moveSteps`) then press `Move`.
- The Hall page is display-only and follows the latest tile update from the same origin.
- Dare / Treasure show a "Completed" flow (gives points on completion)
- Quiz questions are hardcoded in `app.js` (editable)

Notes / next steps

- You can edit `app.js` to change quiz Q/A, tweak points, or add ladder behavior.
- The login is client-side only. If you need real access control across devices on Vercel, add a backend auth layer.
