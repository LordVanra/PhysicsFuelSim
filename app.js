const canvas = document.getElementById("c");
const container = document.getElementById("container");
const info = document.getElementById("info");
const velXInput = document.getElementById("velX");
const velXVal = document.getElementById("velXVal");
const aimThetaInput = document.getElementById("aimTheta");
const aimPhiInput = document.getElementById("aimPhi");
const aimVInput = document.getElementById("aimV");
const autoShootInput = document.getElementById("autoShoot");
const aimThetaVal = document.getElementById("aimThetaVal");
const aimPhiVal = document.getElementById("aimPhiVal");
const aimVVal = document.getElementById("aimVVal");
const autoShootVal = document.getElementById("autoShootVal");

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
const xBounds = { min: -2, max: 2 };
const squareStartX = xBounds.min;
const squareStartZ = 0;
let squareSpeedX = Number(velXInput.value);
let squareSpeedY = 0;
square.position.set(squareStartX, squareBaseY, squareStartZ);
scene.add(square);

const aimTubePivot = new THREE.Object3D();
aimTubePivot.position.set(0, 0.45, 0);
square.add(aimTubePivot);

const aimTubeMaterial = new THREE.MeshLambertMaterial({ color: 0x1f2933 });
const aimTube = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.16, 1.9, 14),
  aimTubeMaterial
);
aimTube.castShadow = true;
aimTube.receiveShadow = true;
aimTube.position.y = 0.95;
aimTubePivot.add(aimTube);

const aimTubeTip = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 12, 12),
  new THREE.MeshLambertMaterial({ color: 0x354f6a })
);
aimTubeTip.castShadow = true;
aimTubeTip.position.y = 1.9;
aimTubePivot.add(aimTubeTip);

function updateRobotSpeeds() {
  squareSpeedX = Number(velXInput.value);
  velXVal.textContent = squareSpeedX.toFixed(1);
}

velXInput.addEventListener("input", updateRobotSpeeds);
updateRobotSpeeds();

const targetWidth = 4;
const targetDepth = 4;
const targetHeight = 3;
const targetCenterY = 8.5;
const targetHalfWidth = targetWidth * 0.5;
const targetHalfDepth = targetDepth * 0.5;
const targetHalfHeight = targetHeight * 0.5;
const targetTopY = targetCenterY + targetHalfHeight;
const rimHeight = 1.5;
const rimThickness = 0.25;
const cavityHalfWidth = targetHalfWidth - rimThickness;
const cavityHalfDepth = targetHalfDepth - rimThickness;
const rimBaseY = targetTopY;
const targetPosition = new THREE.Vector3(0, targetCenterY, 8.5);

const targetTopMaterial = new THREE.MeshLambertMaterial({ color: 0xcc4343 });
const targetTop = new THREE.Mesh(
  new THREE.BoxGeometry(targetWidth, targetHeight, targetDepth),
  targetTopMaterial
);
targetTop.position.copy(targetPosition);
targetTop.receiveShadow = true;
targetTop.castShadow = true;
scene.add(targetTop);

const rimWallMaterial = new THREE.MeshLambertMaterial({ color: 0xb7663f });
const rimWallColliders = [];

function addRimWall(width, height, depth, x, z) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    rimWallMaterial
  );
  wall.position.set(x, rimBaseY + height * 0.5, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);

  rimWallColliders.push({
    centerX: x,
    centerY: wall.position.y,
    centerZ: z,
    halfWidth: width * 0.5,
    halfHeight: height * 0.5,
    halfDepth: depth * 0.5
  });
}

addRimWall(
  targetWidth,
  rimHeight,
  rimThickness,
  targetPosition.x,
  targetPosition.z - (targetHalfDepth - rimThickness * 0.5)
);
addRimWall(
  targetWidth,
  rimHeight,
  rimThickness,
  targetPosition.x,
  targetPosition.z + (targetHalfDepth - rimThickness * 0.5)
);
addRimWall(
  rimThickness,
  rimHeight,
  targetDepth - rimThickness * 2,
  targetPosition.x - (targetHalfWidth - rimThickness * 0.5),
  targetPosition.z
);
addRimWall(
  rimThickness,
  rimHeight,
  targetDepth - rimThickness * 2,
  targetPosition.x + (targetHalfWidth - rimThickness * 0.5),
  targetPosition.z
);

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

const ballRadius = 0.25;
const sharedBallGeometry = new THREE.SphereGeometry(ballRadius, 28, 28);

const balls = [];
let score = 0;
let hitFlashTime = 0;
let lastShotVelocityText = "impart v: n/a";

const gravity = -32;
const restitution = 0.6;
const floorY = ballRadius;
const targetCollisionRestitution = 0.44;
const targetCollisionFriction = 0.92;
const launchOriginY = 0;
const aimMinSpeed = 0;
const aimCenterX = 0;
const aimCenterZ = 0;
const upAxis = new THREE.Vector3(0, 1, 0);
const aimTubeWorldPos = new THREE.Vector3();
const aimTubeDirection = new THREE.Vector3();

function getDesiredAimPoint() {
  const thetaRad = (Number(aimThetaInput.value) * Math.PI) / 180;
  const phiRad = (Number(aimPhiInput.value) * Math.PI) / 180;
  const previewDistance = targetPosition.z;
  const dirX = Math.sin(thetaRad);
  const dirZ = Math.cos(thetaRad);
  const offsetX = dirX * previewDistance;
  const offsetZ = dirZ * previewDistance;
  const aimY = launchOriginY + Math.tan(phiRad) * previewDistance;
  return new THREE.Vector3(
    aimCenterX + offsetX,
    aimY,
    aimCenterZ + offsetZ
  );
}

function updateAimMarker() {
  const aimPoint = getDesiredAimPoint();
  aimMarkerRing.position.set(aimPoint.x, aimPoint.y + 0.07, aimPoint.z);
  aimMarkerDot.position.set(aimPoint.x, aimPoint.y + 0.15, aimPoint.z);

  aimTubePivot.getWorldPosition(aimTubeWorldPos);
  aimTubeDirection.subVectors(aimPoint, aimTubeWorldPos);
  if (aimTubeDirection.lengthSq() > 0.000001) {
    aimTubeDirection.normalize();
    aimTubePivot.quaternion.setFromUnitVectors(upAxis, aimTubeDirection);
  }
}

function updateAimUIAndMarker() {
  const thetaDeg = Number(aimThetaInput.value);
  const phiDeg = Number(aimPhiInput.value);
  const speed = Number(aimVInput.value);
  aimThetaVal.textContent = thetaDeg.toFixed(0) + "°";
  aimPhiVal.textContent = phiDeg.toFixed(1) + "°";
  aimVVal.textContent = speed.toFixed(1);
  updateAimMarker();
}

aimThetaInput.addEventListener("input", updateAimUIAndMarker);
aimPhiInput.addEventListener("input", updateAimUIAndMarker);
aimVInput.addEventListener("input", updateAimUIAndMarker);
updateAimUIAndMarker();

function updateAutoShootUI() {
  autoShootVal.textContent = autoShootInput.checked ? "on" : "off";
}

autoShootInput.addEventListener("change", updateAutoShootUI);
updateAutoShootUI();

function launchBall() {
  const mesh = new THREE.Mesh(
    sharedBallGeometry,
    new THREE.MeshLambertMaterial({ color: 0xf0cf53 })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.position.set(square.position.x, launchOriginY, square.position.z);
  scene.add(mesh);

  const thetaRad = (Number(aimThetaInput.value) * Math.PI) / 180;
  const phiRad = (Number(aimPhiInput.value) * Math.PI) / 180;
  const speed = Math.max(aimMinSpeed, Number(aimVInput.value));
  const towardSpeed = speed * Math.cos(phiRad);
  const vUp = speed * Math.sin(phiRad);
  const impartVx = Math.sin(thetaRad) * towardSpeed;
  const impartVy = vUp;
  const impartVz = Math.cos(thetaRad) * towardSpeed;
  const launchVx = impartVx;
  const launchVz = impartVz;

  lastShotVelocityText =
    "impart v: (" +
    impartVx.toFixed(2) + ", " +
    impartVy.toFixed(2) + ", " +
    impartVz.toFixed(2) + ")";

  balls.push({
    mesh,
    vx: launchVx,
    vy: impartVy,
    vz: launchVz,
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
  lastShotVelocityText = "impart v: n/a";
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
  const previousSquareX = square.position.x;
  const nextSquareX = previousSquareX + squareSpeedX * dt;
  const wrappedX = nextSquareX > xBounds.max;

  square.position.x = wrappedX ? squareStartX : nextSquareX;
  square.position.z = squareStartZ;
  square.position.y = squareBaseY;

  square.userData.vx = squareSpeedX;
  square.userData.vz = 0;

  const crossedOriginX =
    !wrappedX &&
    ((previousSquareX < 0 && square.position.x >= 0) ||
      (previousSquareX > 0 && square.position.x <= 0));
  if (autoShootInput.checked && crossedOriginX) {
    launchBall();
  }

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
    const cavityHit = Math.abs(dx) <= cavityHalfWidth && Math.abs(dz) <= cavityHalfDepth;
    if (crossedTargetTop && cavityHit && b.hasPeaked && prevVy <= 0 && b.vy < 0) {
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

    for (const wall of rimWallColliders) {
      resolveBallBoxCollision(
        b,
        wall.centerX,
        wall.centerY,
        wall.centerZ,
        wall.halfWidth,
        wall.halfHeight,
        wall.halfDepth
      );
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

  if (cameraController) {
    cameraController.update(dt);
  }

  info.textContent = "balls: " + balls.length + " | points: " + score + " | " + lastShotVelocityText;
  renderer.render(scene, camera);
}

animate(performance.now());
