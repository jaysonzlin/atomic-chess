// Initialize the chess board and Lichess API integration
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('game-status');
let gameId;
let selectedSquare;
let game = new Chess(); // Initialize chess.js
let level = 3; // Default Stockfish level
let explodedSquares = new Set(); // Track exploded squares

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
        const response = await fetch(`https://lichess.org/api/board/game/${gameId}/move/${move}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiToken}`
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
    try {
        // Challenge the Lichess bot
        const challengeResponse = await fetch('https://lichess.org/api/challenge/ai', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'level': level, // Stockfish level
                'clock.limit': '600', // 10 minutes
                'clock.increment': '0',
                'variant': 'atomic',
                'color': 'white' // Play as white
            })
        });

        if (!challengeResponse.ok) {
            const errorData = await challengeResponse.text();
            throw new Error(`Failed to create bot game: ${errorData}`);
        }

        const data = await challengeResponse.json();
        gameId = data.id;
        statusElement.textContent = `Game started against Stockfish (Level ${level})! ID: ${gameId}`;
        
        // Start streaming the game
        startGameStream();
    } catch (error) {
        console.error('Error creating game:', error);
        statusElement.textContent = `Error creating game: ${error.message}`;
    }
}

// Stream game state
async function startGameStream() {
    if (!gameId) {
        console.error('No game ID available');
        return;
    }

    try {
        const response = await fetch(`https://lichess.org/api/board/game/stream/${gameId}`, {
            headers: {
                'Authorization': `Bearer ${config.apiToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Stream error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        let lastMoves = '';
        let currentPosition = game.fen();
        let pendingAnimations = new Set();

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    const event = JSON.parse(line);
                    if (event.type === 'gameFull') {
                        // Initial game state
                        const initialState = event.state;
                        game.reset();
                        if (initialState.moves) {
                            const moves = initialState.moves.split(' ');
                            for (const move of moves) {
                                if (move) game.move(move, {sloppy: true});
                            }
                        }
                        currentPosition = game.fen();
                        updateBoard();
                    } else if (event.type === 'gameState') {
                        // Update from new moves
                        if (event.moves && event.moves !== lastMoves) {
                            const moves = event.moves.split(' ');
                            const newMove = moves[moves.length - 1];
                            
                            // Wait for any pending animations to complete
                            if (pendingAnimations.size > 0) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                                pendingAnimations.clear();
                            }
                            
                            // Reset to last known good position
                            game.load(currentPosition);
                            
                            // Apply the new move
                            const moveResult = game.move(newMove, {sloppy: true});
                            if (!moveResult) {
                                console.error('Failed to make move:', newMove);
                                continue;
                            }
                            
                            if (moveResult.captured) {
                                // Show explosion only on captured piece
                                const targetCol = moveResult.to.charCodeAt(0) - 'a'.charCodeAt(0);
                                const targetRow = parseInt(moveResult.to[1]);
                                showExplosion(targetCol, targetRow);
                                pendingAnimations.add(`${targetCol},${targetRow}`);
                                
                                // Handle atomic explosion (but don't show animation)
                                handleExplosion(moveResult, false);
                                
                                // Delay the final board update and game end status
                                setTimeout(() => {
                                    pendingAnimations.delete(`${targetCol},${targetRow}`);
                                    currentPosition = game.fen();
                                    updateBoard();
                                    // Update game status
                                    if (event.status === 'mate') {
                                        statusElement.textContent = 'Checkmate! Game Over';
                                    } else if (event.status === 'draw') {
                                        statusElement.textContent = 'Game Draw!';
                                    } else if (event.winner) {
                                        statusElement.textContent = `Game Over! ${event.winner === 'white' ? 'White' : 'Black'} wins!`;
                                    }
                                }, 500); // Match explosion animation duration
                            } else {
                                // For non-capture moves, update immediately
                                currentPosition = game.fen();
                                updateBoard();
                                
                                // Update game status
                                if (event.status === 'mate') {
                                    statusElement.textContent = 'Checkmate! Game Over';
                                } else if (event.status === 'draw') {
                                    statusElement.textContent = 'Game Draw!';
                                } else if (event.winner) {
                                    statusElement.textContent = `Game Over! ${event.winner === 'white' ? 'White' : 'Black'} wins!`;
                                } else {
                                    // Show whose turn it is
                                    const moveCount = moves.length;
                                    const isWhiteTurn = moveCount % 2 === 0;
                                    statusElement.textContent = `${isWhiteTurn ? 'White' : 'Black'} to move`;
                                }
                            }
                            lastMoves = event.moves;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse game state:', e);
                    continue;
                }
            }
        }
    } catch (error) {
        console.error('Game stream error:', error);
        statusElement.textContent = `Error streaming game: ${error.message}`;
    }
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
