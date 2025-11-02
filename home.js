const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let frames = 0;

// Nomes dos arquivos que você irá criar/modificar
const shipSprite = new Image();
shipSprite.src = 'images/ship_anim.png'; 

const asteroidSprite = new Image();
asteroidSprite.src = 'images/asteroid_anim.png'; 

const shieldSprite = new Image();
shieldSprite.src = 'images/shield_anim.png'; 

const bgSprite = new Image();
bgSprite.src = 'images/background.png'; 

const groundSprite = new Image(); 
groundSprite.src = 'images/ground.png'; 


const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- OBJETO NAVE (OVNI) ---
const ship = {
  x: 60, y: 150, 
  // --- Tamanho de exibição no canvas (o que você quer ver) ---
  w: 61, 
  h: 61, 
  
  gravity: 0.25, thrust: 4.6, speed: 0,
  isInvincible: false, 

  // --- Propriedades de Animação (BASEADO NA IMAGEM ORIGINAL 400x33 COM 4 FRAMES) ---
  currentFrame: 0,        
  frameCount: 4,          // Você confirmou que são 4 frames
  frameWidth: 58,        // A LARGURA REAL de CADA FRAME na sua imagem 'ship.png'
  frameHeight: 58,        // A ALTURA REAL de CADA FRAME na sua imagem 'ship.png'
  animSpeed: 6,           

  flap() { this.speed = -this.thrust; },
  
  update() {
    if (state.current === state.getReady) {
      this.y = 150;
      this.currentFrame = 0; 
    } else {
      this.speed += this.gravity;
      this.y += this.speed;
      if (this.y + this.h/2 >= canvas.height - 60) { 
        this.y = canvas.height - 60 - this.h/2;
        if (state.current === state.game) {
          if (!this.isInvincible) {
            state.current = state.over;
          }
          this.speed = 0; 
        }
      }
      if (this.y - this.h/2 < 0) {
        this.y = this.h/2;
        this.speed = 0;
      }

      if (state.current === state.game) {
        if (frames % this.animSpeed === 0) {
          this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
      }
    }
  },
  
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    let rotation = this.speed * 0.05;
    if (rotation > 0.4) rotation = 0.4;
    if (rotation < -0.4) rotation = -0.4;
    ctx.rotate(rotation);

    if (this.isInvincible && frames % 10 < 5) {
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalAlpha = 1.0;
    }

    // Calcula o "recorte" da imagem original (usa 100x33)
    const sx = this.currentFrame * this.frameWidth;
    const sy = 0; 

    // Desenha no canvas com o tamanho desejado (w=61, h=61)
    ctx.drawImage(
      shipSprite,            
      sx, sy,                
      this.frameWidth,       // Largura de 100 pixels do sprite sheet
      this.frameHeight,      // Altura de 33 pixels do sprite sheet
      -this.w / 2, -this.h / 2, // Posição centralizada
      this.w, this.h          // Tamanho de exibição 61x61
    );
    
    ctx.restore();
  },
  reset() { 
    this.y = 150; 
    this.speed = 0;
    this.isInvincible = false; 
    this.currentFrame = 0;
  }
};
// --- OBJETO ASTEROIDES ---
const asteroids = {
  list: [],
  gap: 130,
  dx: 2,
  spawnRate: 90,
  update() {
    if (state.current !== state.game) return;

    if (frames % this.spawnRate === 0) {
      const y = Math.random() * (canvas.height - 200) + 50;
      
      // --- AJUSTADO: Raio 'r' é 32 (metade de 64x64) ---
      const r = 32; 
      
      this.list.push({ 
        x: canvas.width + r, y, r,
        currentFrame: Math.floor(Math.random() * 4), 
        frameCount: 4,          
        frameWidth: 64,         // Largura de 1 frame
        frameHeight: 64,        // Altura de 1 frame
        animSpeed: 10           
      });
    }

    this.list.forEach((a, i) => {
      a.x -= this.dx;

      if (frames % a.animSpeed === 0) {
        a.currentFrame = (a.currentFrame + 1) % a.frameCount;
      }

      const distX = ship.x - a.x;
      const distY = ship.y - a.y;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      // Colisão (raio 32 + metade da nave 24)
      if (distance < a.r + (ship.w / 2) * 0.8) { 
        if (!ship.isInvincible) { 
          state.current = state.over;
        }
      }

      if (a.x + a.r < 0) { 
        this.list.splice(i, 1);
        score.value++;
        score.best = Math.max(score.best, score.value);
      }
    });
  },

  draw() {
    this.list.forEach((a) => {
      const sx = a.currentFrame * a.frameWidth;
      const sy = 0;
      
      // Desenha (1 para 1)
      ctx.drawImage(
        asteroidSprite,
        sx, sy,
        a.frameWidth,   // 64
        a.frameHeight,  // 64
        a.x - a.r, a.y - a.r, 
        a.r * 2, a.r * 2 // 64x64
      );
    });
  },
  reset() { this.list = []; }
};

// --- OBJETO SHIELD POWER-UP (CRISTAL) ---
const shieldPowerUp = {
  list: [],
  // --- AJUSTADO: Tamanho de exibição (32x32) ---
  w: 42, 
  h: 42, 
  
  dx: 2,
  spawnRate: 500, 
  duration: 5000, 

  update() {
    if (state.current !== state.game) return;

    if (frames % this.spawnRate === 0) {
      const y = Math.random() * (canvas.height - 200) + 50;
      
      this.list.push({ 
        x: canvas.width, y,
        currentFrame: 0,
        frameCount: 4,          
        frameWidth: 35,         // Largura de 1 frame
        frameHeight: 35,        // Altura de 1 frame
        animSpeed: 10           
      });
    }

    this.list.forEach((p, i) => {
      p.x -= this.dx;
      
      if (frames % p.animSpeed === 0) {
        p.currentFrame = (p.currentFrame + 1) % p.frameCount;
      }

      const shipLeft = ship.x - ship.w / 2;
      const shipRight = ship.x + ship.w / 2;
      const shipTop = ship.y - ship.h / 2;
      const shipBottom = ship.y + ship.h / 2;

      const pLeft = p.x - this.w / 2; 
      const pRight = p.x + this.w / 2;
      const pTop = p.y - this.h / 2;
      const pBottom = p.y + this.h / 2;

      if (shipRight > pLeft && shipLeft < pRight && shipBottom > pTop && shipTop < pBottom) {
        ship.isInvincible = true;
        this.list.splice(i, 1); 
        setTimeout(() => {
          ship.isInvincible = false;
        }, this.duration);
      }

      if (p.x + this.w < 0) {
        this.list.splice(i, 1);
      }
    });
  },

  draw() {
    this.list.forEach(p => {
      const sx = p.currentFrame * p.frameWidth;
      const sy = 0;

      ctx.save();
      ctx.translate(p.x, p.y); 
      ctx.rotate(frames * 0.02); 
      
      // Desenha (1 para 1)
      ctx.drawImage(
        shieldSprite,
        sx, sy,
        p.frameWidth,   // 32
        p.frameHeight,  // 32
        -this.w / 2, -this.h / 2, 
        this.w, this.h          // 32, 32
      );
      
      ctx.restore();
    });
  },

  reset() {
    this.list = [];
  }
};

// --- Ground e Score (sem mudanças) ---
const ground = {
  y: canvas.height - 60,
  draw() {
    ctx.drawImage(groundSprite, 0, this.y, canvas.width, 60);
  }
};


const score = { 
  value: 0, 
  best: 0,
  draw() {
    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    if (state.current === state.game) {
      ctx.fillText(`Pontos: ${this.value}`, 20, 40);
    } else if (state.current === state.over) {
      ctx.fillText(`Score: ${this.value}`, canvas.width/2 - 80, 250);
      ctx.fillText(`Melhor: ${this.best}`, canvas.width/2 - 80, 300);
      ctx.fillText('Clique ou Espaço para reiniciar', canvas.width/2 - 160, 370);
    } else {
      ctx.fillText('Clique ou Espaço para começar', canvas.width/2 - 180, canvas.height/2);
    }
  },
  reset() { this.value = 0; }
};

function draw() {
  ctx.drawImage(bgSprite, 0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = 'rgba(255,255,255,' + Math.random() + ')';
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  asteroids.draw();
  shieldPowerUp.draw(); 
  ground.draw(); 
  ship.draw();
  score.draw();
}

function update() {
  ship.update();
  asteroids.update();
  shieldPowerUp.update(); 
}

function loop() {
  update();
  draw();
  frames++;
  requestAnimationFrame(loop);
}

function restart() {
  asteroids.reset();
  ship.reset();
  score.reset();
  shieldPowerUp.reset(); 
  state.current = state.getReady;
}

canvas.addEventListener('click', () => {
  if (state.current === state.getReady) state.current = state.game;
  else if (state.current === state.game) ship.flap();
  else if (state.current === state.over) restart();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (state.current === state.getReady) state.current = state.game;
    else if (state.current === state.game) ship.flap();
    else if (state.current === state.over) restart();
  }
});

window.addEventListener('load', loop);