const panel = document.getElementById("panel");

const sliders = {
  control: document.getElementById("rng-control"),
  accountability: document.getElementById("rng-accountability"),
  influence: document.getElementById("rng-influence"),
  support: document.getElementById("rng-support"),
};

const values = {
  control: document.getElementById("val-control"),
  accountability: document.getElementById("val-accountability"),
  influence: document.getElementById("val-influence"),
  support: document.getElementById("val-support"),
};

const ticks = {
  control: document.getElementById("ticks-control"),
  accountability: document.getElementById("ticks-accountability"),
  influence: document.getElementById("ticks-influence"),
  support: document.getElementById("ticks-support"),
};

const lineCS = document.getElementById("lineCS"); // Control -> Support
const lineAI = document.getElementById("lineAI"); // Accountability -> Influence

const status = document.getElementById("status");
const statusIcon = document.getElementById("statusIcon");
const statusText = document.getElementById("statusText");

const gapArrow = document.getElementById("gapArrow");

function getActiveRange(input){
  return { amin: Number(input.min), amax: Number(input.max) };
}

function buildTicks(key){
  const el = ticks[key];
  el.innerHTML = "";
  const { amin, amax } = getActiveRange(sliders[key]);

  for (let i = 0; i <= 10; i++){
    const t = document.createElement("div");
    t.className = "tick" + ((i < amin || i > amax) ? " inactive" : "");
    t.textContent = String(i);
    el.appendChild(t);
  }
}

function setValueBoxes(){
  Object.keys(sliders).forEach((k) => {
    values[k].textContent = sliders[k].value;
  });
}

function getThumbCenter(input){
  const rect = input.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();

  const min = Number(input.min);
  const max = Number(input.max);
  const val = Number(input.value);

  // ratio only across ACTIVE span
  const ratio = (val - min) / (max - min);
  const x = rect.left + ratio * rect.width;
  const y = rect.top + rect.height / 2;

  return { x: x - panelRect.left, y: y - panelRect.top };
}

function segmentsIntersect(a, b, c, d){
  function orient(p, q, r){
    return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  }
  function onSeg(p, q, r){
    return Math.min(p.x,r.x) <= q.x && q.x <= Math.max(p.x,r.x) &&
           Math.min(p.y,r.y) <= q.y && q.y <= Math.max(p.y,r.y);
  }

  const o1 = orient(a,b,c);
  const o2 = orient(a,b,d);
  const o3 = orient(c,d,a);
  const o4 = orient(c,d,b);

  if ((o1 > 0 && o2 < 0 || o1 < 0 && o2 > 0) &&
      (o3 > 0 && o4 < 0 || o3 < 0 && o4 > 0)) return true;

  if (o1 === 0 && onSeg(a,c,b)) return true;
  if (o2 === 0 && onSeg(a,d,b)) return true;
  if (o3 === 0 && onSeg(c,a,d)) return true;
  if (o4 === 0 && onSeg(c,b,d)) return true;

  return false;
}

function drawGapArrow(controlVal, accountabilityVal){
  gapArrow.innerHTML = "";

  const start = Math.min(controlVal, accountabilityVal);
  const end = Math.max(controlVal, accountabilityVal);

  // 0..10 visual scale
  const startPct = (start / 10) * 100;
  const endPct = (end / 10) * 100;

  const line = document.createElement("div");
  line.style.position = "absolute";
  line.style.left = `${startPct}%`;
  line.style.width = `${Math.max(0, endPct - startPct)}%`;
  line.style.top = "10px";
  line.style.height = "8px";
  line.style.borderTop = "3px solid #9aa3af";
  line.style.opacity = "0.9";

  const leftHead = document.createElement("div");
  leftHead.style.position = "absolute";
  leftHead.style.left = "0";
  leftHead.style.top = "-6px";
  leftHead.style.width = "0";
  leftHead.style.height = "0";
  leftHead.style.borderTop = "6px solid transparent";
  leftHead.style.borderBottom = "6px solid transparent";
  leftHead.style.borderRight = "10px solid #9aa3af";

  const rightHead = document.createElement("div");
  rightHead.style.position = "absolute";
  rightHead.style.right = "0";
  rightHead.style.top = "-6px";
  rightHead.style.width = "0";
  rightHead.style.height = "0";
  rightHead.style.borderTop = "6px solid transparent";
  rightHead.style.borderBottom = "6px solid transparent";
  rightHead.style.borderLeft = "10px solid #9aa3af";

  if (start === end){
    line.style.width = "0";
    leftHead.style.display = "none";
    rightHead.style.display = "none";
  }

  line.appendChild(leftHead);
  line.appendChild(rightHead);
  gapArrow.appendChild(line);
}

function update(){
  setValueBoxes();

  const pControl = getThumbCenter(sliders.control);
  const pSupport = getThumbCenter(sliders.support);
  const pAcc = getThumbCenter(sliders.accountability);
  const pInf = getThumbCenter(sliders.influence);

  lineCS.setAttribute("x1", pControl.x);
  lineCS.setAttribute("y1", pControl.y);
  lineCS.setAttribute("x2", pSupport.x);
  lineCS.setAttribute("y2", pSupport.y);

  lineAI.setAttribute("x1", pAcc.x);
  lineAI.setAttribute("y1", pAcc.y);
  lineAI.setAttribute("x2", pInf.x);
  lineAI.setAttribute("y2", pInf.y);

  const balanced = segmentsIntersect(pControl, pSupport, pAcc, pInf);

  if (balanced){
    status.classList.remove("bad");
    status.classList.add("ok");
    statusIcon.textContent = "✓";
    statusText.textContent = "This job is balanced (X-test).";
  } else {
    status.classList.remove("ok");
    status.classList.add("bad");
    statusIcon.textContent = "✕";
    statusText.textContent = "This job is imbalanced (X-test).";
  }

  drawGapArrow(Number(sliders.control.value), Number(sliders.accountability.value));
}

function init(){
  Object.keys(sliders).forEach((k) => {
    buildTicks(k);
    sliders[k].addEventListener("input", update);
    sliders[k].addEventListener("change", update);
  });
  update();
}

init();
window.addEventListener("resize", update);
