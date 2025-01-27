import * as meta from "./meta.mjs";

const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

const images = [];
const zoom = 0.5;
const snapDistance = 50;
const nonTextAnchor = { x: 0, y: 400 };
// const drawAtTargets = true;
const drawAtTargets = false;
let draggingImage = null;
let offsetX, offsetY;
let score = 0;
let totalScore = 0;

class DraggableImage {
  constructor(name, meta, path, isText) {
    const { x, y, target, draggable = true } = meta;
    this.isText = isText;
    this.target = target;
    this.name = name;
    this.image = new Image();
    this.image.src = path;
    this.x = x || 0;
    this.y = y || 0;

    if (!isText) {
      this.x += nonTextAnchor.x;
      this.y += nonTextAnchor.y;
      if (this.target) {
        this.target.x += nonTextAnchor.x;
        this.target.y += nonTextAnchor.y;
      }
    }
    this.draggable = draggable;
    this.image.onload = () => {
      this.width = this.image.width * zoom;
      this.height = this.image.height * zoom;
      drawAll();
    };
  }

  drawPoint() {
    const { width, height, target } = this;
    const px = target.x + width / 2;
    const py = target.y + height / 2;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();
  }

  draw() {
    if (this.isText) {
      this.drawPoint(this.target);
    }
    const { x, y } = drawAtTargets && this.target ? this.target : this;
    ctx.drawImage(this.image, x, y, this.width, this.height);
  }

  isMouseOver(mx, my) {
    return (
      mx > this.x &&
      mx < this.x + this.width &&
      my > this.y &&
      my < this.y + this.height
    );
  }
}

function win() {
  document.querySelector(".gifs").style.visibility = "visible";
}

function drawScore() {
  const scoreText = `Score: ${score}/${totalScore}`;
  const fontSize = 40;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = "green";
  const textWidth = ctx.measureText(scoreText).width;
  const x = 300;
  const y = fontSize;

  ctx.fillStyle = "white";
  // ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(x - 10, y - fontSize, textWidth + 20, fontSize + 10);
  ctx.fillStyle = "green";
  ctx.fillText(scoreText, x, y);
  if (score === totalScore) {
    win();
  }
}

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  images.forEach((img) => img.draw());
  drawScore();
}

function onDragStart(dragObj) {
  const { clientX, clientY } = dragObj;
  images.forEach((img) => {
    if (img.draggable && img.isMouseOver(clientX, clientY)) {
      draggingImage = img;
      offsetX = clientX - img.x;
      offsetY = clientY - img.y;
    }
  });
}

function onDrag(dragObj) {
  const { clientX, clientY } = dragObj;
  if (draggingImage) {
    draggingImage.x = clientX - offsetX;
    draggingImage.y = clientY - offsetY;
    drawAll();
  }
}

function onDragEnd() {
  if (draggingImage) {
    const { name, x, y, target } = draggingImage;
    // console.log(`${name}: { x: ${x}, y: ${y} },`);
    if (target) {
      const dx = x - target.x;
      const dy = y - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // console.log(name, "distance", distance);
      if (distance < snapDistance) {
        draggingImage.x = target.x;
        draggingImage.y = target.y;
        draggingImage.draggable = false;

        draggingImage.flashI = 0;
        const flasher = flashImage.bind(null, draggingImage);
        const flashInterval = setInterval(flasher, 100);
        setTimeout(() => {
          clearInterval(flashInterval);
          drawAll();
        }, 1000);
        score += 1;
        // console.log(name, "snapped");
      }
    }
    drawAll();
  }
  draggingImage = null;
}

function flashImage(image) {
  ctx.strokeStyle = image.flashI % 2 === 0 ? "red" : "yellow";
  image.flashI += 1;
  ctx.lineWidth = 5;
  ctx.strokeRect(image.x, image.y, image.width, image.height);
}

function getTouchListener(listener) {
  return function (ev) {
    ev.preventDefault();
    const touch = ev.touches[0];
    listener(touch);
  };
}

function init() {
  totalScore =
    Object.keys(meta.images).length + Object.keys(meta.texts).length - 1;
  for (const name in meta.images) {
    const path = `./assets/${name}.png`;
    images.push(new DraggableImage(name, meta.images[name], path));
  }
  for (const name in meta.texts) {
    const path = `./assets/${name}.png`;
    images.push(new DraggableImage(name, meta.texts[name], path, true));
  }

  canvas.addEventListener("touchstart", getTouchListener(onDragStart));
  canvas.addEventListener("touchmove", getTouchListener(onDrag));
  canvas.addEventListener("touchend", onDragEnd);
  canvas.addEventListener("mousedown", onDragStart);
  canvas.addEventListener("mousemove", onDrag);
  canvas.addEventListener("mouseup", onDragEnd);
}

init();
