const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startMenu = document.getElementById('startMenu');
const restartButton = document.getElementById('restartButton');
const normalModeButton = document.getElementById('normalModeButton');
const infinityModeButton = document.getElementById('infinityModeButton');

// NOVAS VARIÁVEIS PARA CONTROLES MÓVEIS
const mobileControlsContainer = document.querySelector('.mobile-controls');
const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');
const shootButton = document.getElementById('shoot');

let gameState = 'menu';
let gameMode = '';

const player = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 5
};

let enemies = [];
let enemyRowCount = 3;
const enemyColCount = 5;
const enemyWidth = 45;
const enemyHeight = 45;
const enemyPadding = 30;
const enemyOffsetTop = 30;
const enemyOffsetLeft = 40;
let enemyDirection = 1;
let enemySpeed = 1.5;

let playerBullets = [];
let enemyBullets = [];
let powerUps = [];

let score = 0;
let level = 1;

let keys = {};
let canShoot = true;
const baseCooldown = 300;

let isShieldActive = false;
const shieldDuration = 5000;
let shieldTimer = null;
let enemiesDestroyedSinceShield = 0;
const enemiesToActivateShield = 20;

let isLaserPowerUpActive = false;
const laserPowerUpDuration = 7000;
let laserTimer = null;
const laserSpeed = 2;

let isTripleShotActive = false;
const tripleShotDuration = 5000;
let tripleShotTimer = null;

let boss = null;
const bossWidth = 150;
const bossHeight = 100;
const bossSpeedX = 0.5;

// NOVO: Objeto para gerenciar o estado dos botões de toque
let mobileControlsActive = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false
};

const playerSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
    <style>
        .propulsion-glow {
            animation: thrust 0.2s infinite alternate;
        }
        @keyframes thrust {
            from { transform: scaleY(1); opacity: 1; }
            to { transform: scaleY(1.2); opacity: 0.8; }
        }
    </style>
    <polygon points="10 45, 15 20, 35 20, 40 45" fill="#1c75bc"/>
    <path d="M15 20 L25 5 L35 20 Z" fill="#4d92df"/>
    <rect x="23" y="10" width="4" height="10" fill="#fff"/>
    <path d="M10 45 H40 L35 50 H15 Z" fill="#00ffff" class="propulsion-glow"/>
    <circle cx="25" cy="20" r="3" fill="#ff0000"/>
</svg>`;

const enemySVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <polygon points="0 15, 22.5 45, 45 15, 22.5 0" fill="#ff4d4d"/>
    <polygon points="10 15, 22.5 35, 35 15, 22.5 5" fill="#c42b2b"/>
    <circle cx="22.5" cy="22.5" r="5" fill="#fff"/>
    <path d="M15 15 A10 10 0 0 0 30 15" stroke="#f1c40f" stroke-width="2" fill="none"/>
</svg>`;

const fastEnemySVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
    <polygon points="5 10, 22.5 45, 40 10, 22.5 0" fill="#00ffb7"/>
    <polygon points="12.5 10, 22.5 35, 32.5 10, 22.5 5" fill="#00cc99"/>
    <circle cx="22.5" cy="22.5" r="4" fill="#fff"/>
</svg>`;

const bossSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
    <path d="M0 50 L20 20 L130 20 L150 50 L130 80 L20 80 Z" fill="#e74c3c"/>
    <path d="M20 20 L75 0 L130 20 L75 40 Z" fill="#c0392b"/>
    <circle cx="50" cy="50" r="10" fill="#f1c40f"/>
    <circle cx="100" cy="50" r="10" fill="#f1c40f"/>
    <rect x="65" y="40" width="20" height="20" fill="#fff"/>
    <rect x="25" y="80" width="20" height="20" fill="#c0392b" stroke="#fff" stroke-width="2"/>
    <rect x="105" y="80" width="20" height="20" fill="#c0392b" stroke="#fff" stroke-width="2"/>
</svg>`;

const playerImage = new Image();
playerImage.src = 'data:image/svg+xml;base64,' + btoa(playerSVG);

const enemyImage = new Image();
enemyImage.src = 'data:image/svg+xml;base64,' + btoa(enemySVG);

const fastEnemyImage = new Image();
fastEnemyImage.src = 'data:image/svg+xml;base64,' + btoa(fastEnemySVG);

const bossImage = new Image();
bossImage.src = 'data:image/svg+xml;base64,' + btoa(bossSVG);

function drawPlayer() {
    ctx.drawImage(playerImage, player.x - player.width / 2, player.y, player.width, player.height);
    if (isShieldActive) {
        const glowSize = player.width * 1.5;
        const gradient = ctx.createRadialGradient(player.x, player.y + player.height / 2, 0, player.x, player.y + player.height / 2, glowSize / 2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y + player.height / 2, glowSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.type === 'boss') {
            ctx.drawImage(bossImage, enemy.x, enemy.y, enemy.width, enemy.height);
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / (10 * level)), 5);
        } else if (enemy.type === 'fast') {
            ctx.drawImage(fastEnemyImage, enemy.x, enemy.y, enemyWidth, enemyHeight);
        } else {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemyWidth, enemyHeight);
        }
    });
}

function drawBullets() {
    playerBullets.forEach(bullet => {
        if (bullet.type === 'normal') {
            ctx.fillStyle = 'rgba(0, 255, 42, 1)';
            ctx.shadowColor = 'rgba(0, 255, 8, 1)';
            ctx.shadowBlur = 10;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        } else if (bullet.type === 'laser') {
            ctx.fillStyle = '#00ff0dff';
            ctx.shadowColor = '#00ff0dff';
            ctx.shadowBlur = 20;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        } else if (bullet.type === 'triple_shot') {
            ctx.fillStyle = '#ff0000ff';
            ctx.shadowColor = '#ff0000ff';
            ctx.shadowBlur = 10;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        ctx.shadowBlur = 0;
    });
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });
}

function drawScoreAndLevel() {
    ctx.fillStyle = 'white';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`Pontos: ${score}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`Nível: ${level}`, canvas.width - 10, 25);
    ctx.textAlign = 'center';
    if (isShieldActive) {
        ctx.fillStyle = '#d400c6ff';
        ctx.fillText('ESCUDO ATIVO!', canvas.width / 2, 20);
    } else if (isLaserPowerUpActive) {
        ctx.fillStyle = '#00ff0dff';
        ctx.fillText('LASER ATIVO!', canvas.width / 2, 20);
    } else if (isTripleShotActive) {
        ctx.fillStyle = '#0bb9eeff';
        ctx.fillText('TRIPLO TIRO ATIVO!', canvas.width / 2, 25);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillText(`Próx. escudo: ${enemiesToActivateShield - enemiesDestroyedSinceShield}`, canvas.width / 2, 25);
    }
    ctx.shadowBlur = 0;
}

function drawPowerUps() {
    powerUps.forEach(pu => {
        ctx.fillStyle = pu.color;
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'playing') {
        drawPlayer();
        drawEnemies();
        drawBullets();
        drawPowerUps();
        drawScoreAndLevel();
    } else if (gameState === 'gameOver') {
        ctx.fillStyle = 'white';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.font = '36px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 3);

        ctx.font = '24px "Press Start 2P"';
        ctx.fillText(`Sua Pontuação: ${score}`, canvas.width / 2, canvas.height / 2);

        restartButton.classList.remove('hidden');
    } else if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'win') {
        drawWin();
    }
    ctx.shadowBlur = 0;
}

// Event listeners para teclado
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// NOVOS: Event listeners para os controles móveis
if (mobileControlsContainer) {
    upButton.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControlsActive.up = true; });
    upButton.addEventListener('touchend', (e) => { e.preventDefault(); mobileControlsActive.up = false; });

    downButton.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControlsActive.down = true; });
    downButton.addEventListener('touchend', (e) => { e.preventDefault(); mobileControlsActive.down = false; });

    leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControlsActive.left = true; });
    leftButton.addEventListener('touchend', (e) => { e.preventDefault(); mobileControlsActive.left = false; });

    rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControlsActive.right = true; });
    rightButton.addEventListener('touchend', (e) => { e.preventDefault(); mobileControlsActive.right = false; });

    shootButton.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControlsActive.shoot = true; });
    shootButton.addEventListener('touchend', (e) => { e.preventDefault(); mobileControlsActive.shoot = false; });
}

function shootPlayerBullet() {
    if (canShoot) {
        if (isLaserPowerUpActive) {
            const bullet = {
                x: player.x - 5,
                y: player.y,
                width: 10,
                height: 30,
                speed: 10,
                vx: 0,
                vy: -10,
                type: 'laser'
            };
            playerBullets.push(bullet);
        } else if (isTripleShotActive) {
            const bullet1 = { x: player.x - 15, y: player.y, width: 6, height: 15, speed: 9, vy: -9, type: 'triple_shot' };
            const bullet2 = { x: player.x, y: player.y, width: 6, height: 15, speed: 9, vy: -9, type: 'triple_shot' };
            const bullet3 = { x: player.x + 15, y: player.y, width: 6, height: 15, speed: 9, vy: -9, type: 'triple_shot' };
            playerBullets.push(bullet1, bullet2, bullet3);
        } else {
            const bullet = {
                x: player.x - 3,
                y: player.y,
                width: 6,
                height: 15,
                speed: 9,
                vx: 0,
                vy: -9,
                type: 'normal'
            };
            playerBullets.push(bullet);
        }
        canShoot = false;
        setTimeout(() => canShoot = true, isTripleShotActive ? 150 : baseCooldown);
    }
}
function shootEnemyBullet() {
    if (enemies.length > 0 && Math.random() < 0.01 + level * 0.001) {
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        const bullet = {
            x: randomEnemy.x + enemyWidth / 2,
            y: randomEnemy.y + enemyHeight,
            width: 6,
            height: 15,
            speed: 5,
            vx: 0,
            vy: 5,
            type: 'normal'
        };
        enemyBullets.push(bullet);
    }
}
function checkCollisions() {
    playerBullets = playerBullets.filter(bullet => {
        let hit = false;
        enemies = enemies.filter(enemy => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                hit = true;
                if (enemy.type === 'boss') {
                    enemy.health -= 1;
                    if (enemy.health <= 0) {
                        score += 500 * level;
                        boss = null;
                        return false;
                    }
                } else {
                    score += enemy.points * level;
                    enemiesDestroyedSinceShield++;
                    const tripleShotDropChance = 0.05;
                    const laserDropChance = 0.03;
                    
                    if (Math.random() < tripleShotDropChance) {
                        powerUps.push({
                            x: enemy.x + enemyWidth / 2,
                            y: enemy.y + enemyHeight / 2,
                            radius: 10,
                            color: '#ff0000ff',
                            type: 'triple_shot_powerup'
                        });
                    }
                    if (Math.random() < laserDropChance) {
                         powerUps.push({
                            x: enemy.x + enemyWidth / 2,
                            y: enemy.y + enemyHeight / 2,
                            radius: 10,
                            color: '#00ff0dff',
                            type: 'laser_powerup'
                        });
                    }
                    return false;
                }
            }
            return true;
        });
        if (bullet.type === 'laser') {
            return true;
        } else {
            return !hit;
        }
    });

    enemyBullets = enemyBullets.filter(bullet => {
        if (
            bullet.x < player.x + player.width / 2 &&
            bullet.x + bullet.width > player.x - player.width / 2 &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            if (isShieldActive) {
                return false;
            } else {
                gameState = 'gameOver';
                return false;
            }
        }
        return true;
    });

    enemies = enemies.filter(enemy => {
        if (
            enemy.x < player.x + player.width / 2 &&
            enemy.x + enemy.width > player.x - player.width / 2 &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            if (isShieldActive) {
                return false;
            } else {
                gameState = 'gameOver';
                return false;
            }
        }
        return true;
    });

    powerUps = powerUps.filter(pu => {
        const dx = player.x - pu.x;
        const dy = player.y - pu.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (player.width / 2) + pu.radius) {
            if (pu.type === 'laser_powerup') {
                activateLaserPowerUp();
            } else if (pu.type === 'triple_shot_powerup') {
                activateTripleShotPowerUp();
            }
            return false;
        }
        return true;
    });
}

function activateShield() {
    if (!isShieldActive) {
        isShieldActive = true;
        clearTimeout(shieldTimer);
        shieldTimer = setTimeout(() => {
            isShieldActive = false;
        }, shieldDuration);
    }
}

function activateLaserPowerUp() {
    if (!isLaserPowerUpActive) {
        isLaserPowerUpActive = true;
        clearTimeout(laserTimer);
        laserTimer = setTimeout(() => {
            isLaserPowerUpActive = false;
        }, laserPowerUpDuration);
    }
}

function activateTripleShotPowerUp() {
    if (!isTripleShotActive) {
        isTripleShotActive = true;
        clearTimeout(tripleShotTimer);
        tripleShotTimer = setTimeout(() => {
            isTripleShotActive = false;
        }, tripleShotDuration);
    }
}

function update() {
    // Apenas move o jogador se a tecla OU o botão de toque estiverem pressionados
    if (keys['a'] || keys['ArrowLeft'] || mobileControlsActive.left) {
        player.x -= player.speed;
    }
    if (keys['d'] || keys['ArrowRight'] || mobileControlsActive.right) {
        player.x += player.speed;
    }
    if (keys['w'] || keys['ArrowUp'] || mobileControlsActive.up) {
        player.y -= player.speed;
    }
    if (keys['s'] || keys['ArrowDown'] || mobileControlsActive.down) {
        player.y += player.speed;
    }

    // Garante que o jogador fique dentro dos limites do canvas
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Verifica se a tecla de espaço OU o botão de tiro estão pressionados
    if (keys[' '] || mobileControlsActive.shoot) {
        shootPlayerBullet();
    }

    let hitWall = false;
    let lowestEnemyY = 0;
    enemies.forEach(enemy => {
        enemy.x += enemy.speedX * enemyDirection;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            hitWall = true;
        }
        if (enemy.y + enemy.height > lowestEnemyY) {
            lowestEnemyY = enemy.y + enemy.height;
        }
    });

    if (hitWall) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            enemy.y += 25;
        });
    }

    if (!isShieldActive && lowestEnemyY >= player.y) {
        gameState = 'gameOver';
    }

    shootEnemyBullet();
    playerBullets.forEach(bullet => {
        if (bullet.type === 'laser') {
            if (bullet.x <= 0 || bullet.x + bullet.width >= canvas.width) {
                bullet.vx *= -1;
            }
            if (bullet.y <= 0) {
                bullet.vy *= -1;
            }
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
        } else {
            bullet.y += bullet.vy;
        }
    });
    enemyBullets.forEach(bullet => bullet.y += bullet.speed);

    powerUps.forEach(pu => pu.y += laserSpeed);
    powerUps = powerUps.filter(pu => pu.y < canvas.height);

    playerBullets = playerBullets.filter(bullet => bullet.y + bullet.height > 0 && (bullet.type === 'laser' || bullet.y + bullet.height < canvas.height));
    enemyBullets = enemyBullets.filter(bullet => bullet.y < canvas.height);

    checkCollisions();

    if (enemies.length === 0) {
        level++;
        if (gameMode === 'normal' && level > 5) {
            gameState = 'win';
        }
        resetLevel();
        generateEnemies();
    }

    if (enemiesDestroyedSinceShield >= enemiesToActivateShield) {
        activateShield();
        enemiesDestroyedSinceShield = 0;
    }
}

function generateEnemies() {
    enemies = [];
    if (gameMode === 'normal') {
        if (level === 5 && boss === null) {
            spawnBoss();
            return;
        }
    }
    if (gameMode === 'infinity') {
        enemyRowCount++;
        enemySpeed += 0.2;
    }
    const gridStartY = 50; 
    for (let c = 0; c < enemyColCount; c++) {
        for (let r = 0; r < enemyRowCount; r++) {
            const enemyX = (c * (enemyWidth + enemyPadding)) + enemyOffsetLeft;
            const enemyY = gridStartY + (r * (enemyHeight + enemyPadding));
            const spawnLimitY = canvas.height * 0.4;
            if (enemyY > spawnLimitY) {
            
                continue; 
            }
            
            const isFast = Math.random() < 0.2 + level * 0.02;
            const speed = isFast ? enemySpeed * 1.5 : enemySpeed;
            const points = isFast ? 30 : 10;
            const type = isFast ? 'fast' : 'normal';

            enemies.push({ 
                x: enemyX, 
                y: enemyY, 
                speedX: speed, 
                points: points, 
                type: type,
                width: enemyWidth,
                height: enemyHeight
                });
            }
        }
}
if (gameMode === 'infinity') {
    enemyRowCount++;
    enemySpeed += 0.2;
}
for (let c = 0; c < enemyColCount; c++) {
    for (let r = 0; r < enemyRowCount; r++) {
        const enemyX = (c * (enemyWidth + enemyPadding)) + enemyOffsetLeft;
        const enemyY = (r * (enemyHeight + enemyPadding)) + enemyOffsetTop;
        const isFast = Math.random() < 0.2 + level * 0.02;
        const speed = isFast ? enemySpeed * 1.5 : enemySpeed;
        const points = isFast ? 30 : 10;
        const type = isFast ? 'fast' : 'normal';
        enemies.push({
            x: enemyX,
            y: enemyY,
            speedX: speed,
            points: points,
            type: type,
            width: enemyWidth,
            height: enemyHeight
        });
    }
}

function spawnBoss() {
    boss = {
        x: canvas.width / 2 - bossWidth / 2,
        y: 50,
        width: bossWidth,
        height: bossHeight,
        health: 10 * level,
        type: 'boss',
        speedX: bossSpeedX * (level * 0.5)
    };
    enemies = [boss];
}

function resetLevel() {
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    powerUps = [];
    boss = null;
}

function resetGame() {
    score = 0;
    level = 1;
    enemyRowCount = 3;
    enemyDirection = 1;
    enemySpeed = 1.5;
    isShieldActive = false;
    isLaserPowerUpActive = false;
    isTripleShotActive = false;
    enemiesDestroyedSinceShield = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    resetLevel();
    gameState = 'playing';
    startMenu.classList.add('hidden');
    restartButton.classList.add('hidden');
    generateEnemies();
}

function drawMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('Selecione o Modo', canvas.width / 2, canvas.height / 3);
    ctx.shadowBlur = 0;
    startMenu.classList.remove('hidden');
}

function drawWin() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('Você venceu!', canvas.width / 2, canvas.height / 3);
    ctx.shadowBlur = 0;
}

normalModeButton.addEventListener('click', () => {
    gameMode = 'normal';
    resetGame();
});

infinityModeButton.addEventListener('click', () => {
    gameMode = 'infinity';
    resetGame();
});

restartButton.addEventListener('click', () => {
    gameState = 'menu';
    startMenu.classList.remove('hidden');
    restartButton.classList.add('hidden');
});

function gameLoop() {
    if (gameState === 'playing') {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

player.x = canvas.width / 2;
player.y = canvas.height - 100;

gameLoop();