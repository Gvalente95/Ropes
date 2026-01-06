function render() {
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, _canvas.width, _canvas.height);
  drawText(ctx, [window.innerWidth / 2, window.innerHeight * 0.4], "Ropes", "white", null, 50);

  for (const a of airPushers) a.render();
  for (const r of ropes) r.render();
  for (const s of shapes) s.render();
  for (const e of entities) e.render();

  var seg = hovSegment ? hovSegment : selSegment;
  if (seg) {
    var lineWidth = Math.max(8, seg.rope.thick * 2);
    drawRect(seg.pos.x - lineWidth / 2, seg.pos.y - lineWidth / 2, lineWidth, lineWidth, "rgba(0,0,0,0)", "yellow");
  }

  if (colGrid.shown) colGrid.show();
  renderKeys();
  drawText(ctx, [window.innerWidth - 30, window.innerHeight - 30], "fps " + fps, "white", null, 12, true);

  if (contextMenu.active) contextMenu.render();

  displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
  if (contextMenu.active) {
    if (contextMenu.target) displayCtx.filter = "blur(3px)";
    displayCtx.drawImage(gameCanvas, 0, 0);
    displayCtx.filter = "none";
    displayCtx.drawImage(menuCanvas, 0, 0);
  } else displayCtx.drawImage(gameCanvas, 0, 0);

  document.body.style.cursor = selSegment || selShape || selAirPusher || selDirPusher ? "grab" : hovAirPusher || hovDirPusher || hovSegment || hovShape ? "pointer" : "default";
  if (contextMenu.selSlider) document.body.style.cursor = "grabbing";
  else if (document.body.style.cursor === "default" && contextMenu.active && contextMenu.hovPath.length > 0) document.body.style.cursor = "pointer";
}

function showBtn(pos, size, label, key, info = null, fontSize = 14) {
  var bgrClr = "rgba(255, 255, 255, 0.1)";
  var selClr = "rgba(255, 255, 255, 0.15)";
  var clr = input.keys[key] ? selClr : bgrClr;
  drawRect(pos.x, pos.y, size.x, size.y, clr);
  drawText(ctx, [pos.x + size.x / 2, pos.y], label, fontColor, null, fontSize);
  if (info) drawText(ctx, [pos.x + size.x * 2, pos.y], info, fontColor, null, fontSize);
}

var fontColor = "rgba(255, 255, 255, 0.43)";
function renderKeys(pos = new Vec2(50, 50)) {
  var btnSize = new Vec2(60, 30);

  showBtn(pos, btnSize, "RMB", "RMB", "Parameters");
  pos.y += btnSize.y + 1;
  showBtn(pos, btnSize, "R", "r", "Clear");
  pos.y += btnSize.y + 1;

  if (player) {
    var inputs = ["w", "a", "s", "d"];
    for (let i = 0; i < inputs.length; i++) {
      var p = new Vec2(pos.x - (btnSize.x + 2) + (btnSize.x + 2) * i, pos.y + btnSize.y + 2);
      if (i === 0) p = add_v2(p, new Vec2((btnSize.x + 2) * 2, -btnSize.y - 1));
      showBtn(p, btnSize, inputs[i], inputs[i]);
    }
    drawText(ctx, [pos.x + btnSize.x * 1.5, pos.y + btnSize.y * 2], "Movement", fontColor, null, 14);
    pos.y += (btnSize.y + 1) * 2;
    if (player instanceof AirPusher) {
      pos.y += btnSize.y + 1;
      var arrowLabels = ["←", "→", "↑", "↓"];
      var arrowKeys = ["arrowleft", "arrowright", "arrowup", "arrowdown"];
      var p = new Vec2(pos.x + btnSize.x * 0.5, pos.y + btnSize.y + 2);
      for (let i = 0; i < arrowLabels.length; i++) {
        if (i === 2) p = new Vec2(pos.x + btnSize.x * 0.5, pos.y + btnSize.y + 2 + (btnSize.y + 1) * 3);
        else if (i % 2 !== 0) {
          p.x += btnSize.x + 1;
          drawText(ctx, [p.x, p.y + btnSize.y + 1], i === 1 ? "Angle" : "Radius", fontColor, null, 14);
        }
        showBtn(p, btnSize, arrowLabels[i], arrowKeys[i]);
      }
      pos.y += (btnSize.y + 1) * 6;
    } else if (player instanceof Snake) {
      pos.y += btnSize.y + 1;
      showBtn(pos, btnSize, "_", " ");
    }
  }

  if (contextMenu.active && contextMenu.hovPath) return;
  const hov = hovSegment || hovAirPusher || hovShape || null;
  if (hov) {
    pos.y += btnSize.y + 1;
    if (hov === hovSegment) {
      if (selSegment) return;
      showBtn(pos, btnSize, "shift", "shift", hov.isAnchor ? "Unanchor" : "Set Anchor");
    } else if (hov === hovAirPusher) showBtn(pos, btnSize, "shift", "shift", player ? "Leave" : "Enter");
    else if (hov === hovShape) showBtn(pos, btnSize, "shift", "shift", "Resize");
    showBtn(new Vec2(pos.x, pos.y + btnSize.y + 1), btnSize, "Click", "click", "Place");
    pos.y += (btnSize.y + 1) * 2;
    showBtn(pos, btnSize, "Click + Alt", "click", "Duplicate");
    pos.y += (btnSize.y + 1) * 2;
    showBtn(pos, btnSize, "RMB", "RMB", "Parameters");
  }
}
