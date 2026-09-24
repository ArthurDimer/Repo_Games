const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")


// x, y ---> Posicionar o objeto
// w, h ---> Definir o tamanho do personagem
// vx ---> Define a velocidade horizontal


const player = {x: 40, y: 160, w: 32, h: 32, vx: 120, vy: 120}


let last = 0 // Marca a posição do quadro anterior


function update(dt) {
    player.x += player.vx * dt; //Eu utilizei o dt porque quando eu multiplico por ele(dt), ele altera o tempo entre um quadro e outro
    player.y += player.vy * dt;

    // Vai Quica nas laterais
    if (player.x - player.w / 2 <= 0) {
        player.x = player.w / 2;
        player.vx *= -1;
    }

    if (player.x + player.w / 2 >= canvas.width) {
        player.x = canvas.width - player.w / 2;
        player.vx *= -1;
    }

    // Quica em cima e embaixo
    if (player.y - player.h / 2 <= 0) {
        player.y = player.h / 2;
        player.vy *= -1;
    }

    if (player.y + player.h / 2 >= canvas.height) {
        player.y = canvas.height - player.h / 2;
        player.vy *= -1;
    }
}

function draw () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#4ade80"
    ctx.beginPath();
    ctx.arc(
    player.x,
    player.y,
    player.w / 2,
    0,
    Math.PI * 2
    );

    ctx.fill();

//desenha o texto
    ctx.fillStyle = "#fff"
    ctx.fillText(
        "O DeltaTime - dt independe da taxa de quadros",
        12,
        20
        );

    ctx.fillText("O DeltaTime - dt independe da taxa de quadros", 12, 20)
}


function loop (ts) {
    if (!last) {
        last = ts
    }


    const dt = Math.min(0.05, (ts - last)/1000) // 1ms = 1s /1000
    update(dt)
    draw()
    requestAnimationFrame(loop)
}


requestAnimationFrame(loop) // Responsável por executar o primeiro disparo