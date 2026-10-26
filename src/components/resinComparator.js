// =====================================================
// resinComparator.js – Comparador de resinas SLA/MSLA (3Dwork)
// Wrapper inspirado en filamentComparator, adaptado a resinas.
// Datos: src/assets/resins.json (gamas oficiales de Anycubic,
// Elegoo, Creality, Uniformation, Phrozen, Monocure3D).
// =====================================================

window.renderResinComparator = function (container, t, opts) {
    const RESINS_URL = (opts && opts.dataUrl) || './src/assets/resins.json';
    let allResins = [];
    let selected = new Set();
    let activeType = 'all';
    let activeBrand = 'all';
    let activeWash = 'all';
    let searchTerm = '';

    const RESIN_TYPES = ['Standard', 'ABS-Like', 'Tough', 'Water-Wash', 'Plant-Based', 'High-Speed', 'Clear', 'Flexible', 'Engineering', 'Castable'];
    const TYPE_COLORS = {
        'Standard': '#94A3B8', 'ABS-Like': '#F59E0B', 'Tough': '#EF4444',
        'Water-Wash': '#06B6D4', 'Plant-Based': '#22C55E', 'High-Speed': '#A855F7',
        'Clear': '#E2E8F0', 'Flexible': '#EC4899', 'Engineering': '#6366F1',
        'Castable': '#D4C5A0'
    };

    function badge(type) {
        const color = TYPE_COLORS[type] || '#94A3B8';
        return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;letter-spacing:0.05em;">${type}</span>`;
    }

    function washIcon(wash) {
        return wash === 'water' ? '💧 Lavable con agua' : '🧪 IPA';
    }

    function showDetail(r) {
        const lang = window.currentLang || 'es';
        const colors = (r.colors || []).map(c =>
            `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:0.75rem">
                <span style="width:12px;height:12px;border-radius:50%;background:${c.hex};border:1px solid rgba(255,255,255,0.2)"></span>${c.name}</span>`).join(' ') || '—';

        const modal = document.getElementById('comp-modal');
        const content = document.getElementById('comp-modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="comp-modal-header">
                <div>${badge(r.type)}<h2 style="margin:8px 0 0;font-size:1.3rem">${r.brand} ${r.name}</h2></div>
                <button class="comp-modal-close" id="comp-modal-close-detail"><i data-lucide="x"></i></button>
            </div>
            <div class="detail-section">
                <h3>${lang === 'es' ? 'Colores disponibles' : 'Available colors'}</h3>
                <div style="display:flex;gap:6px;flex-wrap:wrap">${colors}</div>
            </div>
            <div class="detail-section">
                <h3>${lang === 'es' ? 'Propiedades' : 'Properties'}</h3>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Precio (por kg)' : 'Price (per kg)'}</span><span class="spec-value">${r.price_eur ? '~' + r.price_eur + ' €' : '—'}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Lavado' : 'Wash'}</span><span class="spec-value">${washIcon(r.wash)}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Viscosidad' : 'Viscosity'}</span><span class="spec-value">${r.viscosity_mpas ? r.viscosity_mpas + ' mPa·s' : '—'}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Densidad' : 'Density'}</span><span class="spec-value">${r.density ? r.density + ' g/cm³' : '—'}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Peso envase' : 'Package'}</span><span class="spec-value">${r.weight_g ? r.weight_g + ' g' : '—'}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Uso principal' : 'Best for'}</span><span class="spec-value">${r.best_for || '—'}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Capa base' : 'Base layer'}</span><span class="spec-value">${r.layer_base_s ? r.layer_base_s + ' s' : '—'}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Capa normal' : 'Normal layer'}</span><span class="spec-value">${r.layer_normal_s ? r.layer_normal_s + ' s' : '—'}</span></div>
                    <div class="spec-box"><span class="spec-label">${lang === 'es' ? 'Temp. trabajo' : 'Working temp'}</span><span class="spec-value">${r.working_temp || '—'}</span></div>
                </div>
            </div>
            <div class="detail-section">
                <h3>${lang === 'es' ? 'Tiempo de capa y temperatura' : 'Layer time & temperature'}</h3>
                <p style="font-size:0.72rem;color:var(--text-muted);line-height:1.5;margin-bottom:0.4rem">
                    ${lang === 'es'
                        ? 'Los tiempos de capa (base/normal) y la temperatura de trabajo son valores ORIENTATIVOS basados en las guías del fabricante. Cada impresora (potencia del LED, altura de capa, velocidad de elevación) necesita su propio test de exposición. No son valores definitivos.'
                        : 'Layer times (base/normal) and working temperature are APPROXIMATE values from the manufacturer guides. Each printer (LED power, layer height, lift speed) needs its own exposure test. Not definitive values.'}
                </p>
                <p style="font-size:0.72rem;color:var(--text-muted);">
                    <a href="https://labs.3dwork.io/guias-impresion-3d/calibracion_3d" target="_blank" rel="noopener" style="color:var(--primary-light);text-decoration:none;font-weight:600;">${lang === 'es' ? 'Guía SLA de 3Dwork Labs ↗' : '3Dwork Labs SLA Guide ↗'}</a>
                </p>
            </div>
            <div class="detail-section">
                <h3>${lang === 'es' ? 'Fuente' : 'Source'}</h3>
                <p style="font-size:0.75rem;color:var(--text-muted)">${r.source || '—'} · actualizado ${r.updated || '—'}</p>
            </div>`;
        modal.classList.add('active');
        document.getElementById('comp-modal-close-detail').onclick = () => modal.classList.remove('active');
        if (window.lucide) window.lucide.createIcons();
    }

    function render() {
        const lang = window.currentLang || 'es';
        const filtered = allResins.filter(r => {
            if (activeType !== 'all' && r.type !== activeType) return false;
            if (activeBrand !== 'all' && r.brand !== activeBrand) return false;
            if (activeWash !== 'all' && r.wash !== activeWash) return false;
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                if (!(`${r.brand} ${r.name} ${r.type} ${r.best_for}`.toLowerCase().includes(q))) return false;
            }
            return true;
        }).sort((a, b) => (a.price_eur || 999) - (b.price_eur || 999));

        const brands = ['all', ...new Set(allResins.map(r => r.brand))].sort();
        const types = ['all', ...RESIN_TYPES.filter(t => allResins.some(r => r.type === t))];
        const washes = ['all', 'ipa', 'water'];

        let html = `
            <style>
                .comp-card { background:var(--bg-card); border:1px solid var(--glass-border); border-radius:16px; padding:1rem; transition:all 0.2s; }
                .comp-card:hover { border-color:var(--primary); transform:translateY(-2px); }
                .comp-pill { padding:0.3rem 0.7rem; border-radius:20px; border:1px solid var(--glass-border); background:rgba(15,23,42,0.7); color:var(--text-muted); font-size:0.75rem; cursor:pointer; transition:all 0.25s ease; }
                .comp-pill.active { background:var(--primary); color:#fff; border-color:var(--primary); }
                .spec-box { background:rgba(15,23,42,0.7); border:1px solid var(--glass-border); border-radius:8px; padding:0.5rem 0.6rem; }
                .spec-label { font-size:0.65rem; color:var(--text-muted); display:block; text-transform:uppercase; letter-spacing:0.05em; }
                .spec-value { font-size:0.85rem; font-weight:600; color:var(--text-main); }
                .detail-section { margin-top:1rem; }
                .detail-section h3 { font-size:0.85rem; color:var(--primary-light); margin-bottom:0.4rem; }
                .comp-modal { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:none; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(4px); }
                .comp-modal.active { display:flex; }
                .comp-modal-content { background:var(--bg-dark); border:1px solid var(--glass-border); border-radius:16px; padding:1.5rem; max-width:640px; width:92%; max-height:85vh; overflow:auto; }
                .comp-modal-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; }
                .comp-modal-close { background:none; border:none; color:var(--text-muted); cursor:pointer; }
                .comp-btn-select { padding:0.3rem 0.6rem; border-radius:6px; border:1px solid var(--glass-border); background:rgba(15,23,42,0.7); color:var(--text-muted); font-size:0.7rem; cursor:pointer; }
                .comp-btn-select--active { background:var(--primary); color:#fff; border-color:var(--primary); }
            </style>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;margin-bottom:1rem;">
                <input id="resin-search" type="search" placeholder="${lang === 'es' ? 'Buscar resina…' : 'Search resin…'}" style="flex:1;min-width:180px;padding:0.5rem 0.7rem;border-radius:8px;border:1px solid var(--glass-border);background:rgba(15,23,42,0.7);color:var(--text-main);font-size:0.8rem;">
                <span style="font-size:0.75rem;color:var(--text-muted)">${filtered.length} / ${allResins.length}</span>
            </div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem;">
                ${brands.map(b => `<button class="comp-pill ${activeBrand === b ? 'active' : ''}" data-brand="${b}">${b === 'all' ? (lang === 'es' ? 'Todas las marcas' : 'All brands') : b}</button>`).join('')}
            </div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:1rem;">
                ${types.map(ty => `<button class="comp-pill ${activeType === ty ? 'active' : ''}" data-type="${ty}">${ty === 'all' ? (lang === 'es' ? 'Todos los tipos' : 'All types') : ty}</button>`).join('')}
                <span style="width:1px;background:var(--glass-border);margin:0 0.2rem;"></span>
                ${washes.map(w => `<button class="comp-pill ${activeWash === w ? 'active' : ''}" data-wash="${w}">${w === 'all' ? (lang === 'es' ? 'Lavado: todos' : 'Wash: all') : (w === 'water' ? '💧 agua' : '🧪 IPA')}</button>`).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0.75rem;">
                ${filtered.map(r => `
                    <div class="comp-card" data-id="${r.id}">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.4rem;">
                            ${badge(r.type)}
                            <span style="font-size:0.72rem;color:var(--text-muted)">${r.brand}</span>
                        </div>
                        <h3 style="font-size:0.95rem;margin:0 0 0.3rem">${r.name}</h3>
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.4rem">${r.best_for || ''}</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:0.5rem;">
                            ${(r.colors || []).slice(0, 6).map(c => `<span style="width:14px;height:14px;border-radius:50%;background:${c.hex};border:1px solid rgba(255,255,255,0.2)" title="${c.name}"></span>`).join('')}
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;">
                            <span style="font-size:0.85rem;font-weight:700;color:var(--primary-light)">${r.price_eur ? '~' + r.price_eur + ' €/kg' : '—'}</span>
                            <span style="font-size:0.7rem;color:var(--text-muted)">${washIcon(r.wash)}</span>
                        </div>
                        <div style="display:flex;gap:0.4rem;margin-top:0.6rem;">
                            <button class="comp-btn-select" data-id="${r.id}">${lang === 'es' ? 'Detalle' : 'Detail'}</button>
                        </div>
                    </div>`).join('')}
            </div>
            <div class="comp-modal" id="comp-modal">
                <div class="comp-modal-content" id="comp-modal-content"></div>
            </div>`;

        container.innerHTML = html;

        // eventos
        const search = document.getElementById('resin-search');
        if (search) search.addEventListener('input', e => { searchTerm = e.target.value; render(); });
        container.querySelectorAll('[data-brand]').forEach(b => b.addEventListener('click', () => { activeBrand = b.dataset.brand; render(); }));
        container.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => { activeType = b.dataset.type; render(); }));
        container.querySelectorAll('[data-wash]').forEach(b => b.addEventListener('click', () => { activeWash = b.dataset.wash; render(); }));
        container.querySelectorAll('[data-id]').forEach(card => {
            const btn = card.querySelector('[data-id]');
            if (btn) btn.addEventListener('click', () => {
                const r = allResins.find(x => x.id === card.dataset.id);
                if (r) showDetail(r);
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }

    fetch(RESINS_URL).then(r => r.json()).then(data => {
        allResins = data.resins || [];
        render();
    }).catch(err => {
        container.innerHTML = '<p style="color:var(--text-muted)">Error cargando resinas: ' + err.message + '</p>';
    });
};
