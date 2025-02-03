// Import mocks
require('./mockScript.js');

describe('Atomic Chess Game', () => {
    beforeEach(() => {
        // Reset the DOM before each test
        document.body.innerHTML = `
            <div id="difficulty-popup">
                <input id="difficulty" value="3">
                <button id="start-game">Play Game</button>
            </div>
            <div id="game-status"></div>
            <div id="board"></div>
        `;
        
        // Reset global variables
        global.gameId = null;
        global.selectedSquare = null;
        global.game = new Chess();
        global.explodedSquares = new Set();
        global.level = 3;
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Initialize event listeners
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    // Helper function to start game
    const startGame = () => {
        const difficultyInput = document.getElementById('difficulty');
        const startButton = document.getElementById('start-game');
        difficultyInput.value = '3';
        startButton.click();
    };

    describe('Game Initialization', () => {
        test('should initialize with default difficulty level', () => {
            startGame();
            expect(global.level).toBe(3);
        });

        test('should create 64 squares on the board', () => {
            startGame();
            const squares = document.querySelectorAll('.square');
            expect(squares.length).toBe(64);
        });

        test('should alternate square colors', () => {
            startGame();
            const squares = document.querySelectorAll('.square');
            expect(squares[0].classList.contains('white')).toBe(true);
            expect(squares[1].classList.contains('black')).toBe(true);
        });

        test('should hide popup after starting game', () => {
            const popup = document.getElementById('difficulty-popup');
            startGame();
            expect(popup.style.display).toBe('none');
        });
    });

    describe('Game Controls', () => {
        test('should update difficulty level when starting game', () => {
            const difficultyInput = document.getElementById('difficulty');
            const startButton = document.getElementById('start-game');
            
            // Need to trigger input event first to validate
            difficultyInput.value = '5';
            difficultyInput.dispatchEvent(new Event('input'));
            startButton.click();
            
            expect(global.level).toBe(5);
        });

        test('should validate difficulty input range', () => {
            const difficultyInput = document.getElementById('difficulty');
            
            // Test upper bound
            difficultyInput.value = '10';
            difficultyInput.dispatchEvent(new Event('input'));
            expect(difficultyInput.value).toBe('8');
            
            // Test lower bound
            difficultyInput.value = '0';
            difficultyInput.dispatchEvent(new Event('input'));
            expect(difficultyInput.value).toBe('1');
        });

        test('should not start game before clicking play button', () => {
            const squares = document.querySelectorAll('.square');
            expect(squares.length).toBe(0);
        });
    });

    describe('Explosion Handling', () => {
        beforeEach(() => {
            startGame();
        });

        test('should handle explosions on capture', () => {
            const moveResult = {
                color: 'w',
                captured: true,
                from: 'e2',
                to: 'e4'
            };
            
            // Mock piece for explosion check
            jest.spyOn(global.game, 'get').mockReturnValue({ type: 'r', color: 'b' });
            
            const explosionSquares = global.handleExplosion(moveResult);
            expect(explosionSquares.length).toBeGreaterThan(1); // Should include adjacent squares
        });

        test('should not explode pawns in adjacent squares', () => {
            const moveResult = {
                color: 'w',
                captured: true,
                from: 'e2',
                to: 'e4'
            };
            
            // Mock pawn in adjacent square
            jest.spyOn(global.game, 'get').mockReturnValue({ type: 'p', color: 'b' });
            
            const explosionSquares = global.handleExplosion(moveResult);
            expect(explosionSquares.length).toBe(1); // Only captured square
        });
    });
});
