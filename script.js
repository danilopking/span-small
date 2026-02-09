const panel = document.getElementById("panel");
const spansEl = document.getElementById("spans");
const overlaySvg = document.getElementById("overlaySvg");
const gapSvg = document.getElementById("gapSvg");

const sliders = {
  control: document.getElementById("s-control"),
  accountability: document.getElementById("s-accountability"),
  influence: document.getElementById("s-influence"),
  support: document.getElementById("s-support"),
};

const boxes = {
  control: document.getElementById("box-control"),
  accountability: document.getElementById("box-accountability"),
  influence: document.getElementById("box-influence"),
  support: document.getElementById("box-support"),
};

const statusEl = document.getElementById("status");
const statusText = document.getElementById("statusText");

function val(key){ return parseInt(sliders[key].value, 10); }

function setBoxes(){
  for (const k of Object.keys(boxes)) boxes[k].textContent = String(val(k));
}

function clear(node){
  while(node.firstChild) node.removeChild(node.firstChild);
}

function svgEl(tag, attrs, parent){
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent.appendChild(el);
  return el;
}

function sliderPoint(key){
  const input = sliders[key];
  const rect = input.getBoundingClientRect();
  const host = spansEl.getBoundingClientRect();

  const min = parseInt(input.min,10);
  const max = parseInt(input.max,10);
  const v = val(key);
  const t = (v - min) / (max - min);

  const x = (rect.left - host.left) + t * rect.width;
  const y = (rect.top - host.top) + rect.height / 2;

  return { x, y };
}

function xFromRange(input, width){
  const min = parseInt(input.min,10);
  const max = parseInt(input.max,10);
  const v = parseInt(input.value,10);
  const t = (v - min) / (max - min);
  return t * width;
}

function renderGapArrow(){
  const w = gapSvg.clientWidth;
  const h = gapSvg.clientHeight;

  gapSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  gapSvg.setAttribute("preserveAspectRatio", "none");
  clear(gapSvg);

  const xC = xFromRange(sliders.control, w);
  const xA = xFromRange(sliders.accountability, w);

  const left = Math.min(xC, xA);
  const right = Math.max(xC, xA);

  const y = h * 0.50;

  const stroke = "rgba(15,23,42,.45)";
  const fill = "rgba(15,23,42,.45)";

  const head = 14;
  const half = 7;

  svgEl("line", {
    x1: left + head,
    y1: y,
    x2: right - head,
    y2: y,
    stroke,
    "stroke-width": 3,
    "stroke-linecap": "round",
  }, gapSvg);

  svgEl("path", {
    d: `M ${left + head} ${y - half} L ${left} ${y} L ${left + head} ${y + half} Z`,
    fill
  }, gapSvg);

  svgEl("path", {
    d: `M ${right - head} ${y - half} L ${right} ${y} L ${right - head} ${y + half} Z`,
    fill
  }, gapSvg);

  svgEl("text", {
    x: (left + right) / 2,
    y: y + 26,
    fill: "rgba(15,23,42,.55)",
    "font-size": 18,
    "text-anchor": "middle",
    "font-family": "ui-sans-serif, system-ui"
  }, gapSvg).textContent = "Entrepreneurial Gap";
}

/** Geometry: do two segments intersect? */
function segmentsIntersect(a,b,c,d){
  // a-b and c-d
  function orient(p,q,r){
    return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  }
  function onSeg(p,q,r){
    return Math.min(p.x,r.x) <= q.x && q.x <= Math.max(p.x,r.x) &&
           Math.min(p.y,r.y) <= q.y && q.y <= Math.max(p.y,r.y);
  }
  const o1 = orient(a,b,c);
  const o2 = orient(a,b,d);
  const o3 = orient(c,d,a);
  const o4 = orient(c,d,b);

  if ((o1 > 0 && o2 < 0 || o1 < 0 && o2 > 0) &&
      (o3 > 0 && o4 < 0 || o3 < 0 && o4 > 0)) return true;

  // collinear cases (rare here, but ok)
  if (o1 === 0 && onSeg(a,c,b)) return true;
  if (o2 === 0 && onSeg(a,d,b)) return true;
  if (o3 === 0 && onSeg(c,a,d)) return true;
  if (o4 === 0 && onSeg(c,b,d)) return true;

  return false;
}

function renderXTest(){
  const host = spansEl.getBoundingClientRect();
  overlaySvg.setAttribute("viewBox", `0 0 ${host.width} ${host.height}`);
  overlaySvg.setAttribute("preserveAspectRatio", "none");
  clear(overlaySvg);

  const pControl = sliderPoint("control");
  const pAcc = sliderPoint("accountability");
  const pInfluence = sliderPoint("influence");
  const pSupport = sliderPoint("support");

  // JDOT-style “X”: (Control ↔ Influence) and (Accountability ↔ Support)
  svgEl("line", {
    x1: pControl.x, y1: pControl.y,
    x2: pInfluence.x, y2: pInfluence.y,
    stroke: "rgba(17,24,39,.78)",
    "stroke-width": 2.2,
    "stroke-dasharray": "2 5",
    "stroke-linecap": "round",
  }, overlaySvg);

  svgEl("line", {
    x1: pAcc.x, y1: pAcc.y,
    x2: pSupport.x, y2: pSupport.y,
    stroke: "rgba(17,24,39,.78)",
    "stroke-width": 2.2,
    "stroke-dasharray": "2 5",
    "stroke-linecap": "round",
  }, overlaySvg);

  // Balanced if the two segments intersect (form an X)
  const balanced = segmentsIntersect(pControl, pInfluence, pAcc, pSupport);

  statusEl.classList.remove("ok","bad");
  if (balanced){
    statusEl.classList.add("ok");
    statusText.textContent = "This job is balanced.";
  } else {
    statusEl.classList.add("bad");
    statusText.textContent = "This job is imbalanced.";
  }
}

function render(){
  setBoxes();
  renderGapArrow();
  renderXTest();
}

Object.values(sliders).forEach(inp => inp.addEventListener("input", render));
new ResizeObserver(() => render()).observe(panel);

render();
