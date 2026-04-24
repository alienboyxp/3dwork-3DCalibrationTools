window.renderFilamentComparator = function (container, t, opts) {
    const FILAMENTS_URL = (opts && opts.dataUrl) || './src/assets/filaments.json';
    let allFilaments = [];
    let selected = new Set();
    let activeMaterial = 'all';
    let activeBrand = 'all';
    let activeEnclosure = 'all';
    let searchTerm = '';
    let specialFilter = '';

    const MATERIAL_TYPES = ['PLA', 'PLA+', 'PETG', 'PETG HS', 'ABS', 'ASA', 'TPU', 'PA', 'PA-CF', 'PC', 'PC-ABS'];

    const SPEC_DEFS = {
        default: [
            { key: 'nozzle_temp', label: { en: 'Nozzle Temp', es: 'Temp. nozzle' }, format: f => `${f.nozzle_temp_min || '?'}–${f.nozzle_temp_max || '?'}°C`, best: null },
            { key: 'bed_temp', label: { en: 'Bed Temp', es: 'Temp. cama' }, format: f => `${f.bed_temp_min || '?'}–${f.bed_temp_max || '?'}°C`, best: null },
            { key: 'enclosure', label: { en: 'Enclosure', es: 'Cerrada' }, format: f => f.enclosure_needed ? '✓' : '✗', best: null },
            { key: 'colors', label: { en: 'Colors', es: 'Colores' }, format: f => f.colors ? `${f.colors.length}+` : '—', best: null },
            { key: 'price_eur', label: { en: 'Price', es: 'Precio' }, format: f => f.price_eur ? `~${f.price_eur}€` : '—', best: 'min' },
        ]
    };

    const MATERIAL_COLORS = {
        'PLA': '#10B981', 'PLA+': '#34D399', 'PETG': '#06B6D4', 'PETG HS': '#22D3EE',
        'ABS': '#F59E0B', 'ASA': '#F97316', 'TPU': '#EC4899', 'PA': '#8B5CF6',
        'PA-CF': '#A855F7', 'PC': '#6366F1', 'PC-ABS': '#818CF8'
    };

    function getMaterialBadge(material) {
        const color = MATERIAL_COLORS[material] || '#94A3B8';
        return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;letter-spacing:0.05em;">${material}</span>`;
    }

    function filtered() {
        return allFilaments.filter(f => {
            const matchMaterial = activeMaterial === 'all' || f.material === activeMaterial;
            const matchBrand = activeBrand === 'all' || f.brand === activeBrand;
            const matchEnclosure = activeEnclosure === 'all' || 
                (activeEnclosure === 'yes' && f.enclosure_needed) ||
                (activeEnclosure === 'no' && !f.enclosure_needed);
            const matchSearch = !searchTerm || 
                f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (f.colors && f.colors.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())));
            const matchSpecial = !specialFilter || 
                (f.special_properties && f.special_properties.includes(specialFilter));
            return matchMaterial && matchBrand && matchEnclosure && matchSearch && matchSpecial;
        });
    }

    function renderGrid() {
        const grid = document.getElementById('comp-grid');
        const noResults = document.getElementById('comp-no-results');
        if (!grid) return;
        const list = filtered();
        grid.innerHTML = '';
        if (list.length === 0) {
            if (noResults) noResults.style.display = 'block';
            return;
        }
        if (noResults) noResults.style.display = 'none';
        const lang = window.currentLang || 'es';

        list.forEach(f => {
            const isSelected = selected.has(f.id);
            const card = document.createElement('div');
            card.className = 'comp-card' + (isSelected ? ' comp-card--selected' : '');
            card.dataset.id = f.id;

            const specialProps = f.special_properties ? f.special_properties.slice(0, 3) : [];
            const specialBadges = specialProps.map(p => 
                `<span style="background:rgba(139,92,246,0.15);color:#A78BFA;padding:2px 6px;border-radius:8px;font-size:0.65rem">${p}</span>`
            ).join(' ');

            const priceDisplay = f.price_eur 
                ? `<b style="color:var(--secondary)">~${f.price_eur}€</b>` 
                : '<b>—</b>';

            card.innerHTML = `
                <div class="comp-card__header">
                    <div class="comp-card__badge-row">
                        ${getMaterialBadge(f.material)}
                        ${f.partner ? `<span style="background:#10B98122;color:#10B981;border:1px solid #10B98144;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;">Partner</span>` : ''}
                        <span class="comp-card__brand">${f.brand}</span>
                    </div>
                    <h3 class="comp-card__name">${f.name}</h3>
                </div>
                <div class="comp-card__quick-specs">
                    <div class="qs"><span>${lang === 'es' ? 'Nozzle' : 'Nozzle'}</span><b>${f.nozzle_temp_min || '?'}–${f.nozzle_temp_max || '?'}°C</b></div>
                    <div class="qs"><span>${lang === 'es' ? 'Cama' : 'Bed'}</span><b>${f.bed_temp_min || '?'}–${f.bed_temp_max || '?'}°C</b></div>
                    <div class="qs"><span>${lang === 'es' ? 'Cerrada' : 'Enclosed'}</span><b>${f.enclosure_needed ? '✓' : '✗'}</b></div>
                    <div class="qs"><span>${lang === 'es' ? 'Precio' : 'Price'}</span>${priceDisplay}</div>
                </div>
                ${specialBadges ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0;padding:0 12px">${specialBadges}</div>` : ''}
                <div class="comp-card__actions">
                    <button class="comp-btn-select ${isSelected ? 'comp-btn-select--active' : ''}" data-id="${f.id}">
                        ${isSelected
                            ? `<i data-lucide="check-square"></i> ${lang === 'es' ? 'Seleccionado' : 'Selected'}`
                            : `<i data-lucide="square"></i> ${lang === 'es' ? 'Comparar' : 'Compare'}`}
                    </button>
                    ${f.reviewUrl ? `<a href="${f.reviewUrl}" target="_blank" class="comp-btn-review">
                        ${lang === 'es' ? 'Review' : 'Review'} <i data-lucide="external-link"></i>
                    </a>` : ''}
                    ${f.aliexpress_url ? `<a href="${f.aliexpress_url}" target="_blank" class="comp-btn-buy">
                        ${lang === 'es' ? 'Comprar' : 'Buy'} <i data-lucide="shopping-cart"></i>
                    </a>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();

        grid.querySelectorAll('.comp-btn-select').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (selected.has(id)) {
                    selected.delete(id);
                } else {
                    if (selected.size >= 4) {
                        showToast(lang === 'es' ? 'Máximo 4 productos a comparar' : 'Maximum 4 products to compare');
                        return;
                    }
                    selected.add(id);
                }
                updateCompareBar();
                renderGrid();
            });
        });
    }

    function updateCompareBar() {
        const bar = document.getElementById('comp-bar');
        const count = document.getElementById('comp-bar-count');
        if (!bar) return;
        if (selected.size >= 2) {
            bar.style.display = 'flex';
            const lang = window.currentLang || 'es';
            if (count) count.textContent = lang === 'es'
                ? `${selected.size} ${selected.size === 1 ? 'filamento seleccionado' : 'filamentos seleccionados'}`
                : `${selected.size} filament${selected.size > 1 ? 's' : ''} selected`;
        } else {
            bar.style.display = 'none';
        }
    }

    function showCompareModal() {
        const lang = window.currentLang || 'es';
        const filaments = allFilaments.filter(f => selected.has(f.id));
        if (filaments.length < 2) return;

        const defs = SPEC_DEFS.default;
        let headerCols = filaments.map(f => {
            const matColor = MATERIAL_COLORS[f.material] || '#94A3B8';
            return `<th>
                <div style="text-align:center">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">${f.brand}</div>
                    <div style="margin-bottom:4px">${getMaterialBadge(f.material)}</div>
                    <div style="font-weight:700;font-size:0.9rem">${f.name}</div>
                    ${f.price_eur ? `<div style="color:var(--secondary);margin-top:4px">~${f.price_eur}€</div>` : ''}
                </div>
            </th>`;
        }).join('');

        let specRows = defs.map(spec => {
            let cells = filaments.map(f => {
                let val = spec.format(f);
                const isBest = spec.best === 'min' && f.price_eur;
                const allPrices = filaments.filter(f2 => f2.price_eur).map(f2 => f2.price_eur);
                const minPrice = Math.min(...allPrices);
                const cellClass = isBest || (spec.best === 'min' && f.price_eur === minPrice) ? 'style="color:var(--secondary);font-weight:600"' : '';
                return `<td ${cellClass}>${val}</td>`;
            }).join('');
            return `<tr><td class="spec-label">${spec.label[lang]}</td>${cells}</tr>`;
        }).join('');

        let propsRow = filaments.map(f => {
            const props = f.special_properties ? f.special_properties.join(', ') : '—';
            return `<td style="font-size:0.75rem;padding:8px">${props}</td>`;
        }).join('');

        const modal = document.createElement('div');
        modal.className = 'comp-modal';
        modal.innerHTML = `
            <div class="comp-modal__backdrop"></div>
            <div class="comp-modal__content">
                <div class="comp-modal__header">
                    <h2>${lang === 'es' ? 'Comparar filamentos' : 'Compare filaments'}</h2>
                    <button class="comp-modal__close" id="comp-modal-close"><i data-lucide="x"></i></button>
                </div>
                <div class="comp-modal__table-wrap">
                    <table class="comp-table">
                        <thead><tr><th></th>${headerCols}</tr></thead>
                        <tbody>${specRows}<tr><td class="spec-label">${lang === 'es' ? 'Propiedades' : 'Properties'}</td>${propsRow}</tr></tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();

        modal.querySelector('#comp-modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.comp-modal__backdrop').addEventListener('click', () => modal.remove());
    }

    function showToast(msg) {
        const existing = document.querySelector('.comp-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'comp-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function init(container) {
        container.innerHTML = `
            <div class="comp-hero">
                <h1>${window.currentLang === 'es' ? 'Comparador de Filamentos 3D' : '3D Filament Comparator'}</h1>
                <p>${window.currentLang === 'es' 
                    ? 'Compara especificaciones, temperaturas y precios de los mejores filamentos del mercado.'
                    : 'Compare specs, temperatures and prices of the best 3D filaments.'}</p>
            </div>
            <div class="comp-filters">
                <div class="comp-filter-group">
                    <label>${window.currentLang === 'es' ? 'Material' : 'Material'}</label>
                    <select id="filter-material">
                        <option value="all">${window.currentLang === 'es' ? 'Todos' : 'All'}</option>
                        ${MATERIAL_TYPES.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
                <div class="comp-filter-group">
                    <label>${window.currentLang === 'es' ? 'Marca' : 'Brand'}</label>
                    <select id="filter-brand"><option value="all">${window.currentLang === 'es' ? 'Todas' : 'All'}</option></select>
                </div>
                <div class="comp-filter-group">
                    <label>${window.currentLang === 'es' ? 'Cámara cerrada' : 'Enclosure'}</label>
                    <select id="filter-enclosure">
                        <option value="all">${window.currentLang === 'es' ? 'Todos' : 'All'}</option>
                        <option value="yes">${window.currentLang === 'es' ? 'Sí necesaria' : 'Required'}</option>
                        <option value="no">${window.currentLang === 'es' ? 'No necesaria' : 'Not required'}</option>
                    </select>
                </div>
                <div class="comp-filter-group comp-filter-group--search">
                    <label>${window.currentLang === 'es' ? 'Buscar' : 'Search'}</label>
                    <input type="text" id="filter-search" placeholder="${window.currentLang === 'es' ? 'Nombre, marca, color...' : 'Name, brand, color...'}">
                </div>
            </div>
            <div id="comp-grid" class="comp-grid"></div>
            <div id="comp-no-results" class="comp-no-results" style="display:none">
                <p>${window.currentLang === 'es' ? 'No se encontraron filamentos' : 'No filaments found'}</p>
            </div>
            <div id="comp-bar" class="comp-bar" style="display:none">
                <span id="comp-bar-count"></span>
                <button id="comp-bar-compare">${window.currentLang === 'es' ? 'Comparar seleccionados' : 'Compare selected'}</button>
                <button id="comp-bar-clear">${window.currentLang === 'es' ? 'Limpiar' : 'Clear'}</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .comp-hero { text-align:center; padding:40px 20px 20px; }
            .comp-hero h1 { font-size:2rem; font-weight:800; margin-bottom:8px; background:linear-gradient(135deg,#06B6D4,#10B981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
            .comp-hero p { color:var(--text-muted); max-width:600px; margin:0 auto; }
            .comp-filters { display:flex; flex-wrap:wrap; gap:16px; padding:20px; background:var(--bg-card); border-radius:16px; margin:0 20px 20px; border:1px solid var(--glass-border); }
            .comp-filter-group { display:flex; flex-direction:column; gap:6px; }
            .comp-filter-group label { font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
            .comp-filter-group select, .comp-filter-group input { background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:8px; padding:8px 12px; color:var(--text-main); font-family:var(--font-family); }
            .comp-filter-group--search { flex:1; min-width:200px; }
            .comp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; padding:0 20px 20px; }
            .comp-card { background:var(--bg-card); border:1px solid var(--glass-border); border-radius:16px; overflow:hidden; transition:all 0.2s; }
            .comp-card:hover { border-color:var(--primary); box-shadow:0 0 20px var(--accent-glow); transform:translateY(-2px); }
            .comp-card--selected { border-color:var(--secondary); }
            .comp-card__header { padding:16px; }
            .comp-card__badge-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
            .comp-card__brand { font-size:0.75rem; color:var(--text-muted); }
            .comp-card__name { font-size:1rem; font-weight:600; margin-top:4px; }
            .comp-card__quick-specs { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:12px 16px; background:rgba(0,0,0,0.2); }
            .qs { display:flex; flex-direction:column; gap:2px; }
            .qs span { font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; }
            .qs b { font-size:0.85rem; }
            .comp-card__actions { display:flex; gap:8px; padding:12px 16px; flex-wrap:wrap; }
            .comp-btn-select, .comp-btn-review, .comp-btn-buy { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; font-size:0.75rem; font-weight:500; cursor:pointer; border:none; font-family:var(--font-family); text-decoration:none; transition:all 0.2s; }
            .comp-btn-select { background:rgba(139,92,246,0.2); color:#A78BFA; }
            .comp-btn-select:hover { background:rgba(139,92,246,0.3); }
            .comp-btn-select--active { background:#10B981; color:white; }
            .comp-btn-review { background:rgba(99,102,241,0.2); color:#818CF8; }
            .comp-btn-buy { background:rgba(16,185,129,0.2); color:#10B981; }
            .comp-no-results { text-align:center; padding:60px 20px; color:var(--text-muted); }
            .comp-bar { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--bg-card); border:1px solid var(--secondary); border-radius:16px; padding:12px 20px; display:flex; align-items:center; gap:16px; box-shadow:0 4px 20px rgba(0,0,0,0.3); z-index:100; }
            .comp-bar button { padding:8px 16px; border-radius:8px; border:none; font-weight:500; cursor:pointer; font-family:var(--font-family); }
            #comp-bar-compare { background:var(--secondary); color:white; }
            #comp-bar-clear { background:rgba(255,255,255,0.1); color:var(--text-main); }
            .comp-modal { position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; }
            .comp-modal__backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); }
            .comp-modal__content { position:relative; background:var(--bg-dark); border:1px solid var(--glass-border); border-radius:16px; max-width:90vw; max-height:90vh; overflow:auto; }
            .comp-modal__header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid var(--glass-border); }
            .comp-modal__header h2 { font-size:1.2rem; }
            .comp-modal__close { background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; }
            .comp-modal__table-wrap { padding:20px; overflow:auto; }
            .comp-table { width:100%; border-collapse:collapse; }
            .comp-table th { padding:12px 8px; vertical-align:bottom; }
            .comp-table td { padding:10px 8px; text-align:center; border-top:1px solid var(--glass-border); }
            .spec-label { text-align:left; color:var(--text-muted); font-size:0.8rem; width:140px; }
            .comp-toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#EF4444; color:white; padding:12px 20px; border-radius:8px; font-weight:500; z-index:1001; }
            @media (max-width:768px) { .comp-filters { flex-direction:column; } .comp-grid { grid-template-columns:1fr; } }
        `;
        document.head.appendChild(style);

        document.getElementById('filter-material').addEventListener('change', e => { activeMaterial = e.target.value; renderGrid(); });
        document.getElementById('filter-brand').addEventListener('change', e => { activeBrand = e.target.value; renderGrid(); });
        document.getElementById('filter-enclosure').addEventListener('change', e => { activeEnclosure = e.target.value; renderGrid(); });
        document.getElementById('filter-search').addEventListener('input', e => { searchTerm = e.target.value; renderGrid(); });
        document.getElementById('comp-bar-compare').addEventListener('click', showCompareModal);
        document.getElementById('comp-bar-clear').addEventListener('click', () => { selected.clear(); updateCompareBar(); renderGrid(); });

        fetch(FILAMENTS_URL)
            .then(r => r.json())
            .then(data => {
                allFilaments = data.filaments || [];
                const brands = [...new Set(allFilaments.map(f => f.brand))].sort();
                const brandSelect = document.getElementById('filter-brand');
                brands.forEach(b => { brandSelect.innerHTML += `<option value="${b}">${b}</option>`; });
                renderGrid();
            })
            .catch(err => console.error('Error loading filaments:', err));
    }

    init(container);
};