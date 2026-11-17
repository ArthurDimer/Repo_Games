const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const wavesEl = document.getElementById("wave");

const KEYS = {};

let player;
let bullets;
let enemies;
let score;
let lives;
let waves;
let last;
let gameOver;
let pause;
let spawnTimer;

// Quando uma tecla é pressionada
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    KEYS[key] = true;

    // Impede que espaço e setas movimentem a página
    if (
        [" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)
    ) {
        e.preventDefault();
    }

    // O !e.repeat impede que a pausa ligue e desligue várias vezes
    if (key === "p" && !e.repeat && !gameOver) {
        pause = !pause;

        // Evita que o dt fique muito alto depois da pausa
        last = performance.now();
    }

    // Reinicia o jogo quando estiver em Game Over
    if (key === "r" && gameOver) {
        startGame();
    }
});

// Quando uma tecla é solta
window.addEventListener("keyup", (e) => {
    KEYS[e.key.toLowerCase()] = false;
});

// Verifica a colisão entre dois objetos
function aabb(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

class Player {
    constructor() {
        this.w = 36;
        this.h = 28;
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 56;
        this.speed = 280;
        this.cooldown = 0;
    }

    update(dt) {
        // Movimento para a esquerda
        if (KEYS["a"] || KEYS["arrowleft"]) {
            this.x -= this.speed * dt;
        }

        // Movimento para a direita
        if (KEYS["d"] || KEYS["arrowright"]) {
            this.x += this.speed * dt;
        }

        // Impede que o jogador saia da tela
        this.x = Math.max(
            0,
            Math.min(canvas.width - this.w, this.x)
        );

        this.cooldown -= dt;

        // Tiro normal com espaço
        if (KEYS[" "] && this.cooldown <= 0) {
            bullets.push(
                new Bullet(
                    this.x + this.w / 2 - 3,
                    this.y
                )
            );

            this.cooldown = 0.22;
        }
    }

    draw() {
        // Nave desenhada como um losango, não como triângulo
        ctx.fillStyle = "#38bdf8";

        ctx.beginPath();
        ctx.moveTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h / 2);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        ctx.lineTo(this.x, this.y + this.h / 2);
        ctx.closePath();
        ctx.fill();

        // Parte central da nave
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(
            this.x + this.w / 2 - 3,
            this.y + 8,
            6,
            12
        );
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 6;
        this.h = 14;
        this.speed = 420;
        this.dead = false;
    }

    update(dt) {
        this.y -= this.speed * dt;

        // Marca o tiro para remoção quando sair da tela
        if (this.y + this.h < 0) {
            this.dead = true;
        }
    }

    draw() {
        ctx.fillStyle = "#facc15";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

class Enemy {
    constructor(x, y, speed, type) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.dead = false;
        this.type = type;

        // Rápido e pequeno
        if (type === "fast") {
            this.w = 20;
            this.h = 20;
        } else {
            // Lento e largo
            this.w = 40;
            this.h = 40;
        }
    }

    update(dt) {
        this.y += this.speed * dt;

        /*
        Regra de falha:
        quando um inimigo escapa pela parte inferior da tela,
        o jogador perde uma vida.
        */

        if (this.y >= canvas.height) {
            this.dead = true;
            lives -= 1;

            if (lives <= 0) {
                lives = 0;
                gameOver = true;
            }
        }
    }

    draw() {
        if (this.type === "fast") {
            ctx.fillStyle = "#facc15";

            // Inimigo rápido em formato de losango
            ctx.beginPath();
            ctx.moveTo(this.x + this.w / 2, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h / 2);
            ctx.lineTo(this.x + this.w / 2, this.y + this.h);
            ctx.lineTo(this.x, this.y + this.h / 2);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = "#ef4444";

            // Inimigo lento e largo
            ctx.fillRect(this.x, this.y, this.w, this.h);

            ctx.fillStyle = "#7f1d1d";
            ctx.fillRect(
                this.x + 8,
                this.y + 8,
                this.w - 16,
                this.h - 16
            );
        }
    }
}

function startGame() {
    player = new Player();
    bullets = [];
    enemies = [];

    score = 0;
    lives = 3;
    waves = 1;

    spawnTimer = 0;
    pause = false;
    gameOver = false;
    last = 0;

    // Limpa as teclas que ficaram pressionadas
    Object.keys(KEYS).forEach((key) => {
        KEYS[key] = false;
    });

    syncHud();
}

function update(dt) {
    if (pause || gameOver) {
        return;
    }

    player.update(dt);

    bullets.forEach((bullet) => {
        bullet.update(dt);
    });

    enemies.forEach((enemy) => {
        enemy.update(dt);
    });

    spawnWave(dt);

    // Colisões entre tiros e inimigos
    bullets.forEach((bullet) => {
        enemies.forEach((enemy) => {
            if (
                !bullet.dead &&
                !enemy.dead &&
                aabb(bullet, enemy)
            ) {
                bullet.dead = true;
                enemy.dead = true;
                score += 15;
            }
        });
    });

    // Colisões entre inimigos e o jogador
    enemies.forEach((enemy) => {
        if (
            !enemy.dead &&
            aabb(enemy, player)
        ) {
            enemy.dead = true;
            lives -= 1;

            if (lives <= 0) {
                lives = 0;
                gameOver = true;
            }
        }
    });

    /*
    Nenhum splice é usado dentro do forEach.
    Os objetos mortos são filtrados somente depois dos loops.
    */
    enemies = enemies.filter((enemy) => !enemy.dead);
    bullets = bullets.filter((bullet) => !bullet.dead);

    // Passa uma onda a cada 100 pontos
    const expectedWave = Math.floor(score / 100) + 1;

    if (expectedWave > waves) {
        waves = expectedWave;
    }

    syncHud();
}

function spawnWave(dt) {
    spawnTimer += dt;

    /*
    TUNE DA ONDA:

    Quantidade:
    começa com 1 inimigo por grupo e ganha mais 1
    a cada duas ondas.

    Velocidade:
    o rápido começa em 160 px/s e ganha 20 px/s por onda.
    O lento começa em 95 px/s e ganha 15 px/s por onda.

    Intervalo:
    começa em 1 segundo. O mínimo é 0,45 segundo,
    para o jogo ficar mais difícil sem se tornar impossível.
    */

    const interval = Math.max(0.45, 1 - (waves - 1) * 0.05);

    if (spawnTimer >= interval) {
        spawnTimer = 0;

        const amount = 1 + Math.floor((waves - 1) / 2);

        for (let i = 0; i < amount; i++) {
            const type = Math.random() > 0.5
                ? "fast"
                : "tank";

            const enemyWidth = type === "fast" ? 20 : 40;

            const x = Math.random() * (
                canvas.width - enemyWidth
            );

            const speed = type === "fast"
                ? 140 + waves * 20
                : 80 + waves * 15;

            enemies.push(
                new Enemy(
                    x,
                    -40 - i * 50,
                    speed,
                    type
                )
            );
        }
    }
}

function draw() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Fundo escuro
    ctx.fillStyle = "#020617";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Estrelas
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = "#c4b4b4";

        ctx.fillRect(
            (i * 97) % canvas.width,
            (i * 53) % canvas.height,
            2,
            2
        );
    }

    player.draw();

    enemies.forEach((enemy) => {
        enemy.draw();
    });

    bullets.forEach((bullet) => {
        bullet.draw();
    });

    if (pause) {
        drawOverlay(
            "PAUSA",
            "Pressione P para continuar"
        );
    }

    if (gameOver) {
        drawOverlay(
            "GAME OVER",
            "Pressione R para reiniciar"
        );
    }
}

function drawOverlay(text, sub) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "bold 40px sans-serif";
    ctx.fillText(
        text,
        canvas.width / 2,
        canvas.height / 2
    );

    ctx.font = "20px sans-serif";
    ctx.fillText(
        sub,
        canvas.width / 2,
        canvas.height / 2 + 40
    );
}

function syncHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    wavesEl.textContent = waves;
}

function gameLoop(timestamp) {
    // Impede um dt muito alto no primeiro frame
    if (last === 0) {
        last = timestamp;
    }

    const dt = Math.min(
        (timestamp - last) / 1000,
        0.1
    );

    last = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

startGame();
requestAnimationFrame(gameLoop);