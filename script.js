// Initialize the chess board and Lichess API integration
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('game-status');
let gameId;
let selectedSquare;
let game = new Chess(); // Initialize chess.js
let level = 3; // Default Stockfish level
let explodedSquares = new Set(); // Track exploded squares
let apiToken = localStorage.getItem('lichessApiToken');

// Function to get API token
async function getApiToken() {
    if (!apiToken) {
        apiToken = prompt('Please enter your Lichess API token. You can get one from https://lichess.org/account/oauth/token');
        if (apiToken) {
            localStorage.setItem('lichessApiToken', apiToken);
        } else {
            document.getElementById('game-status').textContent = 'API token is required to play';
            return null;
        }
    }
    return apiToken;
}

// Piece image paths
const pieceImages = {
    'p': 'https://lichess1.org/assets/piece/cburnett/bP.svg', // black pawn
    'n': 'https://lichess1.org/assets/piece/cburnett/bN.svg', // black knight
    'b': 'https://lichess1.org/assets/piece/cburnett/bB.svg', // black bishop
    'r': 'https://lichess1.org/assets/piece/cburnett/bR.svg', // black rook
    'q': 'https://lichess1.org/assets/piece/cburnett/bQ.svg', // black queen
    'k': 'https://lichess1.org/assets/piece/cburnett/bK.svg', // black king
    'P': 'https://lichess1.org/assets/piece/cburnett/wP.svg', // white pawn
    'N': 'https://lichess1.org/assets/piece/cburnett/wN.svg', // white knight
    'B': 'https://lichess1.org/assets/piece/cburnett/wB.svg', // white bishop
    'R': 'https://lichess1.org/assets/piece/cburnett/wR.svg', // white rook
    'Q': 'https://lichess1.org/assets/piece/cburnett/wQ.svg', // white queen
    'K': 'https://lichess1.org/assets/piece/cburnett/wK.svg'  // white king
};

// Function to create the chess board
function createBoard() {
    boardElement.innerHTML = ''; // Clear existing board
    for (let i = 0; i < 8; i++) { // Start from 0 (top) to 7 (bottom)
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            if ((i + j) % 2 === 0) {
                square.classList.add('white');
            } else {
                square.classList.add('black');
            }
            square.setAttribute('data-row', i);
            square.setAttribute('data-col', j);
            square.addEventListener('click', () => handleSquareClick(i, j));
            boardElement.appendChild(square);
        }
    }
}

// Update the board display
function updateBoard() {
    // Get current position from the game
    const position = game.board();
    const squares = boardElement.getElementsByClassName('square');
    
    // Clear all squares
    Array.from(squares).forEach(square => {
        while (square.firstChild) {
            square.removeChild(square.firstChild);
        }
    });
    
    // Add pieces to their positions
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = position[i][j];
            if (piece) {
                const algebraic = String.fromCharCode('a'.charCodeAt(0) + j) + (8 - i);
                const square = squares[i * 8 + j];
                const pieceElement = document.createElement('img');
                pieceElement.classList.add('piece');
                const pieceKey = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                pieceElement.src = pieceImages[pieceKey];
                pieceElement.alt = pieceKey;
                pieceElement.draggable = false;
                square.appendChild(pieceElement);
            }
        }
    }
}

// Convert board position to algebraic notation
function getAlgebraicNotation(col, row) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return files[col] + (8 - row); // Convert from 0-based to 1-based and flip row
}

// Handle square click to make a move
function handleSquareClick(row, col) {
    const square = boardElement.children[row * 8 + col];
    
    if (!selectedSquare) {
        // Select piece
        const piece = game.get(getAlgebraicNotation(col, row));
        if (piece) {
            selectedSquare = { row, col };
            square.classList.add('selected');
        }
    } else {
        // Make move
        const from = getAlgebraicNotation(selectedSquare.col, selectedSquare.row);
        const to = getAlgebraicNotation(col, row);
        
        try {
            const move = game.move({
                from: from,
                to: to,
                promotion: 'q' // Always promote to queen for simplicity
            });
            
            if (move) {
                makeMove(from + to);
                // Show explosion animation if a capture occurred
                if (move.captured) {
                    showExplosion(col, row);
                }
                updateBoard();
            }
        } catch (error) {
            console.error('Invalid move:', error);
        }
        
        // Clear selection
        const prevSquare = boardElement.children[selectedSquare.row * 8 + selectedSquare.col];
        prevSquare.classList.remove('selected');
        selectedSquare = null;
    }
}

// Handle atomic explosion
function handleExplosion(moveResult, showAnimation = true) {
    const targetCol = moveResult.to.charCodeAt(0) - 'a'.charCodeAt(0);
    const targetRow = 8 - parseInt(moveResult.to[1]);
    
    // Get all squares that should explode (8 surrounding squares + target square)
    const explosionSquares = [];
    
    // Add the capture square
    explosionSquares.push({row: targetRow, col: targetCol});

    
    // Add all adjacent squares
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue; // Skip the center square (already added)
            
            const newRow = targetRow + i;
            const newCol = targetCol + j;
            
            // Check if square is within board bounds
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                // Get the piece on this square
                const piece = game.get(String.fromCharCode('a'.charCodeAt(0) + newCol) + (8 - newRow));
                // Only add if there's a piece and it's not a pawn
                if (piece && piece.type.toLowerCase() !== 'p') {
                    explosionSquares.push({row: newRow, col: newCol});
                }
            }
        }
    }
    
    // Show explosion animation if requested (only for captured piece)
    if (showAnimation) {
        showExplosion(targetCol, targetRow);
    }
    
    // Remove all pieces in explosion squares
    explosionSquares.forEach(square => {
        const algebraic = String.fromCharCode('a'.charCodeAt(0) + square.col) + (8 - square.row);
        game.remove(algebraic);
        explodedSquares.add(algebraic);
    });
    
    return explosionSquares;
}

// Show explosion animation
function showExplosion(col, row) {
    // Convert chess coordinates to board array index
    const index = (8 - row) * 8 + col;
    const square = boardElement.children[index];
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    square.appendChild(explosion);
    
    // Remove explosion element after animation
    setTimeout(() => {
        if (explosion && explosion.parentNode === square) {
            square.removeChild(explosion);
        }
    }, 500);
}

// Function to handle moves with Lichess API
async function makeMove(move) {
    if (!gameId) {
        statusElement.textContent = 'Error: No active game';
        return;
    }

    try {
        const token = await getApiToken();
        if (!token) return;

        const response = await fetch(`https://lichess.org/api/board/game/${gameId}/move/${move}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }

        statusElement.textContent = `Move made: ${move}`;
    } catch (error) {
        console.error('Error making move:', error);
        statusElement.textContent = `Error making move: ${error.message}`;
    }
}

// Lichess API integration
async function createGame() {
    const token = await getApiToken();
    if (!token) return;

    const statusElement = document.getElementById('game-status');
    statusElement.textContent = 'Creating game...';

    try {
        const response = await fetch('https://lichess.org/api/challenge/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: `level=${level}&clock.limit=600&clock.increment=0&variant=atomic&color=white`
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to create bot game: ${errorData}`);
        }

        const data = await response.json();
        gameId = data.id;
        statusElement.textContent = `Game started against Stockfish (Level ${level})! ID: ${gameId}`;
        
        // Start streaming the game
        startGameStream();
        showGameControls();
    } catch (error) {
        console.error('Error creating game:', error);
        statusElement.textContent = `Error creating game: ${error.message}`;
    }
}

// Stream game state
async function startGameStream() {
    if (!gameId) return;

    try {
        const token = await getApiToken();
        if (!token) return;

        const response = await fetch(`https://lichess.org/api/board/game/stream/${gameId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const events = decoder.decode(value)
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));

            for (const event of events) {
                if (event.type === 'gameState') {
                    handleGameState(event);
                } else if (event.type === 'gameFinish') {
                    handleGameFinish(event);
                }
            }
        }
    } catch (error) {
        console.error('Error in game stream:', error);
        document.getElementById('game-status').textContent = 'Error: Lost connection to game';
    }
}

function handleGameState(event) {
    // Update game state
    if (event.status === 'resign' || event.status === 'aborted') {
        handleGameFinish(event);
        return;
    }

    // Update the board with the new moves
    if (event.moves) {
        const moves = event.moves.split(' ');
        game = new Chess();
        moves.forEach(move => game.move(move, { sloppy: true }));
        updateBoard();
    }
}

function handleGameFinish(event) {
    const statusElement = document.getElementById('game-status');
    statusElement.textContent = `Game ended: ${event.status || 'Unknown reason'}`;
    forfeitButton.disabled = true;
    gameId = null;
    
    // Show difficulty popup again
    const popup = document.getElementById('difficulty-popup');
    popup.style.display = 'block';
}

// Add forfeit functionality
const forfeitButton = document.getElementById('forfeit-button');
forfeitButton.style.display = 'none'; // Hide initially

async function forfeitGame() {
    if (!gameId || !apiToken) return;
    
    const statusElement = document.getElementById('game-status');
    statusElement.textContent = 'Attempting to forfeit game...';

    try {
        // Try to resign the game first
        const resignResponse = await fetch(`https://lichess.org/api/board/game/${gameId}/resign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (resignResponse.ok) {
            handleForfeitSuccess();
            return;
        }

        // If resign fails, try to cancel the challenge
        const cancelResponse = await fetch(`https://lichess.org/api/challenge/${gameId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (cancelResponse.ok) {
            handleForfeitSuccess();
            return;
        }

        // If both attempts fail
        statusElement.textContent = 'Failed to forfeit game. Please try again.';
    } catch (error) {
        console.error('Error forfeiting game:', error);
        statusElement.textContent = 'Error forfeiting game. Please try again.';
    }
}

function handleForfeitSuccess() {
    const statusElement = document.getElementById('game-status');
    statusElement.textContent = 'Game forfeited successfully';
    forfeitButton.disabled = true;
    game = new Chess();
    updateBoard();
    gameId = null;
    
    // Show difficulty popup again
    const popup = document.getElementById('difficulty-popup');
    popup.style.display = 'block';
}

// Add click handler for forfeit button
forfeitButton.addEventListener('click', forfeitGame);

// Show forfeit button when game starts
function showGameControls() {
    forfeitButton.style.display = 'block';
    forfeitButton.disabled = false;
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    // Don't start the game immediately, wait for difficulty selection
    const popup = document.getElementById('difficulty-popup');
    const difficultyInput = document.getElementById('difficulty');
    const startButton = document.getElementById('start-game');
    
    // Validate and update difficulty input
    difficultyInput.addEventListener('input', function() {
        let value = parseInt(this.value);
        if (value < 1) this.value = 1;
        if (value > 8) this.value = 8;
    });
    
    // Start game when button is clicked
    startButton.addEventListener('click', function() {
        level = parseInt(difficultyInput.value);
        popup.style.display = 'none';
        
        // Initialize the game
        explodedSquares.clear();
        createBoard();
        updateBoard();
        createGame();
    });
});
