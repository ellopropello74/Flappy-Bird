var game;
var FPS = 60;

var images = {};
var sounds = {};

var speed = function (fps) {
  FPS = parseInt(fps);
};

var loadImages = function (sources, callback) {
  var nb = 0;
  var loaded = 0;
  var imgs = {};
  for (var i in sources) {
    nb++;
    imgs[i] = new Image();
    imgs[i].src = sources[i];
    imgs[i].onload = function () {
      loaded++;
      if (loaded === nb) {
        callback(imgs);
      }
    };
  }
};

var loadSounds = function (sources, callback) {
  var nb = 0;
  var loaded = 0;
  var sds = {};
  for (var i in sources) {
    nb++;
    sds[i] = new Audio();
    sds[i].src = sources[i];
    sds[i].onloadeddata = function () {
      loaded++;
      if (loaded === nb) {
        callback(sds);
      }
    };
  }
};

var Bird = function () {
  this.x = 80;
  this.y = 250;
  this.width = 40;
  this.height = 30;

  this.alive = true;
  this.gravity = 0;
  this.velocity = 0.3;
  this.jump = -6;
};

Bird.prototype.flap = function () {
  this.gravity = this.jump;
  sounds.flap.play();
};

Bird.prototype.update = function () {
  this.gravity += this.velocity;
  this.y += this.gravity;
};

Bird.prototype.isDead = function (height, pipes) {
  if (this.y >= height || this.y + this.height <= 0) {
    return true;
  }
  for (var i in pipes) {
    var pipe = pipes[i];

    var birdRight = this.x + this.width;
    var birdBottom = this.y + this.height;

    var pipeRight = pipe.x + pipe.width;
    var pipeBottom = pipe.y + pipe.height;

    if (
      this.x < pipeRight &&
      birdRight > pipe.x &&
      this.y < pipeBottom &&
      birdBottom > pipe.y
    ) {
      return true;
    }
  }
  return false;
};

var Pipe = function (json) {
  this.x = 0;
  this.y = 0;
  this.width = 50;
  this.height = 40;
  this.speed = 3;

  this.init(json);
};

Pipe.prototype.init = function (json) {
  for (var i in json) {
    this[i] = json[i];
  }
};

Pipe.prototype.update = function () {
  this.x -= this.speed;
};

Pipe.prototype.isOut = function () {
  return this.x + this.width < 0;
};

var Game = function () {
  this.pipes = [];
  this.bird = new Bird();
  this.score = 0;
  this.highScore = localStorage.getItem("highScore") || 0;
  this.canvas = document.querySelector("#flappy");
  this.ctx = this.canvas.getContext("2d");
  this.width = this.canvas.width;
  this.height = this.canvas.height;
  this.spawnInterval = 90;
  this.interval = 0;
  this.backgroundSpeed = 0.5;
  this.backgroundx = 0;
  this.restartButton = document.querySelector(".restart");
  this.updateTimeout = null;
  this.displayAnimationFrame = null;
};

Game.prototype.start = function () {
  this.interval = 0;
  this.score = 0;
  this.pipes = [];
  this.bird = new Bird();
  this.restartButton.style.display = "none";
  clearTimeout(this.updateTimeout);
  cancelAnimationFrame(this.displayAnimationFrame);
  this.update();
  this.display();
  sounds.backgroundMusic.loop = true;
  sounds.backgroundMusic.play();
};

Game.prototype.update = function () {
  this.backgroundx += this.backgroundSpeed;

  if (this.bird.alive) {
    this.bird.update();
    if (this.bird.isDead(this.height, this.pipes)) {
      this.bird.alive = false;
      sounds.hit.play();
      this.gameOver();
    }
  }

  for (var i = 0; i < this.pipes.length; i++) {
    this.pipes[i].update();
    if (this.pipes[i].isOut()) {
      this.pipes.splice(i, 1);
      i--;
      if (this.bird.alive) {
        sounds.score.play();
      }
    }
  }

  if (this.interval === 0) {
    var deltaBord = 50;
    var pipeHoll = 120;
    var hollPosition =
      Math.round(Math.random() * (this.height - deltaBord * 2 - pipeHoll)) +
      deltaBord;
    this.pipes.push(new Pipe({ x: this.width, y: 0, height: hollPosition }));
    this.pipes.push(
      new Pipe({
        x: this.width,
        y: hollPosition + pipeHoll,
        height: this.height,
      })
    );
  }

  this.interval++;
  if (this.interval === this.spawnInterval) {
    this.interval = 0;
  }

  if (this.bird.alive) {
    this.score++;
  }

  var self = this;
  this.updateTimeout = setTimeout(function () {
    self.update();
  }, 1000 / FPS);
};

Game.prototype.gameOver = function () {
  if (this.score > this.highScore) {
    this.highScore = this.score;
    localStorage.setItem("highScore", this.highScore);
  }
  this.restartButton.style.display = "block";
  sounds.backgroundMusic.pause();
  sounds.backgroundMusic.currentTime = 0;
};

Game.prototype.display = function () {
  this.ctx.clearRect(0, 0, this.width, this.height);
  for (
    var i = 0;
    i < Math.ceil(this.width / images.background.width) + 1;
    i++
  ) {
    this.ctx.drawImage(
      images.background,
      i * images.background.width -
        Math.round(this.backgroundx % images.background.width),
      0
    );
  }

  for (var i in this.pipes) {
    if (i % 2 === 0) {
      this.ctx.drawImage(
        images.pipetop,
        this.pipes[i].x,
        this.pipes[i].y + this.pipes[i].height - images.pipetop.height,
        this.pipes[i].width,
        images.pipetop.height
      );
    } else {
      this.ctx.drawImage(
        images.pipebottom,
        this.pipes[i].x,
        this.pipes[i].y,
        this.pipes[i].width,
        images.pipetop.height
      );
    }
  }

  this.ctx.fillStyle = "#FFC600";
  this.ctx.strokeStyle = "#CE9E00";
  if (this.bird.alive) {
    this.ctx.save();
    this.ctx.translate(
      this.bird.x + this.bird.width / 2,
      this.bird.y + this.bird.height / 2
    );
    this.ctx.rotate(((Math.PI / 2) * this.bird.gravity) / 20);
    this.ctx.drawImage(
      images.bird,
      -this.bird.width / 2,
      -this.bird.height / 2,
      this.bird.width,
      this.bird.height
    );
    this.ctx.restore();
  }

  this.ctx.fillStyle = "white";
  this.ctx.font = "20px Oswald, sans-serif";
  this.ctx.fillText("Score : " + this.score, 10, 25);
  this.ctx.fillText("High Score : " + this.highScore, 10, 50);

  var self = this;
  this.displayAnimationFrame = requestAnimationFrame(function () {
    self.display();
  });
};

function restartGame() {
  game.start();
}

window.onload = function () {
  var sprites = {
    bird: "./img/bird.png",
    background: "./img/background.png",
    pipetop: "./img/pipetop.png",
    pipebottom: "./img/pipebottom.png",
  };

  var soundsSrc = {
    flap: "./sounds/flap.wav",
    score: "./sounds/score.wav",
    hit: "./sounds/hit.wav",
    backgroundMusic: "./sounds/background.mp3",
  };

  loadImages(sprites, function (imgs) {
    images = imgs;
    loadSounds(soundsSrc, function (sds) {
      sounds = sds;
      game = new Game();
      game.start();

      // Event listeners should be added after the game is initialized
      document.addEventListener("keydown", function (event) {
        if (event.code === "Space") {
          game.bird.flap();
        }
      });

      document.addEventListener("touchstart", function () {
        game.bird.flap();
      });
    });
  });
};
