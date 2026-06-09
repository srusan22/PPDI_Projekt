// ============================================================
//  HONDA CIVIC TYPE R — app.js
// ============================================================

let DATA = null;
let activeSrc = 'json';
let activeJdmFilter = 'sve';
let searchFilter = 'sve';

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupNav();
  setupReveal();
  animateCounters();
  await loadJSON();
  setupSourceToggle();
  setupSearch();
  setupJdmFilters();
  setupModal();
  setupMobileMenu();
});

// ══════════════════════════════════════════════
//  DATA LOADING
// ══════════════════════════════════════════════
async function loadJSON() {
  try {
    const r = await fetch('cars.json');
    const d = await r.json();
    DATA = d;
    renderCivici(d.civici);
    renderJdm(d.ostali_jdm);
    document.getElementById('srcIndicator').textContent = 'Učitano iz JSON';
  } catch(e) {
    showGridError('civiciGrid', 'Greška učitavanja JSON: ' + e.message);
  }
}

async function loadXML() {
  try {
    const r = await fetch('cars.xml');
    const txt = await r.text();
    const xml = new DOMParser().parseFromString(txt, 'application/xml');
    // Extract civici from XML and merge with JSON opis/posebnosti
    const civiciXML = Array.from(xml.querySelectorAll('civici civic')).map(n => ({
      id: n.getAttribute('id'),
      generacija: getText(n,'generacija'),
      model: getText(n,'model'),
      godina_od: +getText(n,'godina_od'),
      godina_do: getText(n,'godina_do') ? +getText(n,'godina_do') : null,
      motor: {
        tip: getText(n,'tip'), zapremina: getText(n,'zapremina'),
        snaga_ks: +getText(n,'snaga_ks'), okretni_moment_nm: +getText(n,'okretni_moment_nm'),
        vtec_rpm: +getText(n,'vtec_rpm'), max_rpm: +getText(n,'max_rpm'),
      },
      pogon: getText(n,'pogon'), mjenjac: getText(n,'mjenjac'),
      masa_kg: +getText(n,'masa_kg'), ubrzanje_0_100: +getText(n,'ubrzanje_0_100'),
      max_brzina_kmh: +getText(n,'max_brzina_kmh'), boja_original: getText(n,'boja_original'),
      cijena_eur: +getText(n,'cijena_eur'), kategorija: getText(n,'kategorija'),
      // Merge opis+posebnosti+slika from JSON if available
      opis: DATA ? (DATA.civici.find(c=>c.id===n.getAttribute('id'))||{}).opis||'' : '',
      posebnosti: DATA ? (DATA.civici.find(c=>c.id===n.getAttribute('id'))||{}).posebnosti||[] : [],
      slika: DATA ? (DATA.civici.find(c=>c.id===n.getAttribute('id'))||{}).slika||'' : '',
    }));
    renderCivici(civiciXML);
    document.getElementById('srcIndicator').textContent = 'Učitano iz XML (parsed DOMParser)';
  } catch(e) {
    showGridError('civiciGrid', 'Greška učitavanja XML: ' + e.message);
  }
}

function getText(node, tag) {
  const el = node.querySelector(tag);
  return el ? el.textContent.trim() : '';
}

// ══════════════════════════════════════════════
//  RENDER CIVICI
// ══════════════════════════════════════════════
function renderCivici(civici) {
  const grid = document.getElementById('civiciGrid');
  grid.innerHTML = '';
  civici.forEach((c, i) => {
    const isTurbo = c.motor.tip.toLowerCase().includes('turbo');
    const yearRange = c.godina_do ? `${c.godina_od}–${c.godina_do}` : `${c.godina_od}–danas`;
    const card = document.createElement('div');
    card.className = 'civic-card';
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <div class="civic-card-img">
        <img src="${c.slika}" alt="${c.model}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'">
        <span class="civic-gen-badge">${c.generacija}</span>
        <span class="civic-year-badge">${yearRange}</span>
      </div>
      <div class="civic-card-body">
        <div class="civic-card-name">${c.model}</div>
        <div class="civic-specs-row">
          <div class="cs-item">
            <span class="cs-label">Snaga</span>
            <span class="cs-val red">${c.motor.snaga_ks} KS</span>
          </div>
          <div class="cs-item">
            <span class="cs-label">0–100 km/h</span>
            <span class="cs-val">${c.ubrzanje_0_100}s</span>
          </div>
          <div class="cs-item">
            <span class="cs-label">Motor</span>
            <span class="cs-val" style="font-size:.88rem">${c.motor.zapremina} ${isTurbo?'Turbo':'N/A'}</span>
          </div>
          <div class="cs-item">
            <span class="cs-label">Max RPM</span>
            <span class="cs-val">${c.motor.max_rpm.toLocaleString()}</span>
          </div>
        </div>
        <div class="civic-card-footer">
          <span class="civic-price">€${c.cijena_eur.toLocaleString()}</span>
          <button class="civic-btn">Specifikacije →</button>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openModal(c));
    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════════
//  RENDER JDM
// ══════════════════════════════════════════════
function renderJdm(cars) {
  const filtered = activeJdmFilter === 'sve' ? cars : cars.filter(c => c.kategorija === activeJdmFilter);
  const grid = document.getElementById('jdmGrid');
  grid.innerHTML = '';
  if (!filtered.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:.9rem;padding:2rem">Nema automobila u ovoj kategoriji.</p>';
    return;
  }
  filtered.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'jdm-card';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="jdm-img">
        <img src="${c.slika}" alt="${c.model}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'">
        <span class="jdm-cat">${c.kategorija}</span>
      </div>
      <div class="jdm-body">
        <div class="jdm-brand">${c.marka}</div>
        <div class="jdm-name">${c.model}</div>
        <div class="jdm-row">
          <span class="jdm-chip">⚡ ${c.snaga_ks} KS</span>
          <span class="jdm-chip">⏱ ${c.ubrzanje_0_100}s</span>
          <span class="jdm-chip">🔧 ${c.pogon}</span>
          <span class="jdm-chip">${c.godina}.</span>
        </div>
        <p style="font-size:.83rem;color:var(--muted);font-weight:300;line-height:1.7">${c.opis}</p>
        <div class="jdm-footer" style="margin-top:.9rem">
          <span class="jdm-price">€${c.cijena_eur.toLocaleString()}</span>
          <span class="jdm-ks">${c.motor}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════
function setupSearch() {
  const input = document.getElementById('mainSearch');
  const clear = document.getElementById('clearSearch');
  const sfBtns = document.querySelectorAll('.sf-btn');

  sfBtns.forEach(b => {
    b.addEventListener('click', () => {
      sfBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      searchFilter = b.dataset.sf;
      runSearch(input.value);
    });
  });

  input.addEventListener('input', () => {
    clear.style.display = input.value ? 'flex' : 'none';
    runSearch(input.value);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    clear.style.display = 'none';
    runSearch('');
  });
}

function runSearch(query) {
  if (!DATA) return;
  const q = query.toLowerCase().trim();
  const results = document.getElementById('searchResults');

  if (!q) {
    results.innerHTML = `<div class="search-empty"><div class="empty-icon">🔍</div><p>Počni tipkati za pretraživanje baze podataka Civic Type R</p></div>`;
    return;
  }

  let cars = [...DATA.civici];

  // Apply type filter
  if (searchFilter === 'atmosferski') cars = cars.filter(c => !c.motor.tip.toLowerCase().includes('turbo'));
  else if (searchFilter === 'turbo') cars = cars.filter(c => c.motor.tip.toLowerCase().includes('turbo'));
  else if (searchFilter === 'fwd') cars = cars.filter(c => c.pogon === 'FWD');

  // Search
  const matched = cars.filter(c => {
    const haystack = [
      c.id, c.generacija, c.model, c.motor.tip, c.motor.zapremina,
      c.motor.snaga_ks, c.motor.okretni_moment_nm, c.motor.max_rpm,
      c.pogon, c.mjenjac, c.masa_kg, c.ubrzanje_0_100,
      c.max_brzina_kmh, c.boja_original, c.cijena_eur,
      c.opis, ...(c.posebnosti || [])
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  });

  if (!matched.length) {
    results.innerHTML = `<div class="no-results-msg">Nema rezultata za "<strong>${escHTML(query)}</strong>" — pokušaj s drugim pojmom.</div>`;
    return;
  }

  results.innerHTML = matched.map(c => {
    const isTurbo = c.motor.tip.toLowerCase().includes('turbo');
    const highlight = (str) => {
      const s = String(str);
      if (!q) return escHTML(s);
      const re = new RegExp(`(${escRegex(q)})`, 'gi');
      return escHTML(s).replace(re, '<mark style="background:rgba(232,19,31,.25);color:var(--white)">$1</mark>');
    };
    return `
      <div class="search-result-item" data-id="${c.id}">
        <div class="sri-img">
          <img src="${c.slika}" alt="${c.model}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'">
        </div>
        <div class="sri-body">
          <div>
            <div class="sri-gen">${highlight(c.generacija)}</div>
            <div class="sri-name">${highlight(c.model)}</div>
          </div>
          <div class="sri-meta">
            <span class="sri-tag highlight">⚡ ${highlight(c.motor.snaga_ks + ' KS')}</span>
            <span class="sri-tag">${highlight(c.motor.tip)}</span>
            <span class="sri-tag">0–100: ${highlight(c.ubrzanje_0_100 + 's')}</span>
            <span class="sri-tag">€${c.cijena_eur.toLocaleString()}</span>
            ${isTurbo ? '<span class="sri-tag highlight">TURBO</span>' : '<span class="sri-tag">N/A</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Click to open modal
  results.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', () => {
      const car = DATA.civici.find(c => c.id === el.dataset.id);
      if (car) openModal(car);
    });
  });
}

// ══════════════════════════════════════════════
//  MODAL
// ══════════════════════════════════════════════
function setupModal() {
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(c) {
  const isTurbo = c.motor.tip.toLowerCase().includes('turbo');
  document.getElementById('modalImg').src = c.slika;
  document.getElementById('modalImg').onerror = function(){ this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'; };
  document.getElementById('modalGen').textContent = c.generacija;
  document.getElementById('modalModel').textContent = c.model;
  document.getElementById('modalYears').textContent = c.godina_do ? `${c.godina_od} – ${c.godina_do}` : `${c.godina_od} – danas`;
  document.getElementById('modalOpis').textContent = c.opis;

  document.getElementById('modalMotorSpecs').innerHTML = [
    ['Tip motora', c.motor.tip],
    ['Zapremina', c.motor.zapremina],
    ['Snaga', `${c.motor.snaga_ks} KS`],
    ['Okretni moment', `${c.motor.okretni_moment_nm} Nm`],
    ['VTEC @ RPM', c.motor.vtec_rpm.toLocaleString()],
    ['Max RPM', c.motor.max_rpm.toLocaleString()],
    ['Punjenje', isTurbo ? 'Turbo' : 'Atmosferski (N/A)'],
  ].map(([l,v]) => `<div class="spec-row-m"><span>${l}</span><strong>${v}</strong></div>`).join('');

  document.getElementById('modalPerfSpecs').innerHTML = [
    ['Pogon', c.pogon],
    ['Mjenjač', c.mjenjac],
    ['Masa', `${c.masa_kg} kg`],
    ['0–100 km/h', `${c.ubrzanje_0_100}s`],
    ['Max brzina', `${c.max_brzina_kmh} km/h`],
    ['Orig. boja', c.boja_original],
    ['Cijena', `€${c.cijena_eur.toLocaleString()}`],
  ].map(([l,v]) => `<div class="spec-row-m"><span>${l}</span><strong>${v}</strong></div>`).join('');

  const posebnosti = c.posebnosti || [];
  if (posebnosti.length) {
    document.getElementById('modalPosebnosti').innerHTML = `
      <h4>Posebnosti modela</h4>
      <div class="posebnosti-list">
        ${posebnosti.map(p => `<span class="posebnost-tag">✦ ${p}</span>`).join('')}
      </div>
    `;
  } else {
    document.getElementById('modalPosebnosti').innerHTML = '';
  }

  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════
//  SOURCE TOGGLE
// ══════════════════════════════════════════════
function setupSourceToggle() {
  document.querySelectorAll('.src-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.src-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSrc = btn.dataset.src;
      activeSrc === 'json' ? loadJSON() : loadXML();
    });
  });
}

// ══════════════════════════════════════════════
//  JDM FILTERS
// ══════════════════════════════════════════════
function setupJdmFilters() {
  document.querySelectorAll('.jf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.jf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeJdmFilter = btn.dataset.jf;
      if (DATA) renderJdm(DATA.ostali_jdm);
    });
  });
}

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════
function setupNav() {
  const navbar = document.getElementById('navbar');
  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    highlightActiveNavLink();
  }, { passive: true });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 70;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        // Close mobile menu
        document.getElementById('mobileMenu').classList.remove('open');
      }
    });
  });
}

function highlightActiveNavLink() {
  const sections = ['hero','povijest','civici','pretraga','jdm'];
  const scrollY = window.scrollY + 120;
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollY) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.section === current);
  });
}

function setupMobileMenu() {
  document.getElementById('navBurger').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
  });
}

// ══════════════════════════════════════════════
//  REVEAL ON SCROLL
// ══════════════════════════════════════════════
function setupReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// Re-observe newly added elements
function observeNew(selector) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll(selector + ':not(.visible)').forEach(el => obs.observe(el));
}

// ══════════════════════════════════════════════
//  COUNTER ANIMATION
// ══════════════════════════════════════════════
function animateCounters() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const isTime = el.nextElementSibling && el.nextElementSibling.textContent === 's';
      let start = 0;
      const dur = 1800;
      const step = timestamp => {
        if (!start) start = timestamp;
        const p = Math.min((timestamp - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num').forEach(el => obs.observe(el));
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function escHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}
function showGridError(id, msg) {
  document.getElementById(id).innerHTML = `<p style="color:var(--red);font-size:.9rem;padding:2rem">⚠ ${msg}</p>`;
}