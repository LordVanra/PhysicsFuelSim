const canvas = document.getElementById("c");
const container = document.getElementById("container");
const info = document.getElementById("info");
const velXInput = document.getElementById("velX");
const velYInput = document.getElementById("velY");
const velXVal = document.getElementById("velXVal");
const velYVal = document.getElementById("velYVal");
const aimThetaInput = document.getElementById("aimTheta");
const aimRInput = document.getElementById("aimR");
const aimThetaVal = document.getElementById("aimThetaVal");
const aimRVal = document.getElementById("aimRVal");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f2ee);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 9.5, -20);
camera.lookAt(0, 2, 10);

const cameraController = window.createCameraController
  ? window.createCameraController({
      camera,
      canvas,
      initialTarget: new THREE.Vector3(0, 2, 10)
    })
  : null;

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
  new THREE.BoxGeometry(3, 0.5, 3),
  new THREE.MeshLambertMaterial({ color: 0x2c6fdb })
);
square.castShadow = true;
const squareBaseY = 0.3;
const xBounds = { min: -5.5, max: 5.5 };
const zBounds = { min: -2.8, max: 3.8 };
const squareStartX = xBounds.min;
const squareStartZ = zBounds.min;
let squareSpeedX = Number(velXInput.value);
let squareSpeedY = Number(velYInput.value);
square.position.set(squareStartX, squareBaseY, squareStartZ);
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

const targetWidth = 2;
const targetDepth = 2;
const targetHeight = 6;
const targetTopY = targetHeight;
const targetHalfWidth = targetWidth * 0.5;
const targetHalfDepth = targetDepth * 0.5;
const targetHalfHeight = targetHeight * 0.5;
const targetPosition = new THREE.Vector3(0, targetHalfHeight, 8);

const targetTopMaterial = new THREE.MeshLambertMaterial({ color: 0xcc4343 });
const targetTop = new THREE.Mesh(
  new THREE.BoxGeometry(targetWidth, targetHeight, targetDepth),
  targetTopMaterial
);
targetTop.position.copy(targetPosition);
targetTop.receiveShadow = true;
targetTop.castShadow = true;
scene.add(targetTop);

const aimMarkerMaterial = new THREE.MeshLambertMaterial({ color: 0x2f556e });
const aimMarkerRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.35, 0.07, 12, 28),
  aimMarkerMaterial
);
aimMarkerRing.rotation.x = Math.PI / 2;
aimMarkerRing.castShadow = true;
scene.add(aimMarkerRing);

const aimMarkerDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 14, 14),
  aimMarkerMaterial
);
aimMarkerDot.castShadow = true;
scene.add(aimMarkerDot);

const ballRadius = 0.5;
const sharedBallGeometry = new THREE.SphereGeometry(ballRadius, 28, 28);

const balls = [];
let score = 0;
let hitFlashTime = 0;

const gravity = -32;
const restitution = 0.6;
const floorY = ballRadius;
const targetCollisionRestitution = 0.44;
const targetCollisionFriction = 0.92;
const aimMinRadius = 0;
const aimCenterX = 0;
const aimCenterZ = 0;

function getDesiredAimPoint() {
  const thetaRad = (Number(aimThetaInput.value) * Math.PI) / 180;
  const r = Math.max(aimMinRadius, Number(aimRInput.value));
  const offsetX = Math.sin(thetaRad) * r;
  const offsetZ = Math.cos(thetaRad) * r;
  return new THREE.Vector3(
    aimCenterX + offsetX,
    targetTopY,
    aimCenterZ + offsetZ
  );
}

function updateAimMarker() {
  const aimPoint = getDesiredAimPoint();
  aimMarkerRing.position.set(aimPoint.x, targetTopY + 0.07, aimPoint.z);
  aimMarkerDot.position.set(aimPoint.x, targetTopY + 0.15, aimPoint.z);
}

function updateAimUIAndMarker() {
  const thetaDeg = Number(aimThetaInput.value);
  const r = Number(aimRInput.value);
  aimThetaVal.textContent = thetaDeg.toFixed(0) + "°";
  aimRVal.textContent = r.toFixed(1);
  updateAimMarker();
}

aimThetaInput.addEventListener("input", updateAimUIAndMarker);
aimRInput.addEventListener("input", updateAimUIAndMarker);
updateAimUIAndMarker();

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
  const inheritedVx = square.userData.vx ?? squareSpeedX;
  const inheritedVz = square.userData.vz ?? squareSpeedY;
  const aimPoint = getDesiredAimPoint();
  const toTargetX = aimPoint.x - mesh.position.x;
  const toTargetZ = aimPoint.z - mesh.position.z;
  const horizontalDistance = Math.hypot(toTargetX, toTargetZ);
  const gravityMag = -gravity;
  const targetY = aimPoint.y + ballRadius * 0.3;
  const toTargetY = targetY - mesh.position.y;
  const minDescendingTime = Math.sqrt(Math.max(0, (2 * toTargetY) / gravityMag)) + 0.14;
  const speedBasedTime = horizontalDistance / 9.5;
  const travelTime = Math.max(minDescendingTime, Math.min(1.9, Math.max(1.05, speedBasedTime)));
  const launchVy = (toTargetY - 0.5 * gravity * travelTime * travelTime) / travelTime;
  const maxVyForDescentAtImpact = gravityMag * travelTime - 0.25;
  const adjustedVy = Math.min(launchVy + (Math.random() * 0.12 - 0.06), maxVyForDescentAtImpact);
  balls.push({
    mesh,
    vx: inheritedVx * 0.28 + (toTargetX / travelTime) + (Math.random() * 0.2 - 0.1),
    vy: adjustedVy,
    vz: inheritedVz * 0.28 + (toTargetZ / travelTime) + (Math.random() * 0.18 - 0.07),
    bounces: 0,
    hasPeaked: false
  });
}

function resolveBallBoxCollision(ball, centerX, centerY, centerZ, halfWidth, halfHeight, halfDepth) {
  const p = ball.mesh.position;
  const minX = centerX - halfWidth;
  const maxX = centerX + halfWidth;
  const minY = centerY - halfHeight;
  const maxY = centerY + halfHeight;
  const minZ = centerZ - halfDepth;
  const maxZ = centerZ + halfDepth;

  const closestX = Math.max(minX, Math.min(maxX, p.x));
  const closestY = Math.max(minY, Math.min(maxY, p.y));
  const closestZ = Math.max(minZ, Math.min(maxZ, p.z));

  let nx = p.x - closestX;
  let ny = p.y - closestY;
  let nz = p.z - closestZ;
  let dist = Math.hypot(nx, ny, nz);
  if (dist >= ballRadius) {
    return false;
  }

  if (dist < 0.0001) {
    const localX = p.x - centerX;
    const localY = p.y - centerY;
    const localZ = p.z - centerZ;
    const xGap = halfWidth - Math.abs(localX);
    const yGap = halfHeight - Math.abs(localY);
    const zGap = halfDepth - Math.abs(localZ);

    if (xGap <= yGap && xGap <= zGap) {
      nx = Math.sign(localX) || 1;
      ny = 0;
      nz = 0;
    } else if (yGap <= zGap) {
      nx = 0;
      ny = Math.sign(localY) || 1;
      nz = 0;
    } else {
      nx = 0;
      ny = 0;
      nz = Math.sign(localZ) || 1;
    }
    dist = 0;
  } else {
    nx /= dist;
    ny /= dist;
    nz /= dist;
  }

  const penetration = ballRadius - dist;
  p.x += nx * penetration;
  p.y += ny * penetration;
  p.z += nz * penetration;

  const normalSpeed = ball.vx * nx + ball.vy * ny + ball.vz * nz;
  if (normalSpeed < 0) {
    const impulse = -(1 + targetCollisionRestitution) * normalSpeed;
    ball.vx += impulse * nx;
    ball.vy += impulse * ny;
    ball.vz += impulse * nz;

    ball.vx *= targetCollisionFriction;
    ball.vz *= targetCollisionFriction;
  }

  return true;
}

function resetScene() {
  for (const ball of balls) {
    scene.remove(ball.mesh);
    ball.mesh.material.dispose();
  }
  balls.length = 0;
  score = 0;
  square.position.set(squareStartX, squareBaseY, squareStartZ);
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

  square.position.x += squareSpeedX * dt;
  square.position.z += squareSpeedY * dt;
  square.position.y = squareBaseY;

  if (square.position.x > xBounds.max) {
    square.position.x = squareStartX;
  }

  if (square.position.z > zBounds.max) {
    square.position.z = squareStartZ;
  }

  square.userData.vx = squareSpeedX;
  square.userData.vz = squareSpeedY;
  updateAimMarker();

  for (let i = balls.length - 1; i >= 0; i -= 1) {
    const b = balls[i];
    const prevY = b.mesh.position.y;
    const prevVy = b.vy;
    b.vy += gravity * dt;

    if (!b.hasPeaked && prevVy > 0 && b.vy <= 0) {
      b.hasPeaked = true;
    }

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
    const footprintHit = Math.abs(dx) <= targetHalfWidth && Math.abs(dz) <= targetHalfDepth;
    if (crossedTargetTop && footprintHit && b.hasPeaked && prevVy <= 0 && b.vy < 0) {
      score += 1;
      hitFlashTime = 0.18;
      scene.remove(b.mesh);
      b.mesh.material.dispose();
      balls.splice(i, 1);
      continue;
    }

    resolveBallBoxCollision(
      b,
      targetPosition.x,
      targetPosition.y,
      targetPosition.z,
      targetHalfWidth,
      targetHalfHeight,
      targetHalfDepth
    );

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

  if (cameraController) {
    cameraController.update(dt);
  }

  info.textContent = "balls: " + balls.length + " | points: " + score;
  renderer.render(scene, camera);
}

animate(performance.now());
