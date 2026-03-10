const BUILDINGS = {
  T: { name: 'Theatre',         code: 'T', time: 5,  rate: 1500, css: 'theatre',    color: '#7c3aed' },
  P: { name: 'Pub',             code: 'P', time: 4,  rate: 1000, css: 'pub',        color: '#0ea5e9' },
  C: { name: 'Commercial Park', code: 'C', time: 10, rate: 2000, css: 'commercial', color: '#10b981' },
};

function calcEarnings(n, sequence) {
  let total = 0, timeUsed = 0;
  const steps = [];
  for (const code of sequence) {
    const b = BUILDINGS[code];
    const start = timeUsed;
    timeUsed += b.time;
    const operational = n - timeUsed;
    const earn = operational > 0 ? b.rate * operational : 0;
    total += earn;
    steps.push({ code, name: b.name, start, openAt: timeUsed, operational: Math.max(0, operational), earn });
  }
  return { total, steps };
}

function bestOrder(n, t, p, c) {
  const seq = [];
  for (let i = 0; i < t; i++) seq.push('T');
  for (let i = 0; i < p; i++) seq.push('P');
  for (let i = 0; i < c; i++) seq.push('C');
  seq.sort((a, b) => (BUILDINGS[b].rate / BUILDINGS[b].time) - (BUILDINGS[a].rate / BUILDINGS[a].time));
  return seq;
}

function solve(n) {
  const maxT = Math.floor(n / 5);
  const maxP = Math.floor(n / 4);
  const maxC = Math.floor(n / 10);
  let best = 0;
  const solutions = [];
  for (let t = 0; t <= maxT; t++) {
    for (let p = 0; p <= maxP; p++) {
      for (let c = 0; c <= maxC; c++) {
        const buildTime = t * 5 + p * 4 + c * 10;
        if (buildTime > n) continue;
        if (t === 0 && p === 0 && c === 0) continue;
        const seq = bestOrder(n, t, p, c);
        const { total, steps } = calcEarnings(n, seq);
        if (total > best) {
          best = total;
          solutions.length = 0;
          solutions.push({ t, p, c, seq, steps, total });
        } else if (total === best && total > 0) {
          solutions.push({ t, p, c, seq, steps, total });
        }
      }
    }
  }
  return { best, solutions };
}

function fmt(n) { return '$' + n.toLocaleString(); }

function runPreset(val) {
  document.getElementById('time-input').value = val;
  runSolver();
}

function runSolver() {
  const n = parseInt(document.getElementById('time-input').value, 10);
  if (isNaN(n) || n < 1) { alert('Please enter a valid time unit (≥ 1).'); return; }

  const { best, solutions } = solve(n);
  const section = document.getElementById('result-section');
  section.classList.add('visible');

  document.getElementById('earnings-value').textContent = fmt(best);
  document.getElementById('time-display').textContent = n;
  const first = solutions[0];
  document.getElementById('buildings-display').textContent = first ? first.t + first.p + first.c : 0;
  document.getElementById('earnings-meta').textContent = solutions.length
    ? `${solutions.length} optimal solution${solutions.length > 1 ? 's' : ''} found`
    : 'No profitable solution in this time window';

  document.getElementById('sol-count-label').textContent =
    solutions.length + ' solution' + (solutions.length !== 1 ? 's' : '');

  const solList = document.getElementById('solutions-list');
  solList.innerHTML = '';
  solutions.slice(0, 12).forEach((sol, i) => {
    const row = document.createElement('div');
    row.className = 'solution-row';
    row.innerHTML = `
      <span class="sol-idx">${i + 1}.</span>
      <div class="sol-buildings">
        <span class="sol-building t"><div class="sol-dot" style="background:#7c3aed;"></div>T: ${sol.t}</span>
        <span class="sol-building p"><div class="sol-dot" style="background:#0ea5e9;"></div>P: ${sol.p}</span>
        <span class="sol-building c"><div class="sol-dot" style="background:#10b981;"></div>C: ${sol.c}</span>
      </div>
      <span style="font-family:var(--mono);font-size:0.76rem;color:var(--accent2);margin-left:auto;">${fmt(sol.total)}</span>
    `;
    solList.appendChild(row);
  });

  if (!solutions.length) {
    solList.innerHTML = `<div style="padding:0.875rem;color:var(--muted);font-family:var(--mono);font-size:0.78rem;">
      Not enough time to build any property profitably.</div>`;
  }

  const track = document.getElementById('timeline-track');
  track.innerHTML = '';
  if (first) {
    first.steps.forEach(step => {
      const pct = (BUILDINGS[step.code].time / n) * 100;
      const seg = document.createElement('div');
      seg.className = `tl-segment ${BUILDINGS[step.code].css}`;
      seg.style.width = pct + '%';
      seg.style.minWidth = '24px';
      seg.title = `${step.name}: t${step.start}–t${step.openAt}, earns ${fmt(step.earn)}`;
      seg.textContent = step.code;
      track.appendChild(seg);
    });
    const usedTime = first.steps.reduce((s, x) => s + BUILDINGS[x.code].time, 0);
    const idlePct = ((n - usedTime) / n) * 100;
    if (idlePct > 0) {
      const idle = document.createElement('div');
      idle.className = 'tl-segment idle';
      idle.style.width = idlePct + '%';
      idle.style.minWidth = '8px';
      idle.title = `Idle: ${n - usedTime} units unused`;
      idle.textContent = idlePct > 6 ? 'idle' : '';
      track.appendChild(idle);
    }
  }

  const tbody = document.getElementById('step-tbody');
  tbody.innerHTML = '';
  if (first) {
    let running = 0;
    first.steps.forEach((step, i) => {
      running += step.earn;
      const b = BUILDINGS[step.code];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--muted)">${i + 1}</td>
        <td><span style="display:inline-flex;align-items:center;gap:0.35rem;">
          <span style="width:7px;height:7px;border-radius:50%;background:${b.color};display:inline-block;flex-shrink:0;"></span>
          ${step.name}
        </span></td>
        <td>t = ${step.start}</td>
        <td>t = ${step.openAt}</td>
        <td>${step.operational} units</td>
        <td class="td-earn">${fmt(step.earn)}</td>
        <td class="td-total">${fmt(running)}</td>
      `;
      tbody.appendChild(tr);
    });
    const totalTr = document.createElement('tr');
    totalTr.innerHTML = `
      <td colspan="5" style="text-align:right;color:var(--muted);font-size:0.67rem;letter-spacing:0.08em;text-transform:uppercase;">TOTAL</td>
      <td class="td-earn" style="color:var(--accent);font-size:0.95rem;">${fmt(first.total)}</td>
      <td></td>
    `;
    tbody.appendChild(totalTr);
  }

  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

window.onload = () => runSolver();