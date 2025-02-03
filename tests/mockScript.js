// Mock functions from script.js
global.createBoard = () => {
    const board = document.getElementById('board');
    board.innerHTML = ''; // Clear existing content
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + j) % 2 === 0 ? 'white' : 'black');
            board.appendChild(square);
        }
    }
};

global.updateBoard = () => {
    // Mock implementation
};

global.handleExplosion = (moveResult) => {
    const explosionSquares = [];
    const targetCol = moveResult.to.charCodeAt(0) - 'a'.charCodeAt(0);
    const targetRow = 8 - parseInt(moveResult.to[1]);
    explosionSquares.push({row: targetRow, col: targetCol});
    
    // Add adjacent squares if piece is not a pawn
    if (global.game.get(moveResult.to)?.type !== 'p') {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = targetRow + i;
                const newCol = targetCol + j;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    explosionSquares.push({row: newRow, col: newCol});
                }
            }
        }
    }
    return explosionSquares;
};

global.createGame = jest.fn(() => Promise.resolve());

// Set up click handler for start button
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-game');
    const difficultyInput = document.getElementById('difficulty');
    const popup = document.getElementById('difficulty-popup');

    // Input validation handler
    const validateDifficulty = (input) => {
        let value = parseInt(input.value);
        if (value < 1) input.value = '1';
        if (value > 8) input.value = '8';
        return parseInt(input.value);
    };

    startButton.addEventListener('click', () => {
        global.level = validateDifficulty(difficultyInput);
        popup.style.display = 'none';
        global.createBoard();
        global.updateBoard();
        global.createGame();
    });

    difficultyInput.addEventListener('input', () => {
        validateDifficulty(difficultyInput);
    });
});
