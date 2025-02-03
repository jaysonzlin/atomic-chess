# Contributor: Jayson Lin <jlin3@college.harvard.edu>

### Issues: Cascade couldn't properly utilize the Lichess API, so I coded some parts before letting it fill. The explosion mechanism locally ended up being a larger endeavor than expected; Cascade kept coming up with convoluted solutions which sometimes didn't adhere to the rules of atomic chess explosions. I eventually gave up and added in my own solution. The tests couldn't be zero-shotted by Cascade, so some intervention was taken to create mocks for Cascade before letting it take over.
# Hours it took me: 7 hours

# What I worked on:Atomic Chess Game

A web-based implementation of Atomic Chess using the Lichess API. Play against Stockfish bot with customizable difficulty levels.

## Requirements

### Software Requirements
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Dependencies (These are handled by the steps, so no need to manually install them)
- chess.js (v0.10.3) - Chess logic and move validation
- Jest (v29.7.0) - Testing framework
- Jest-environment-jsdom (v29.7.0) - DOM testing environment

### CDN Dependencies (no installation needed)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.js"></script>
```

## Features

- Play Atomic Chess against Stockfish bot
- Adjustable bot difficulty (levels 1-8)
- Visual explosion effects for captures
- Real-time board updates
- Proper handling of atomic chess rules (pawns don't explode adjacent pieces)

## Setup Instructions

1. **Clone the Repository**
```bash
git clone  https://github.com/cs1060/jaysonzlin-hw1
cd windsurf-project
```

2. **Install Dependencies**
```bash
npm install
```

3. **Set up Lichess API Token**
- Create a Lichess account at [lichess.org](https://lichess.org)
- Go to [Preferences > API Access Tokens](https://lichess.org/account/oauth/token)
- Create a new token with the following scopes:
  - `bot:play`
  - `challenge:write`
  - `board:play`
- Copy your token and replace the placeholder in `config.js`:
```javascript
const LICHESS_TOKEN = 'your_token_here';
```

4. **Run Tests**
```bash
npm test
```

5. **Start the Game**
- Open `index.html` in your web browser
- Select difficulty level (1-8)
- Click "Play Game" to start
- Make moves by clicking pieces and their destinations

## Game Rules

- Standard chess rules apply with atomic modifications
- When a capture is made:
  - Both the capturing and captured pieces are removed
  - All non-pawn pieces adjacent to the capture square are also removed
  - Pawns are immune to explosions (unless directly captured)
  - Kings can not capture - due to checkmate by explosion

## Development

- `script.js`: Main game logic
- `style.css`: Game styling
- `config.js`: Lichess API configuration
- `tests/`: Test suite for game functionality

## Testing

The test suite covers:
- Game initialization
- Board creation
- Difficulty selection
- Explosion handling
- Move validation

Run tests with:
```bash
npm test
```

## Troubleshooting

1. **API Token Issues**
- Ensure your token has the correct permissions
- Check that the token is correctly copied to `config.js`
- Verify your Lichess account is active

2. **Game Not Starting**
- Check browser console for errors
- Verify all files are properly loaded
- Ensure JavaScript is enabled

## Contributing

Feel free to submit issues and enhancement requests!
