(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createCameraController(options) {
    const camera = options.camera;
    const canvas = options.canvas;
    const target = (options.initialTarget || new THREE.Vector3(0, 0, 0)).clone();

    const offset = new THREE.Vector3().subVectors(camera.position, target);
    let distance = Math.max(4, offset.length());
    let yaw = Math.atan2(offset.x, offset.z);
    let pitch = Math.asin(offset.y / distance);

    const keys = Object.create(null);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const minPitch = -1.2;
    const maxPitch = 1.2;
    const minDistance = 4;
    const maxDistance = 90;
    const pointerSensitivity = 0.004;
    const orbitSpeed = 1.8;
    const panSpeed = 12;
    const zoomSpeed = 16;

    function applyTransform() {
      const cosPitch = Math.cos(pitch);
      camera.position.x = target.x + distance * Math.sin(yaw) * cosPitch;
      camera.position.y = target.y + distance * Math.sin(pitch);
      camera.position.z = target.z + distance * Math.cos(yaw) * cosPitch;
      camera.lookAt(target);
    }

    function shouldHandleKeyboard() {
      const active = document.activeElement;
      if (!active) {
        return true;
      }
      const tag = active.tagName;
      return tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !active.isContentEditable;
    }

    function onMouseDown(event) {
      if (event.button !== 0) {
        return;
      }
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function onMouseUp() {
      dragging = false;
    }

    function onMouseMove(event) {
      if (!dragging) {
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      yaw -= dx * pointerSensitivity;
      pitch = clamp(pitch - dy * pointerSensitivity, minPitch, maxPitch);
    }

    function onWheel(event) {
      event.preventDefault();
      distance = clamp(distance + event.deltaY * 0.01, minDistance, maxDistance);
    }

    function onKeyDown(event) {
      if (!shouldHandleKeyboard()) {
        return;
      }
      keys[event.code] = true;
    }

    function onKeyUp(event) {
      keys[event.code] = false;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    applyTransform();

    function update(dt) {
      const panStep = panSpeed * dt;
      const orbitStep = orbitSpeed * dt;
      const zoomStep = zoomSpeed * dt;

      if (keys.ArrowLeft || keys.KeyJ) {
        yaw += orbitStep;
      }
      if (keys.ArrowRight || keys.KeyL) {
        yaw -= orbitStep;
      }
      if (keys.ArrowUp || keys.KeyI) {
        pitch = clamp(pitch + orbitStep, minPitch, maxPitch);
      }
      if (keys.ArrowDown || keys.KeyK) {
        pitch = clamp(pitch - orbitStep, minPitch, maxPitch);
      }
      if (keys.KeyQ) {
        distance = clamp(distance + zoomStep, minDistance, maxDistance);
      }
      if (keys.KeyE) {
        distance = clamp(distance - zoomStep, minDistance, maxDistance);
      }

      const forwardX = Math.sin(yaw);
      const forwardZ = Math.cos(yaw);
      const rightX = Math.cos(yaw);
      const rightZ = -Math.sin(yaw);

      if (keys.KeyW) {
        target.x += forwardX * panStep;
        target.z += forwardZ * panStep;
      }
      if (keys.KeyS) {
        target.x -= forwardX * panStep;
        target.z -= forwardZ * panStep;
      }
      if (keys.KeyA) {
        target.x -= rightX * panStep;
        target.z -= rightZ * panStep;
      }
      if (keys.KeyD) {
        target.x += rightX * panStep;
        target.z += rightZ * panStep;
      }
      if (keys.KeyR) {
        target.y += panStep;
      }
      if (keys.KeyF) {
        target.y -= panStep;
      }

      applyTransform();
    }

    function dispose() {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    }

    return {
      update,
      dispose
    };
  }

  window.createCameraController = createCameraController;
})();
