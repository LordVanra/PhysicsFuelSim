const canvas = document.getElementById("c");
const container = document.getElementById("container");
const info = document.getElementById("info");
const velXInput = document.getElementById("velX");
const velYInput = document.getElementById("velY");
const velXVal = document.getElementById("velXVal");
const velYVal = document.getElementById("velYVal");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f2ee);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 9.5, -20);
camera.lookAt(0, 2, 10);

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.95);
sun.position.set(9, 15, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 70;
sun.shadow.camera.left = -16;
sun.shadow.camera.right = 16;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -16;
scene.add(sun);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: 0xe3ddd1 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(40, 40, 0xc8c0b3, 0xdcd5c9);
grid.position.y = 0.01;
scene.add(grid);

const square = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.4, 2),
  new THREE.MeshLambertMaterial({ color: 0x2c6fdb })
);
square.castShadow = true;
const squareBaseY = 0.3;
const xBounds = { min: -5.5, max: 5.5 };
const zBounds = { min: -2.0, max: 6.4 };
let squareDirX = 1;
let squareDirZ = 1;
let squareSpeedX = Number(velXInput.value);
let squareSpeedY = Number(velYInput.value);
square.position.set(0, squareBaseY, 0);
scene.add(square);

function updateRobotSpeeds() {
  squareSpeedX = Number(velXInput.value);
  squareSpeedY = Number(velYInput.value);
  velXVal.textContent = squareSpeedX.toFixed(1);
  velYVal.textContent = squareSpeedY.toFixed(1);
}

velXInput.addEventListener("input", updateRobotSpeeds);
velYInput.addEventListener("input", updateRobotSpeeds);
updateRobotSpeeds();

const targetRadius = 1.1;
const targetThickness = 0.24;
const targetTopY = 2.7;
const targetPosition = new THREE.Vector3(0, targetTopY - targetThickness * 0.5, 10.2);

const targetPole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.14, 0.14, targetTopY - targetThickness, 22),
  new THREE.MeshLambertMaterial({ color: 0x7a7263 })
);
targetPole.position.set(targetPosition.x, (targetTopY - targetThickness) * 0.5, targetPosition.z);
targetPole.castShadow = true;
scene.add(targetPole);

const targetTopMaterial = new THREE.MeshLambertMaterial({ color: 0xcc4343 });
const targetTop = new THREE.Mesh(
  new THREE.CylinderGeometry(targetRadius, targetRadius, targetThickness, 44),
  targetTopMaterial
);
targetTop.position.copy(targetPosition);
targetTop.receiveShadow = true;
targetTop.castShadow = true;
scene.add(targetTop);

const targetRing = new THREE.Mesh(
  new THREE.RingGeometry(0.36, 0.7, 36),
  new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
);
targetRing.rotation.x = -Math.PI / 2;
targetRing.position.set(targetPosition.x, targetTopY + 0.003, targetPosition.z);
scene.add(targetRing);

const targetCore = new THREE.Mesh(
  new THREE.CircleGeometry(0.24, 32),
  new THREE.MeshLambertMaterial({ color: 0x1f1f1f, side: THREE.DoubleSide })
);
targetCore.rotation.x = -Math.PI / 2;
targetCore.position.set(targetPosition.x, targetTopY + 0.004, targetPosition.z);
scene.add(targetCore);

const ballRadius = 0.35;
const sharedBallGeometry = new THREE.SphereGeometry(ballRadius, 28, 28);

const balls = [];
let score = 0;
let hitFlashTime = 0;

const gravity = -9.8;
const restitution = 0.6;
const floorY = ballRadius;

function launchBall() {
  const mesh = new THREE.Mesh(
    sharedBallGeometry,
    new THREE.MeshLambertMaterial({ color: 0xf0cf53 })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.position.set(square.position.x, square.position.y + 0.62, square.position.z);
  scene.add(mesh);

  // Balls inherit the square's current motion at launch.
  const inheritedVx = square.userData.vx ?? (squareDirX * squareSpeedX);
  const inheritedVz = square.userData.vz ?? (squareDirZ * squareSpeedY);
  const toTargetX = targetPosition.x - mesh.position.x;
  const toTargetZ = targetPosition.z - mesh.position.z;
  const travelTime = 1.15;
  balls.push({
    mesh,
    vx: inheritedVx + (toTargetX / travelTime) + (Math.random() * 0.6 - 0.3),
    vy: 6.6 + Math.random() * 1.1,
    vz: inheritedVz + (toTargetZ / travelTime) + Math.random() * 0.7,
    bounces: 0
  });
}

function resetScene() {
  for (const ball of balls) {
    scene.remove(ball.mesh);
    ball.mesh.material.dispose();
  }
  balls.length = 0;
  score = 0;
  square.position.set(0, squareBaseY, 0);
  squareDirX = 1;
  squareDirZ = 1;
}

document.getElementById("btnLaunch").addEventListener("click", launchBall);
document.getElementById("btnReset").addEventListener("click", resetScene);

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

let previous = performance.now() * 0.001;

function animate(nowMs) {
  requestAnimationFrame(animate);

  const now = nowMs * 0.001;
  const dt = Math.min(0.033, Math.max(0.001, now - previous));
  previous = now;

  const oldX = square.position.x;
  const oldZ = square.position.z;
  square.position.x += squareDirX * squareSpeedX * dt;
  square.position.z += squareDirZ * squareSpeedY * dt;
  square.position.y = squareBaseY;

  if (square.position.x >= xBounds.max) {
    square.position.x = xBounds.max;
    squareDirX = -1;
  } else if (square.position.x <= xBounds.min) {
    square.position.x = xBounds.min;
    squareDirX = 1;
  }

  if (square.position.z >= zBounds.max) {
    square.position.z = zBounds.max;
    squareDirZ = -1;
  } else if (square.position.z <= zBounds.min) {
    square.position.z = zBounds.min;
    squareDirZ = 1;
  }

  square.userData.vx = (square.position.x - oldX) / dt;
  square.userData.vz = (square.position.z - oldZ) / dt;

  for (let i = balls.length - 1; i >= 0; i -= 1) {
    const b = balls[i];
    const prevY = b.mesh.position.y;
    b.vy += gravity * dt;

    b.mesh.position.x += b.vx * dt;
    b.mesh.position.y += b.vy * dt;
    b.mesh.position.z += b.vz * dt;

    b.mesh.rotation.x += 2.8 * dt;
    b.mesh.rotation.z += 1.9 * dt;

    if (b.mesh.position.y <= floorY && b.vy < 0) {
      b.mesh.position.y = floorY;
      b.vy *= -restitution;
      b.vx *= 0.9;
      b.vz *= 0.9;
      b.bounces += 1;
    }

    const crossedTargetTop = prevY - ballRadius >= targetTopY && b.mesh.position.y - ballRadius <= targetTopY;
    const dx = b.mesh.position.x - targetPosition.x;
    const dz = b.mesh.position.z - targetPosition.z;
    const radialHit = dx * dx + dz * dz <= targetRadius * targetRadius;
    if (crossedTargetTop && radialHit && b.vy < 0) {
      score += 1;
      hitFlashTime = 0.18;
      scene.remove(b.mesh);
      b.mesh.material.dispose();
      balls.splice(i, 1);
      continue;
    }

    const outOfBounds =
      Math.abs(b.mesh.position.x) > 20 ||
      b.mesh.position.z > 30 ||
      b.mesh.position.z < -18 ||
      b.mesh.position.y < -4 ||
      b.bounces > 7;

    if (outOfBounds) {
      scene.remove(b.mesh);
      b.mesh.material.dispose();
      balls.splice(i, 1);
    }
  }

  if (hitFlashTime > 0) {
    hitFlashTime = Math.max(0, hitFlashTime - dt);
    targetTopMaterial.color.setHex(0x37b866);
  } else {
    targetTopMaterial.color.setHex(0xcc4343);
  }

  info.textContent = "balls: " + balls.length + " | points: " + score;
  renderer.render(scene, camera);
}

animate(performance.now());
