// Get a reference to the canvas element
const canvas = document.getElementById('gameCanvas');

// Set up canvas dimensions
const canvasWidth = 600;
const canvasHeight = 400;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Get the rendering context (2D)
const ctx = canvas.getContext('2d');

// Function to draw the game state
function drawGame() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw other game objects on top of the background
    frog.draw();
    for (let obstacle of obstacles) {
        obstacle.draw();
    }
    goalArea.draw();

    // Draw UI elements like lives, timer, and level
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`Lives: ${lives}`, 10, 30);
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    ctx.fillText(`Elapsed Time: ${elapsedTime} seconds`, canvasWidth - 250, 30);
    ctx.fillText(`Level: ${currentLevel}`, canvasWidth - 100, canvasHeight - 10);
}

// Define game objects
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Define Frog object
class Frog extends GameObject {
    constructor(x, y, width, height, imagePath, alternateImagePath) {
        super(x, y, width, height);
        this.image = new Image();
        this.image.src = 'file:///C:/Frogger/' + imagePath; // Full path to the default image
        this.alternateImage = new Image();
        this.alternateImage.src = 'file:///C:/Frogger/' + alternateImagePath; // Full path to the alternate image
        this.isAlternate = false; // Flag to track current image state
        this.image.onload = () => {
            this.draw();
        };
        this.moveIncrement = 1; // Additional pixel to move each jump
    }

    draw() {
        if (this.isAlternate) {
            ctx.drawImage(this.alternateImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    move(direction) {
        switch (direction) {
            case 'up':
                if (this.y > 0) {
                    if (this.y === 2 * laneWidth - this.height) {
                        // If frog reaches the 3rd lane, start continuous movement to the right at random speed
                        const minSpeed = 1; // Minimum speed
                        const maxSpeed = 5; // Maximum speed
                        const speed = Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed; // Random speed between minSpeed and maxSpeed
                        this.moveRightInterval = setInterval(() => {
                            if (this.x < canvasWidth - this.width) {
                                this.x += speed; // Increment the x-coordinate to move the frog at random speed to the right
                            }
                        }, 10);
                    }
                    this.y -= this.height + this.moveIncrement; // Jump one block up
                }
                break;
            case 'down':
                if (this.y < canvasHeight - this.height) {
                    clearInterval(this.moveRightInterval); // Stop continuous movement to the right when frog moves down
                    this.y += this.height + this.moveIncrement; // Jump one block down
                }
                break;
            case 'left':
                if (this.x > 0) {
                    clearInterval(this.moveRightInterval); // Stop continuous movement to the right when frog moves left
                    this.x -= this.width + this.moveIncrement; // Jump one block left
                } else {
                    // Player dies when hitting the left wall
                    this.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog to starting position
                    lives--; // Decrease lives
                    if (lives <= 0) {
                        gameOver();
                    }
                }
                break;
            case 'right':
                if (this.x < canvasWidth - this.width) {
                    clearInterval(this.moveRightInterval); // Stop continuous movement to the right when frog moves right manually
                    this.x += this.width + this.moveIncrement; // Jump one block right
                }
                break;
        }
        this.toggleAlternateImage(); // Toggle image when moving
    }
    
    toggleAlternateImage() {
        this.isAlternate = !this.isAlternate;
    }

    checkCollision(obstacles) {
        for (let obstacle of obstacles) {
            if (
                this.x < obstacle.x + obstacle.width &&
                this.x + this.width > obstacle.x &&
                this.y < obstacle.y + obstacle.height &&
                this.y + this.height > obstacle.y
            ) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }

    checkGoal(goalArea) {
        return (
            this.x < goalArea.x + goalArea.width &&
            this.x + this.width > goalArea.x &&
            this.y < goalArea.y + goalArea.height &&
            this.y + this.height > goalArea.y
        );
    }

    resetPosition(startX, startY) {
        this.x = startX;
        this.y = startY;
    }
}

// Define Obstacle object
class Obstacle extends GameObject {
    constructor(x, y, width, height, color, speed) {
        super(x, y, width, height, color);
        this.speed = speed;
    }

    move() {
        this.x += this.speed;
        if (this.x > canvasWidth) {
            this.x = -this.width;
        } else if (this.x + this.width < 0) {
            this.x = canvasWidth;
        }
    }
}

// Define GoalArea object
class GoalArea extends GameObject {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
    }
}

// Define Car object
class Car extends Obstacle {
    constructor(x, y, width, height, color, speed, imagePath) {
        super(x, y, width, height, color, speed);
        this.image = new Image();
        this.image.src = 'file:///C:/Frogger/' + imagePath; // Full path to the image
        this.image.onload = () => {
            this.draw();
        };
    }

    draw() {
        if (this.speed > 0) { // Check if the car is moving to the right
            // Flip the image horizontally
            ctx.save();
            ctx.scale(-1, 1); // Flip the image
            ctx.drawImage(this.image, -this.x - this.width, this.y, this.width, this.height);
            ctx.restore(); // Restore the canvas state
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

}

// Initialize game variables
let lives = 3;
let startTime = Date.now(); // Record start time
let timerInterval;

// Initialize game objects
let currentLevel = 1;
const frog = new Frog(canvasWidth / 2 - 20, canvasHeight - 80 + 40, 40, 40, 'frog.png', 'frog2.png'); // Adjusted frog start position
const obstacles = [];
const goalArea = new GoalArea(250, 10, 40, 20, 'blue'); // Adjusted y-coordinate

// Create traffic lanes according to the specified order
const trafficOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const laneWidth = canvasHeight / trafficOrder.length;

// Create traffic lanes according to the specified order
function createTrafficLanes(trafficOrder, laneWidth, level) {
    let trafficIndex = 0;

    // Clear obstacles array before creating obstacles for the new level
    obstacles.length = 0;

    for (let lane of trafficOrder) {
        switch (lane) {
            case 7:
            case 10:
            case 13:
            case 16:
                // Traffic lane
                let obstacleWidth = lane % 2 === 0 ? 40 : 40;
                let obstacleY = laneWidth * trafficIndex + 5 * (trafficIndex + 1) + 2 * laneWidth - 20 - 20 - 20 - 20 - 20 - 20 - 20 - 20 - 20 + 40; // Adjusted the y-coordinate to move down by 43 pixels

                // Random speed for each row
                let minSpeed = -5; // Minimum speed
                let maxSpeed = 5; // Maximum speed
                let speed = Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed + (level * 0.5); // Random speed between minSpeed and maxSpeed, increasing with level

                // Random number of cars
                let minCars = 1; // Minimum number of cars
                let maxCars = 2; // Maximum number of cars
                let numCars = Math.floor(Math.random() * (maxCars - minCars + 1)) + minCars + level; // Random number of cars between minCars and maxCars, increasing with level
                let totalWidth = numCars * obstacleWidth; // Calculate total width of cars
                let totalSpacing = canvasWidth - totalWidth; // Calculate total available spacing
                let minSpacing = totalSpacing / (numCars + 1); // Minimum spacing between cars
                let maxSpacing = minSpacing * 2; // Maximum spacing between cars

                for (let i = 0; i < numCars; i++) {
                    let spacing = Math.floor(Math.random() * (maxSpacing - minSpacing + 1)) + minSpacing + 60; // Random spacing between cars
                    let xPosition = (i + 1) * spacing + i * obstacleWidth; // Calculate x position of each car
                    let imagePath;

                    if (level === 2) {
                        imagePath = 'scarab2.png'; // Set image path to scarab2.png for level 2
                    } else if (level === 3) {
                        imagePath = 'log.png'; // Set image path to log.png for level 3
                    } else if (level === 4) {
                        imagePath = 'gator.png'; // Set image path to gator.png for level 4
                    } else if (level === 5) {
                        imagePath = 'scarab.png'; // Set image path to scarab.png for level 5
                    } else if (level === 6) {
                        imagePath = 'turtle.png'; // Set image path to turtle.png for level 6
                    } else if (level === 7) {
                        imagePath = 'snake2.png'; // Set image path to snake2.png for level 7
                    } else {
                        imagePath = 'snake.png'; // Default image path for other levels
                    }
                    obstacles.push(new Car(xPosition, obstacleY, obstacleWidth, 40, 'red', speed, imagePath)); // Adjust x-coordinate to space out cars
                }
                
                // Add additional group of cars with an offset of 40 pixels up
                obstacleY -= 40;
                for (let i = 0; i < numCars; i++) {
                    let spacing = Math.floor(Math.random() * (maxSpacing - minSpacing + 1)) + minSpacing + 60; // Random spacing between cars
                    let xPosition = (i + 1) * spacing + i * obstacleWidth; // Calculate x position of each car
                    let imagePath;

                    if (level === 2) {
                        imagePath = 'scarab2.png'; // Set image path to scarab2.png for level 2
                    } else if (level === 3) {
                        imagePath = 'log.png'; // Set image path to log.png for level 3
                    } else if (level === 4) {
                        imagePath = 'gator.png'; // Set image path to gator.png for level 4
                    } else if (level === 5) {
                        imagePath = 'scarab.png'; // Set image path to scarab.png for level 5
                    } else if (level === 6) {
                        imagePath = 'turtle.png'; // Set image path to turtle.png for level 6
                    } else if (level === 7) {
                        imagePath = 'snake2.png'; // Set image path to snake2.png for level 7
                    } else {
                        imagePath = 'snake.png'; // Default image path for other levels
                    }
                    obstacles.push(new Car(xPosition, obstacleY, obstacleWidth, 40, 'red', speed, imagePath)); // Adjust x-coordinate to space out cars
                }
                
                break;

            // Add more cases for other levels here...

            default:
                break;
        }
        trafficIndex++;
    }
}

// Create traffic lanes for level 1
createTrafficLanes(trafficOrder, laneWidth, 1);

// Main game loop
function gameLoop() {
    // Move obstacles
    for (let obstacle of obstacles) {
        obstacle.move();
    }

    // Check for collisions with obstacles
    if (frog.checkCollision(obstacles) || frog.x < 0 || frog.x > canvasWidth - 41) { // Check if frog hits left wall or is near right edge
        // Reset frog position if collision detected
        frog.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog to bottom middle of the screen
        lives--; // Decrease lives
        if (lives <= 0) {
            gameOver();
            return;
        }
    }

    // Check for goal reached
    if (frog.checkGoal(goalArea)) {
        // Handle level advancement
        handleLevelAdvancement();
    }

    // Draw game objects
    drawGame();

    // Repeat the game loop
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Function to continuously move the frog to the right slightly every 250ms
function continuouslyMoveFrog() {
    setInterval(() => {
        frog.x += frog.moveIncrement / 1; // Move half as much
        frog.toggleAlternateImage(); // Toggle image when moving
    }, 50); // Move every 250ms
}

// Start continuously moving the frog
continuouslyMoveFrog();

// Event listener for player input
document.addEventListener('keydown', function (event) {
    const key = event.key;
    switch (key) {
        case 'ArrowUp':
            frog.move('up');
            break;
        case 'ArrowDown':
            frog.move('down');
            break;
        case 'ArrowLeft':
            frog.move('left');
            break;
        case 'ArrowRight':
            frog.move('right');
            break;
    }
});

document.addEventListener('keyup', function (event) {
    frog.toggleAlternateImage(); // Toggle back to default image when key is released
});

// Function to handle game over
function gameOver() {
    // Stop the game loop
    cancelAnimationFrame(gameLoop);

    // Stop the timer
    clearInterval(timerInterval);

    // Display game over message and restart option
    const restart = confirm('Game over! Would you like to restart?');
    if (restart) {
        // Reset lives, timer, and restart game loop
        lives = 3;
        startTime = Date.now(); // Reset start time
        currentLevel = 1;
        obstacles.forEach(obstacle => {
            if (obstacle instanceof Car) {
                obstacle.image.src = 'file:///C:/Frogger/snake.png'; // Reset image to car for level 1
            }
        });
        goalArea.color = 'blue'; // Reset color of goal area for level 1
        createTrafficLanes(trafficOrder, laneWidth, 1); // Create traffic lanes for level 1
        gameLoop();
    } else {
        alert('Thanks for playing!');
    }
}

// Function to handle level advancement
function handleLevelAdvancement() {
    if (currentLevel === 7) {
        // Game completed
        alert('Congratulations! You have completed all levels!');
        gameOver();
    } else {
        // Move to the next level
        currentLevel++;
        updateLevel(currentLevel);
    }
}

/// Function to update game elements for the next level
function updateLevel(level) {
    switch (level) {
        case 2:
            goalArea.color = 'green'; // Change color of goal area for level 2
            obstacles.forEach(obstacle => {
                if (obstacle instanceof Car) {
                    obstacle.image.src = 'file:///C:/Frogger/scarab2.png'; // Change image to semi-truck for level 2
                }
            });
            frog.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog position for level 2
            createTrafficLanes(trafficOrder, laneWidth, 2); // Create traffic lanes for level 2
            break;
        case 3:
            goalArea.color = 'orange'; // Change color of goal area for level 3
            obstacles.forEach(obstacle => {
                if (obstacle instanceof Car) {
                    obstacle.image.src = 'file:///C:/Frogger/log.png'; // Change image to log for level 3
                }
            });
            frog.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog position for level 3
            createTrafficLanes(trafficOrder, laneWidth, 3); // Create traffic lanes for level 3
            break;
        case 4:
            goalArea.color = 'purple'; // Change color of goal area for level 4
            obstacles.forEach(obstacle => {
                if (obstacle instanceof Car) {
                    obstacle.image.src = 'file:///C:/Frogger/gator.png'; // Change image to alligator for level 4
                }
            });
            frog.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog position for level 4
            createTrafficLanes(trafficOrder, laneWidth, 4); // Create traffic lanes for level 4
            break;
        case 5:
            goalArea.color = 'yellow'; // Change color of goal area for level 5
            obstacles.forEach(obstacle => {
                if (obstacle instanceof Car) {
                    obstacle.image.src = 'file:///C:/Frogger/scarab.png'; // Change image to scarab for level 5
                }
            });
            frog.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog position for level 5
            createTrafficLanes(trafficOrder, laneWidth, 5); // Create traffic lanes for level 5
            break;
        case 6:
            goalArea.color = 'cyan'; // Change color of goal area for level 6
            obstacles.forEach(obstacle => {
                if (obstacle instanceof Car) {
                    obstacle.image.src = 'file:///C:/Frogger/turtle.png'; // Change image to turtle for level 6
                }
            });
            frog.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog position for level 6
            createTrafficLanes(trafficOrder, laneWidth, 6); // Create traffic lanes for level 6
            break;
        case 7:
            goalArea.color = 'red'; // Change color of goal area for level 7
            obstacles.forEach(obstacle => {
                if (obstacle instanceof Car) {
                    obstacle.image.src = 'file:///C:/Frogger/snake2.png'; // Change image to cobra for level 7
                }
            });
            frog.resetPosition(canvasWidth / 2 - 20, canvasHeight - 80 + 40); // Reset frog position for level 7
            createTrafficLanes(trafficOrder, laneWidth, 7); // Create traffic lanes for level 7
            break;
        default:
            break;
    }
}
