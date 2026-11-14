(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Lee Lee Land requires a browser with Canvas 2D support.");
  }

  const world = CONFIG.world;
  const player = {
    x: CONFIG.player.startX,
    y: CONFIG.player.startY,
    radius: CONFIG.player.radius
  };
  const stats = {
    money: CONFIG.economy.startingCash,
    education: CONFIG.education.startingLevel
  };
  const camera = { x: player.x, y: player.y };
  const keys = new Set();
  const touch = { pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0 };
  const characterImages = {};
  const characterCards = [...document.querySelectorAll(".character-card")];
  const startButton = document.getElementById("start-game");
  const characterSelect = document.getElementById("character-select");
  const selectionStatus = document.getElementById("selection-status");
  const statsHud = document.getElementById("stats-hud");
  const moneyValue = document.getElementById("money-value");
  const educationValue = document.getElementById("education-value");
  const interiorScreen = document.getElementById("interior-screen");
  const interiorTitle = document.getElementById("interior-title");
  const interiorDescription = document.getElementById("interior-description");
  const actionMessage = document.getElementById("action-message");
  const cafeActions = document.getElementById("cafe-actions");
  const schoolActions = document.getElementById("school-actions");
  const cafeJobButton = document.getElementById("cafe-job");
  let viewportWidth = 0;
  let viewportHeight = 0;
  let lastFrameTime = 0;
  let selectedCharacter = null;
  let gameStarted = false;
  let currentLocation = null;
  let hasCafeJob = false;

  const preventScrollKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]);
  const solidBuildings = world.buildings;

  for (const [id, character] of Object.entries(CONFIG.characters)) {
    if (id === "spriteHeight") continue;
    const image = new Image();
    image.src = character.image;
    image.addEventListener("load", () => {
      characterImages[id] = image;
    });
    image.addEventListener("error", () => {
      selectionStatus.textContent = `Could not load ${character.name}'s sprite. Check ${character.image}.`;
    });
  }

  characterCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectedCharacter = card.dataset.character;
      characterCards.forEach((option) => {
        option.setAttribute("aria-pressed", String(option === card));
      });
      startButton.disabled = false;
      selectionStatus.textContent = `${CONFIG.characters[selectedCharacter].name} is ready to explore!`;
    });
  });

  startButton.addEventListener("click", () => {
    if (!selectedCharacter) return;
    gameStarted = true;
    characterSelect.hidden = true;
    updateStatsHud();
    statsHud.hidden = false;
    canvas.focus();
  });

  document.getElementById("buy-mocaccino").addEventListener("click", () => {
    const cost = CONFIG.economy.mocaccinoCost;
    if (stats.money < cost) {
      actionMessage.textContent = stats.money === 0
        ? "You have no money for a Mocaccino."
        : `A Mocaccino costs $${cost}. You don't have enough money yet.`;
      return;
    }

    stats.money -= cost;
    updateStatsHud();
    actionMessage.textContent = `Enjoy your Mocaccino! You spent $${cost}.`;
  });

  cafeJobButton.addEventListener("click", () => {
    const requiredEducation = CONFIG.education.cafeJobRequirement;
    if (stats.education < requiredEducation) {
      actionMessage.textContent = "You need an education to get a job. Visit Lee Lee School first.";
      return;
    }

    const pay = CONFIG.economy.cafeShiftPay;
    stats.money += pay;
    updateStatsHud();
    if (hasCafeJob) {
      actionMessage.textContent = `You finished a café shift and earned $${pay}.`;
    } else {
      hasCafeJob = true;
      cafeJobButton.textContent = `Work a shift (+$${pay})`;
      actionMessage.textContent = `You're hired! Your first shift earned $${pay}.`;
    }
  });

  document.getElementById("study-education").addEventListener("click", () => {
    stats.education += CONFIG.education.schoolLevelPerLesson;
    updateStatsHud();
    actionMessage.textContent = `You studied hard. Education Level ${stats.education}!`;
  });

  document.getElementById("exit-location").addEventListener("click", exitLocation);

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, CONFIG.canvas.maxDevicePixelRatio);
    const bounds = canvas.getBoundingClientRect();
    viewportWidth = bounds.width;
    viewportHeight = bounds.height;
    canvas.width = Math.round(viewportWidth * pixelRatio);
    canvas.height = Math.round(viewportHeight * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function intersectsCircleRect(x, y, radius, rect) {
    const nearestX = clamp(x, rect.x, rect.x + rect.width);
    const nearestY = clamp(y, rect.y, rect.y + rect.height);
    const dx = x - nearestX;
    const dy = y - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function canOccupy(x, y) {
    if (x - player.radius < 0 || y - player.radius < 0 ||
        x + player.radius > world.width || y + player.radius > world.height) {
      return false;
    }
    return !solidBuildings.some((building) => {
      const entrance = world.entrances.find((door) => door.building === building.name);
      const enteringDoor = entrance &&
        Math.abs(x - entrance.x) <= entrance.width / 2 &&
        y >= entrance.y - player.radius &&
        y <= entrance.y + player.radius;
      return !enteringDoor && intersectsCircleRect(x, y, player.radius, building);
    });
  }

  function updateStatsHud() {
    moneyValue.textContent = `$${stats.money}`;
    educationValue.textContent = `Level ${stats.education}`;
  }

  function enterLocation(locationId) {
    currentLocation = locationId;
    const isSchool = locationId === "school";
    interiorTitle.textContent = isSchool ? "Lee Lee School" : "Lee Lee Café";
    interiorDescription.textContent = isSchool
      ? "Take a lesson to build your education level."
      : "Warm lights, fresh coffee, and a friendly counter.";
    interiorScreen.dataset.location = locationId;
    cafeActions.hidden = isSchool;
    schoolActions.hidden = !isSchool;
    actionMessage.textContent = isSchool
      ? "Ready to learn something new?"
      : "What would you like to do?";
    cafeJobButton.textContent = hasCafeJob
      ? `Work a shift (+$${CONFIG.economy.cafeShiftPay})`
      : "Get a job";
    interiorScreen.hidden = false;
    document.body.classList.add("inside-location");
    keys.clear();
    clearTouch();
  }

  function exitLocation() {
    const entrance = world.entrances.find((door) => door.id === currentLocation);
    if (!entrance) {
      throw new Error(`Cannot exit unknown location: ${currentLocation}`);
    }

    currentLocation = null;
    player.x = entrance.x;
    player.y = entrance.y + CONFIG.characters.spriteHeight - 8;
    camera.x = player.x;
    camera.y = player.y;
    interiorScreen.hidden = true;
    document.body.classList.remove("inside-location");
    keys.clear();
    clearTouch();
  }

  function updatePlayer(deltaSeconds) {
    let dx = 0;
    let dy = 0;
    if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
    if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
    if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
    if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

    if (dx === 0 && dy === 0) {
      dx = touch.dx;
      dy = touch.dy;
    }

    if (dx === 0 && dy === 0) return;

    const magnitude = Math.hypot(dx, dy);
    const distance = CONFIG.player.speed * deltaSeconds;
    const scale = distance / Math.max(1, magnitude);
    dx *= scale;
    dy *= scale;

    if (canOccupy(player.x + dx, player.y)) player.x += dx;
    if (canOccupy(player.x, player.y + dy)) player.y += dy;

    if (dy < 0) {
      const entrance = world.entrances.find((door) =>
        Math.abs(player.x - door.x) <= door.width / 2 &&
        player.y <= door.y + 3 &&
        player.y >= door.y - player.radius - 4
      );
      if (entrance) enterLocation(entrance.id);
    }
  }

  function updateCamera(deltaSeconds) {
    const smoothing = 1 - Math.exp(-CONFIG.camera.followSmoothing * deltaSeconds);
    camera.x += (player.x - camera.x) * smoothing;
    camera.y += (player.y - camera.y) * smoothing;

    const halfWidth = viewportWidth / 2;
    const halfHeight = viewportHeight / 2;
    camera.x = viewportWidth >= world.width ? world.width / 2 :
      clamp(camera.x, halfWidth, world.width - halfWidth);
    camera.y = viewportHeight >= world.height ? world.height / 2 :
      clamp(camera.y, halfHeight, world.height - halfHeight);
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, r);
  }

  function drawDistricts() {
    for (const district of world.districts) {
      ctx.fillStyle = district.color;
      ctx.fillRect(district.x, district.y, district.width, district.height);
      ctx.fillStyle = "rgb(255 255 255 / 9%)";
      for (let x = district.x + 26; x < district.x + district.width; x += 94) {
        for (let y = 22; y < world.height; y += 84) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawRoads() {
    ctx.fillStyle = CONFIG.colors.road;
    for (const road of world.roads) ctx.fillRect(road.x, road.y, road.width, road.height);

    ctx.fillStyle = CONFIG.colors.sidewalk;
    for (const sidewalk of world.sidewalks) {
      ctx.fillRect(sidewalk.x, sidewalk.y, sidewalk.width, sidewalk.height);
      ctx.strokeStyle = CONFIG.colors.sidewalkEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(sidewalk.x + 1, sidewalk.y + 1, sidewalk.width - 2, sidewalk.height - 2);
    }

    ctx.save();
    ctx.strokeStyle = CONFIG.colors.roadLine;
    ctx.lineWidth = 4;
    ctx.setLineDash([25, 23]);
    ctx.beginPath();
    ctx.moveTo(0, 780);
    ctx.lineTo(world.width, 780);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1300, 0);
    ctx.lineTo(1300, world.height);
    ctx.stroke();
    ctx.restore();

    for (const road of world.roads) {
      if (road.width > road.height) {
        drawCrosswalk(road.x + road.width * 0.48, road.y + 12, 72, false);
      } else {
        drawCrosswalk(road.x + 14, road.y + road.height * 0.48, 72, true);
      }
    }
  }

  function drawCrosswalk(x, y, length, vertical) {
    ctx.fillStyle = "rgb(255 255 255 / 70%)";
    for (let i = 0; i < 6; i += 1) {
      const offset = i * 11;
      ctx.fillRect(vertical ? x : x + offset, vertical ? y + offset : y,
        vertical ? length : 6, vertical ? 6 : length);
    }
  }

  function drawParks() {
    for (const park of world.parks) {
      roundedRect(park.x, park.y, park.width, park.height, 22);
      ctx.fillStyle = park.color || CONFIG.colors.park;
      ctx.fill();
      ctx.strokeStyle = "rgb(72 125 78 / 30%)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "rgb(255 255 255 / 28%)";
      roundedRect(park.x + 18, park.y + park.height / 2 - 7, park.width - 36, 14, 7);
      ctx.fill();
      ctx.fillStyle = "#55785b";
      ctx.font = "600 12px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(park.label, park.x + park.width / 2, park.y + 25);
    }
  }

  function drawBuildings() {
    for (const building of world.buildings) {
      ctx.save();
      ctx.shadowColor = "rgb(56 54 43 / 18%)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 7;
      roundedRect(building.x, building.y, building.width, building.height, 12);
      ctx.fillStyle = building.color;
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = CONFIG.colors.buildingOutline;
      ctx.lineWidth = 3;
      roundedRect(building.x, building.y, building.width, building.height, 12);
      ctx.stroke();

      ctx.fillStyle = CONFIG.colors.buildingRoof;
      roundedRect(building.x + 10, building.y + 10, building.width - 20, 34, 7);
      ctx.fill();
      ctx.fillStyle = "#735c4d";
      ctx.font = "600 11px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(building.name, building.x + building.width / 2, building.y + 27,
        building.width - 26);

      ctx.fillStyle = "#8eb6b0";
      const windowWidth = 22;
      const windowY = building.y + 63;
      for (let x = building.x + 24; x + windowWidth < building.x + building.width - 16;
        x += 42) {
        ctx.fillRect(x, windowY, windowWidth, 28);
      }
      ctx.fillStyle = "#795e4c";
      ctx.fillRect(building.x + building.width / 2 - 12,
        building.y + building.height - 39, 24, 39);
      ctx.fillStyle = "#f3d982";
      ctx.fillRect(building.x + building.width / 2 + 5,
        building.y + building.height - 21, 3, 3);
    }
  }

  function drawTrees() {
    for (const tree of world.trees) {
      ctx.fillStyle = "rgb(51 86 55 / 16%)";
      ctx.beginPath();
      ctx.ellipse(tree.x + 3, tree.y + 11, 21, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#795c45";
      ctx.fillRect(tree.x - 4, tree.y - 2, 8, 24);
      ctx.fillStyle = "#4d9667";
      ctx.beginPath();
      ctx.arc(tree.x, tree.y - 4, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#68ad75";
      ctx.beginPath();
      ctx.arc(tree.x - 6, tree.y - 10, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDistrictLabels() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 22px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = "rgb(54 94 67 / 60%)";
    ctx.fillText("THE SUBURBS", 650, 54);
    ctx.fillText("DOWNTOWN", 1950, 54);
    ctx.restore();

    ctx.fillStyle = "rgb(255 248 225 / 70%)";
    ctx.font = "600 11px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LEE LEE LAND  •  MAIN STREET", 1040, 766);
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = "rgb(47 60 49 / 22%)";
    ctx.beginPath();
    ctx.ellipse(0, 17, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const sprite = characterImages[selectedCharacter];
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const height = CONFIG.characters.spriteHeight;
      const width = height * sprite.naturalWidth / sprite.naturalHeight;
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(sprite, -width / 2, 15 - height, width, height);
      ctx.restore();
      return;
    }

    ctx.fillStyle = CONFIG.player.shirtColor;
    roundedRect(-12, -2, 24, 22, 8);
    ctx.fill();
    ctx.strokeStyle = CONFIG.player.outlineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = CONFIG.player.color;
    ctx.beginPath();
    ctx.arc(0, -10, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#4b413c";
    ctx.beginPath();
    ctx.arc(-3, -11, 1.3, 0, Math.PI * 2);
    ctx.arc(4, -11, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9c5e55";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -8, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    ctx.fillStyle = CONFIG.canvas.background;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.save();
    ctx.translate(viewportWidth / 2 - camera.x, viewportHeight / 2 - camera.y);
    drawDistricts();
    drawRoads();
    drawParks();
    drawTrees();
    drawBuildings();
    drawDistrictLabels();
    drawPlayer();
    ctx.restore();
    drawTouchControl();
  }

  function drawTouchControl() {
    if (touch.pointerId === null || currentLocation) return;
    const radius = CONFIG.touchControls.radius;
    ctx.save();
    ctx.fillStyle = "rgb(255 250 235 / 35%)";
    ctx.strokeStyle = "rgb(255 250 235 / 75%)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(touch.startX, touch.startY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgb(74 115 83 / 65%)";
    ctx.beginPath();
    ctx.arc(touch.startX + touch.dx * radius, touch.startY + touch.dy * radius, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function clearTouch() {
    const pointerId = touch.pointerId;
    touch.pointerId = null;
    touch.dx = 0;
    touch.dy = 0;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
  }

  function frame(timestamp) {
    const deltaSeconds = lastFrameTime === 0 ? 0 : Math.min((timestamp - lastFrameTime) / 1000, 0.05);
    lastFrameTime = timestamp;
    if (gameStarted && !currentLocation) {
      updatePlayer(deltaSeconds);
      updateCamera(deltaSeconds);
    }
    render();
    window.requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!gameStarted || currentLocation) return;
    if (preventScrollKeys.has(event.key)) event.preventDefault();
    keys.add(key);
  });
  window.addEventListener("keyup", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys.delete(key);
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || !gameStarted || currentLocation || touch.pointerId !== null) return;
    const bounds = canvas.getBoundingClientRect();
    touch.pointerId = event.pointerId;
    touch.startX = event.clientX - bounds.left;
    touch.startY = event.clientY - bounds.top;
    touch.dx = 0;
    touch.dy = 0;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== touch.pointerId) return;
    const bounds = canvas.getBoundingClientRect();
    const dx = event.clientX - bounds.left - touch.startX;
    const dy = event.clientY - bounds.top - touch.startY;
    const distance = Math.hypot(dx, dy);
    if (distance <= CONFIG.touchControls.deadZone) {
      touch.dx = 0;
      touch.dy = 0;
      return;
    }
    const strength = Math.min(1, (distance - CONFIG.touchControls.deadZone) /
      (CONFIG.touchControls.radius - CONFIG.touchControls.deadZone));
    touch.dx = dx / distance * strength;
    touch.dy = dy / distance * strength;
  });
  canvas.addEventListener("pointerup", (event) => {
    if (event.pointerId === touch.pointerId) clearTouch();
  });
  canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerId === touch.pointerId) clearTouch();
  });
  canvas.addEventListener("lostpointercapture", (event) => {
    if (event.pointerId === touch.pointerId) clearTouch();
  });
  window.addEventListener("blur", () => {
    keys.clear();
    clearTouch();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      keys.clear();
      clearTouch();
    }
  });
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  window.requestAnimationFrame(frame);
})();
