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
- Admin panel: create teams and control the board
- First 46 tiles randomized with: 14 dares, 14 quizzes, 9 hex, 9 treasures
- Last 21 tiles contain 10 randomized snakes and the rest empty
- Dice roll to move current team; modal displays events
- Use real dice and enter the rolled number in the admin UI (`moveSteps`) then press `Move`.
- The Hall page is display-only and follows the latest tile update from the same origin.
- Dare, Quiz, Hex, Treasure, and Snake only show an event label plus a `Completed` button.

Notes / next steps

- You can edit `app.js` to change quiz Q/A, tweak points, or add ladder behavior.
- The login is client-side only. If you need real access control across devices on Vercel, add a backend auth layer.
