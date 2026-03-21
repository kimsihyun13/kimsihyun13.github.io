// js/script_tank.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = 1500;
    canvas.height = 700;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const WORLD_SIZE = 4000;
let score = 0;
let isAutoFire = false;
let isMouseDown = false;
let particles = []; 
let bullets = [];
let enemies = [];
let gameState = 'START'; 
let shakeTime = 0; 
let stage = 1;
let gameStartTime = 0; // [추가] 시간 경과에 따른 난이도 상승용

const base = {
    x: WORLD_SIZE - 400, y: WORLD_SIZE / 2,
    hp: 15, maxHp: 15, size: 120, color: "#FF4757"
};

const player = {
    x: 500, y: WORLD_SIZE / 2,
    vx: 0, vy: 0, angle: 0, lastShoot: 0,
    size: 32, hp: 100, maxHp: 100,
    baseFireRate: 200, 
    minFireRate: 0.1    
};

const camera = { x: 0, y: 0, lerp: 0.1 };
const keys = {};
const mouse = { x: 0, y: 0 };

function createExplosion(x, y, color, count = 12, speed = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed,
            size: Math.random() * 5 + 2, life: 1.0, color
        });
    }
}

function spawnEnemy() {
    const roll = Math.random() * 100;
    let eliteChance = Math.min(40, (stage - 1) * 10); 
    let strongChance = Math.min(60, (stage - 1) * 15);
    let type = 'NORMAL', hp = 1, size = 30, color = "#FF4757", speed = 1.5;

    if (roll < eliteChance) {
        type = 'ELITE'; hp = 5; size = 45; color = "#800080"; speed = 1.0;
    } else if (roll < strongChance + eliteChance) {
        type = 'STRONG'; hp = 2; size = 38; color = "#FFA500"; speed = 1.3;
    }

    const spawnX = base.x + (Math.random() - 0.5) * 400;
    const spawnY = base.y + (Math.random() - 0.5) * 400;
    enemies.push({ x: spawnX, y: spawnY, angle: 0, lastShoot: 0, size, hp, maxHp: hp, speed, type, color });
}

function initGame() {
    score = 0; stage = 1;
    gameStartTime = Date.now(); // 게임 시작 시간 기록
    player.maxHp = 100; player.hp = 100; 
    player.x = 500; player.y = WORLD_SIZE / 2;
    player.vx = 0; player.vy = 0;
    base.hp = 15; base.maxHp = 15;
    enemies = []; bullets = []; particles = [];
}

window.addEventListener("keydown", e => { 
    keys[e.code] = true; 
    if (gameState === 'PLAY' && e.code === "KeyE") isAutoFire = !isAutoFire; 
});
window.addEventListener("keyup", e => keys[e.code] = false);
canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener("mousedown", () => {
    if (gameState === 'START') { initGame(); gameState = 'PLAY'; }
    else if (gameState === 'OVER') { gameState = 'START'; }
    isMouseDown = true;
});
window.addEventListener("mouseup", () => isMouseDown = false);

function fire(unit, type) {
    const now = Date.now();
    let currentFireRate;
    if (type === 'player') {
        currentFireRate = Math.max(player.minFireRate, player.baseFireRate - (score / 100) * 2);
    } else {
        currentFireRate = 1000; 
    }
    if (now - unit.lastShoot < currentFireRate) return;

    const bSpeed = (type === 'player') ? 18 : 6;
    const bSize = (type === 'player') ? 10 : 14;
    const spread = (type === 'player') ? (Math.random() - 0.5) * 0.1 : 0;

    bullets.push({
        x: unit.x + Math.cos(unit.angle) * 40, 
        y: unit.y + Math.sin(unit.angle) * 40,
        angle: unit.angle + spread, 
        speed: bSpeed, size: bSize, life: 100, owner: type
    });
    unit.lastShoot = now;
}

function update() {
    if (gameState !== 'PLAY') return;

    // --- [수정] 후반으로 갈수록 적이 점점 더 많이 나오는 로직 ---
    let timeElapsed = (Date.now() - gameStartTime) / 1000; // 경과 시간(초)
    // 시간이 지날수록, 스테이지가 높을수록 스폰 확률 증가
    let spawnProb = 0.01 + (timeElapsed * 0.0005) + (stage * 0.005);
    
    if (Math.random() < spawnProb && enemies.length < 50 + stage * 10) {
        spawnEnemy();
    }

    let calculatedMaxHp = 100 + Math.floor(score / 500) * 10;
    if (calculatedMaxHp > player.maxHp) {
        player.hp += (calculatedMaxHp - player.maxHp);
        player.maxHp = calculatedMaxHp;
    }

    if (keys["KeyW"]) player.vy -= 0.7; if (keys["KeyS"]) player.vy += 0.7;
    if (keys["KeyA"]) player.vx -= 0.7; if (keys["KeyD"]) player.vx += 0.7;
    player.vx *= 0.92; player.vy *= 0.92;
    player.x += player.vx; player.y += player.vy;
    player.x = Math.max(player.size, Math.min(WORLD_SIZE - player.size, player.x));
    player.y = Math.max(player.size, Math.min(WORLD_SIZE - player.size, player.y));

    if (isAutoFire || isMouseDown) fire(player, 'player');

    camera.x += (player.x - canvas.width / 2 - camera.x) * camera.lerp;
    camera.y += (player.y - canvas.height / 2 - camera.y) * camera.lerp;
    if (shakeTime > 0) shakeTime *= 0.9;
    player.angle = Math.atan2((mouse.y + camera.y) - player.y, (mouse.x + camera.x) - player.x);

    enemies.forEach(en => {
        en.angle = Math.atan2(player.y - en.y, player.x - en.x);
        en.x += Math.cos(en.angle) * en.speed;
        en.y += Math.sin(en.angle) * en.speed;
        if (Math.hypot(player.x - en.x, player.y - en.y) < 700) fire(en, 'enemy');
    });

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        if (--b.life <= 0) { bullets.splice(i, 1); continue; }

        if (b.owner === 'player' && Math.hypot(b.x - base.x, b.y - base.y) < base.size) {
            bullets.splice(i, 1); base.hp--; shakeTime = 10;
            if (base.hp <= 0) {
                stage++; score += 1000;
                base.hp = 15 + (stage * 10); base.maxHp = base.hp; // 기지 체력도 더 많이 증가
                createExplosion(base.x, base.y, "yellow", 50, 20);
            }
            continue;
        }

        enemies.forEach((en, enIdx) => {
            if (b.owner === 'player' && Math.hypot(b.x - en.x, b.y - en.y) < en.size) {
                bullets.splice(i, 1); en.hp--;
                createExplosion(b.x, b.y, en.color, 5, 5);
                if (en.hp <= 0) {
                    score += 100;
                    player.hp = Math.min(player.maxHp, player.hp + 2);
                    createExplosion(en.x, en.y, en.color, 15, 10);
                    enemies.splice(enIdx, 1);
                }
            }
        });

        if (b.owner === 'enemy' && Math.hypot(b.x - player.x, b.y - player.y) < player.size) {
            player.hp -= 5; bullets.splice(i, 1); shakeTime = 15;
            if (player.hp <= 0) gameState = 'OVER';
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function render() {
    ctx.fillStyle = "#151515"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'START' || gameState === 'OVER') {
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = "bold 50px Arial";
        ctx.fillText(gameState === 'START' ? "INFINITE SWARM" : "GAME OVER", canvas.width/2, canvas.height/2);
        ctx.font = "24px Arial";
        ctx.fillText(`SCORE: ${score} | 클릭하여 시작`, canvas.width/2, canvas.height/2 + 60);
    } else {
        ctx.save(); 
        ctx.translate(-camera.x + (Math.random()-0.5)*shakeTime, -camera.y + (Math.random()-0.5)*shakeTime);
        ctx.strokeStyle = "#333"; ctx.lineWidth = 10; ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);
        
        ctx.fillStyle = base.color;
        ctx.fillRect(base.x - base.size, base.y - base.size, base.size*2, base.size*2);
        ctx.fillStyle = "#333"; ctx.fillRect(base.x - base.size, base.y - base.size - 25, base.size*2, 12);
        ctx.fillStyle = "#FF4757"; ctx.fillRect(base.x - base.size, base.y - base.size - 25, (base.hp/base.maxHp)*base.size*2, 12);

        bullets.forEach(b => {
            ctx.fillStyle = b.owner === 'player' ? "#00ADEF" : "#FF4757";
            ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI*2); ctx.fill();
        });

        const drawUnit = (unit, color) => {
            ctx.save(); ctx.translate(unit.x, unit.y);
            ctx.fillStyle = "#333"; ctx.fillRect(-unit.size, -unit.size-15, unit.size*2, 8);
            ctx.fillStyle = (unit === player) ? "#00FF00" : color; 
            ctx.fillRect(-unit.size, -unit.size-15, (unit.hp/unit.maxHp)*unit.size*2, 8);
            ctx.rotate(unit.angle); ctx.fillStyle = color;
            ctx.fillRect(unit.size * 0.5, -unit.size * 0.3, unit.size * 1.2, unit.size * 0.6);
            ctx.beginPath(); ctx.arc(0, 0, unit.size, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        };

        drawUnit(player, "#00ADEF");
        enemies.forEach(en => drawUnit(en, en.color));

        particles.forEach(p => {
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1; ctx.restore();

        // UI
        ctx.fillStyle = "white"; ctx.textAlign = "left"; ctx.font = "bold 24px Arial";
        ctx.fillText(`STAGE: ${stage} | SCORE: ${score}`, 30, 50);
        
        // --- [수정] 미니맵에 적 표시 로직 ---
        const ms = 180; const mx = canvas.width - ms - 30; const my = canvas.height - ms - 30;
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)"; ctx.fillRect(mx, my, ms, ms);
        
        // 미니맵 - 기지
        ctx.fillStyle = "#FF4757"; ctx.fillRect(mx + (base.x/WORLD_SIZE)*ms - 5, my + (base.y/WORLD_SIZE)*ms - 5, 10, 10);
        
        // 미니맵 - 적 (하얀색 작은 점)
        ctx.fillStyle = "white";
        enemies.forEach(en => {
            ctx.beginPath();
            ctx.arc(mx + (en.x/WORLD_SIZE)*ms, my + (en.y/WORLD_SIZE)*ms, 1.5, 0, Math.PI*2);
            ctx.fill();
        });

        // 미니맵 - 나
        ctx.fillStyle = "#00ADEF"; ctx.beginPath(); ctx.arc(mx + (player.x/WORLD_SIZE)*ms, my + (player.y/WORLD_SIZE)*ms, 4, 0, Math.PI*2); ctx.fill();
    }
}

function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }
gameLoop();