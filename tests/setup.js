// Mock the chess.js library
global.Chess = class {
    constructor() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.turn = 'w';
    }
    
    reset() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.turn = 'w';
    }
    
    move() {
        return { color: 'w', captured: false };
    }
    
    get() {
        return null;
    }
    
    fen() {
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    
    load() {
        return true;
    }
};

// Set up global variables that would be defined in script.js
global.gameId = null;
global.selectedSquare = null;
global.game = new Chess();
global.explodedSquares = new Set();
global.level = 3;

// Mock DOM elements
document.body.innerHTML = `
    <div id="difficulty-popup">
        <input id="difficulty" value="3">
        <button id="start-game">Play Game</button>
    </div>
    <div id="game-status"></div>
    <div id="board"></div>
`;

// Mock fetch API
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'test-game-id' }),
        body: {
            getReader: () => ({
                read: () => Promise.resolve({ 
                    done: false,
                    value: new TextEncoder().encode(JSON.stringify({
                        type: 'gameFull',
                        state: { moves: '' }
                    }))
                })
            })
        }
    })
);

// Mock config.js
global.LICHESS_TOKEN = 'test-token';
