function setCursorType() {
  document.body.style.cursor = selSegment || selShape || selAirPusher || selDirPusher ? "grab" : hovAirPusher || hovDirPusher || hovSegment || hovShape ? "pointer" : "default";
  if (contextMenu.selSlider) document.body.style.cursor = "grabbing";
  else if (document.body.style.cursor === "default" && contextMenu.active && contextMenu.hovPath.length > 0) document.body.style.cursor = "pointer";
}

function updateCtx() {
  displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
  if (contextMenu.active) {
    if (contextMenu.target) displayCtx.filter = "blur(3px)";
    displayCtx.drawImage(gameCanvas, 0, 0);
    displayCtx.filter = "none";
    displayCtx.drawImage(menuCanvas, 0, 0);
  } else displayCtx.drawImage(gameCanvas, 0, 0);
}

function render() {
  ctx.fillStyle = "rgba(0, 0, 0, 1)";

  drawRect(0, 0, _canvas.width, _canvas.height, null, null, ctx, 0, { color1: backgroundColor1, color2: backgroundColor2, direction: "vertical" });
  if (snakeBasketball.active) snakeBasketball.render();

  for (const p of backgroundElements) p.render();
  drawGrass(false);
  for (const a of airPushers) a.render();
  for (const s of shapes) s.render();
  for (const r of ropes) r.render();
  for (const e of entities) e.render();
  for (const p of frontPolygons) p.render();

  if (colGrid.shown) colGrid.show();

  var groundY = groundLevel - cam.scroll.y;
  drawRect(0, groundY, _canvas.width, groundLevel, null, null, ctx, 0, { color1: "rgba(40, 17, 78, 1)", color2: "rgba(247, 247, 247, 1)", direction: "vertical" });
  renderKeys();
  drawText(ctx, window.innerWidth - 30, window.innerHeight - 30, "fps " + fps, "white", null, 12, true);

  var seg = hovSegment ? hovSegment : selSegment;
  if (seg) {
    var lineWidth = Math.max(8, seg.rope.thick * 2);
    var p = toScrn(seg.pos.x - lineWidth / 2, seg.pos.y - lineWidth / 2);
    var _ctx = seg.rope === contextMenu.target ? menuCtx : ctx;
    drawRect(p.x, p.y, lineWidth, lineWidth, "rgba(0,0,0,0)", "yellow", _ctx);
  }

  minimap.render();

  if (contextMenu.active) contextMenu.render();
  updateCtx();
  setCursorType();
}

function showBtn(pos, size, label, key, info = null, fontSize = 14) {
  var bgrClr = "rgba(255, 255, 255, 0.1)";
  var selClr = "rgba(255, 255, 255, 0.15)";
  var clr = input.keys[key] ? selClr : bgrClr;
  drawRect(pos.x, pos.y, size.x, size.y, clr);
  drawText(ctx, pos.x + size.x / 2, pos.y, label, fontColor, null, fontSize);
  if (info) drawText(ctx, pos.x + size.x * 2, pos.y, info, fontColor, null, fontSize);
}

var fontColor = "rgba(255, 255, 255, 0.43)";
function renderKeys(basePos = v2(25, 25)) {
  const hov = hovSegment || hovAirPusher || hovShape || null;
  var btnSize = v2(60, 30);
  var pos = v2(basePos.x, basePos.y);

  if (showHovMenu) {
    var btnAmount = 2 + showHovMenu * (4 + (player != null) * 2 + (hov != null) * 6);
    drawRect(basePos.x - 5, basePos.y - 5, 200, btnAmount * (btnSize.y + 1) + 10, "rgba(0, 0, 0, 0.1)");
  }

  showBtn(pos, btnSize, "h", "h", showHovMenu ? "Options - Hide" : "Options - Show");
  if (!showHovMenu) return;
  pos.y += btnSize.y + 1;
  showBtn(pos, btnSize, "m", "m", minimap.shown ? "Minimap - Hide" : "Minimap - Show");
  pos.y += (btnSize.y + 1) * 2;
  showBtn(pos, btnSize, "RMB", "RMB", "Parameters");
  pos.y += btnSize.y + 1;
  showBtn(pos, btnSize, "R", "r", "Clear");
  pos.y += btnSize.y + 1;
  showBtn(pos, btnSize, "P", "p", paused ? "Unpause" : "Pause");
  pos.y += btnSize.y + 1;
  var curY = pos.y;
  for (let x = 0; x < 2; x++) {
    var _player = x === 0 ? player : player2;
    if (_player) {
      pos.y = curY;
      if (x === 1) pos.x = window.innerWidth - 200;
      var moveLabels = x === 0 ? ["w", "a", "s", "d"] : ["↑", "←", "↓", "→"];
      var moveKeys = x === 0 ? ["w", "a", "s", "d"] : ["arrowup", "arrowleft", "arrowdown", "arrowright"];
      var jumpKey = x === 0 ? " " : "enter";
      var jumpLabel = x === 0 ? "_" : "enter";

      for (let i = 0; i < moveKeys.length; i++) {
        var p = v2(pos.x - (btnSize.x + 2) + (btnSize.x + 2) * i, pos.y + btnSize.y + 2);
        if (i === 0) p = add_v2(p, v2((btnSize.x + 2) * 2, -btnSize.y - 1));
        showBtn(p, btnSize, moveLabels[i], moveKeys[i]);
      }
      drawText(ctx, pos.x + btnSize.x * 1.5, pos.y + btnSize.y * 2, "Movement", fontColor, null, 14);
      pos.y += (btnSize.y + 1) * 2;
      if (_player instanceof AirPusher) {
        pos.y += btnSize.y + 1;
        var arrowLabels = ["←", "→", "↑", "↓"];
        var arrowKeys = ["arrowleft", "arrowright", "arrowup", "arrowdown"];
        var p = v2(pos.x + btnSize.x * 0.5, pos.y + btnSize.y + 2);
        for (let i = 0; i < arrowLabels.length; i++) {
          if (i === 2) p = v2(pos.x + btnSize.x * 0.5, pos.y + btnSize.y + 2 + (btnSize.y + 1) * 3);
          else if (i % 2 !== 0) {
            p.x += btnSize.x + 1;
            drawText(ctx, p.x, p.y + btnSize.y + 1, i === 1 ? "Angle" : "Radius", fontColor, null, 14);
          }
          showBtn(p, btnSize, arrowLabels[i], arrowKeys[i]);
        }
        pos.y += (btnSize.y + 1) * 6;
      } else if (_player instanceof Snake) {
        pos.y += btnSize.y + 1;
        showBtn(pos, btnSize, jumpLabel, jumpKey, "Jump");
        pos.y += btnSize.y + 1;
      }
      pos.x = basePos.x;
    }
  }

  if (contextMenu.active && contextMenu.hovPath) return;
  if (hov) {
    pos.y += btnSize.y + 1;
    if (hov === hovSegment) {
      if (selSegment) return;
      showBtn(pos, btnSize, "shift", "shift", hov.isAnchor ? "Unanchor" : "Set Anchor");
    } else if (hov === hovAirPusher) showBtn(pos, btnSize, "shift", "shift", player ? "Leave" : "Enter");
    else if (hov === hovShape) showBtn(pos, btnSize, "shift", "shift", "Resize");
    showBtn(v2(pos.x, pos.y + btnSize.y + 1), btnSize, "Click", "click", "Place");
    pos.y += (btnSize.y + 1) * 2;
    showBtn(pos, btnSize, "Click + Alt", "click", "Duplicate");
    pos.y += btnSize.y + 1;
    if (typeof hov.control === "function" || typeof hov.rope?.control === "function") {
      showBtn(pos, btnSize, "Enter", "enter", hov === player || hov.rope === player ? "Leave" : "Control");
      pos.y += btnSize.y + 1;
    }

    showBtn(pos, btnSize, "F", "f", cam.target === hov || cam.target === hov.rope ? "Leave" : "Focus");
    pos.y += btnSize.y + 1;

    showBtn(pos, btnSize, "Backspace", "backspace", "Delete");
  }
}

function drawGrass(hasPair, isPair) {
  var step = hasPair ? 8 : 1;
  var w = hasPair ? 2 : 0.4;

  for (let i = hasPair && !isPair ? 1 : 0; i < grass.length; i += step) {
    var gr = grass[i];

    gr.angle += gr.angDir * (0.01 * (hasPair ? 0.2 : 1));

    if (Math.abs(gr.startAngle - gr.angle) > Math.PI / 8) {
      gr.angDir *= -1;
      gr.angle = gr.startAngle + (Math.PI / 8) * (gr.angle > gr.startAngle ? 1 : -1);
    }

    var x = wrapScreenX(gr.localX, gr.z);
    var p = v2(x, groundLevel - cam.scroll.y);

    var height = gr.length;
    var grassTip = v2(p.x - Math.cos(gr.angle) * gr.length, p.y - Math.sin(gr.angle) * height);

    for (const s of shapes) {
      if (!s.inScreen || s.pos.y < p.y) continue;

      const sScreenPos = v2ToScrn(s.pos);

      if (s.type === "CIRCLE" && pointInCircle(grassTip, sScreenPos, s.size.x)) {
        const dx = grassTip.x - sScreenPos.x;
        const dy = grassTip.y - sScreenPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pushDist = s.size.x + 5;

        grassTip = v2(sScreenPos.x + (dx / dist) * pushDist, sScreenPos.y + (dy / dist) * pushDist);

        gr.angle = 0;
        break;
      }

      if (s.type === "SQUARE" && pointInRect(grassTip, sScreenPos, s.size, s.angle)) {
        const dx = grassTip.x - sScreenPos.x;
        const dy = grassTip.y - sScreenPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pushDist = s.size.x + 5;

        grassTip = v2(sScreenPos.x + (dx / dist) * pushDist, sScreenPos.y + (dy / dist) * pushDist);

        gr.angle = 0;
      }
    }

    drawBezierLine(p, grassTip, v2(p.x, p.y - gr.length / 2), gr.color, "", w);
  }
}
