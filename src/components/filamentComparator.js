window.renderFilamentComparator = function (container, t, opts) {
    const FILAMENTS_URL = (opts && opts.dataUrl) || './src/assets/filaments.json';
    let allFilaments = [];
    let selected = new Set();
    let activeMaterial = 'all';
    let activeBrand = 'all';
    let activeEnclosure = 'all';
    let searchTerm = '';

    const MATERIAL_TYPES = ['PLA', 'PLA+', 'PETG', 'PETG HS', 'ABS', 'ASA', 'TPU', 'PA', 'PA-CF', 'PC', 'PC-ABS'];

    const MATERIAL_COLORS = {
        'PLA': '#10B981', 'PLA+': '#34D399', 'PETG': '#06B6D4', 'PETG HS': '#22D3EE',
        'ABS': '#F59E0B', 'ASA': '#F97316', 'TPU': '#EC4899', 'PA': '#8B5CF6',
        'PA-CF': '#A855F7', 'PC': '#6366F1', 'PC-ABS': '#818CF8'
    };

    const BUILD_PLATE_ICONS = {
        'smooth_pei': '🟦',
        'textured_pei': '🔲',
        'cool_plate': '❄️',
        'engineering_plate': '⚙️',
        'glue_recommended': '🧴'
    };

    function getMaterialBadge(material) {
        const color = MATERIAL_COLORS[material] || '#94A3B8';
        return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;letter-spacing:0.05em;">${material}</span>`;
    }

    function showDetailModal(f) {
        const lang = window.currentLang || 'es';
        const colors = f.colors ? f.colors.map(c => 
            `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:0.75rem">
                <span style="width:12px;height:12px;border-radius:50%;background:${c.hex};border:1px solid rgba(255,255,255,0.2)"></span>
                ${c.name}
            </span>`
        ).join('') : '—';

        const buildPlates = f.build_plates ? f.build_plates.map(bp => 
            `<span style="padding:3px 8px;background:rgba(99,102,241,0.15);color:#818CF8;border-radius:6px;font-size:0.7rem">${bp.replace('_', ' ')}</span>`
        ).join(' ') : '—';

        const amsCompatible = (f.ams || f.ams_lite || f.ams_2_pro || f.ams_ht) ? 
            `<div style="display:flex;gap:6px;flex-wrap:wrap">
                ${f.ams_lite ? '<span style="background:#10B98122;color:#10B981;padding:3px 8px;border-radius:6px;font-size:0.7rem">AMS Lite</span>' : ''}
                ${f.ams ? '<span style="background:#10B98122;color:#10B981;padding:3px 8px;border-radius:6px;font-size:0.7rem">AMS</span>' : ''}
                ${f.ams_2_pro ? '<span style="background:#10B98122;color:#10B981;padding:3px 8px;border-radius:6px;font-size:0.7rem">AMS 2 Pro</span>' : ''}
                ${f.ams_ht ? '<span style="background:#10B98122;color:#10B981;padding:3px 8px;border-radius:6px;font-size:0.7rem">AMS HT</span>' : ''}
            </div>` : '<span style="color:var(--text-muted)">—</span>';

        const modal = document.createElement('div');
        modal.className = 'comp-modal';
        modal.innerHTML = `
            <div class="comp-modal__backdrop"></div>
            <div class="comp-modal__content comp-modal__content--detail">
                <div class="comp-modal__header">
                    <div>
                        ${getMaterialBadge(f.material)}
                        <h2 style="margin:8px 0 0;font-size:1.3rem">${f.brand} ${f.name}</h2>
                    </div>
                    <button class="comp-modal__close" id="comp-modal-close"><i data-lucide="x"></i></button>
                </div>
                
                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Colores disponibles' : 'Available colors'}</h3>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">${colors}</div>
                </div>

                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Temperaturas recomendadas' : 'Recommended temperatures'}</h3>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Nozzle' : 'Nozzle'}</span>
                            <span class="spec-value">${f.nozzle_temp_min}–${f.nozzle_temp_max}°C</span>
                        </div>
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Cama' : 'Bed'}</span>
                            <span class="spec-value">${f.bed_temp_min}–${f.bed_temp_max}°C</span>
                        </div>
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Ventilador' : 'Fan'}</span>
                            <span class="spec-value">${f.fan_speed_min || 0}–100%</span>
                        </div>
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Cámara' : 'Chamber'}</span>
                            <span class="spec-value">${f.chamber_temp || '—'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Características técnicas' : 'Technical specs'}</h3>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Densidad' : 'Density'}</span>
                            <span class="spec-value">${f.density} g/cm³</span>
                        </div>
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Temp. reblandecimiento' : 'Softening temp'}</span>
                            <span class="spec-value">${f.softening_temp}°C</span>
                        </div>
                        <div class="spec-box">
                            <span class="spec-label">MVS</span>
                            <span class="spec-value">${f.mvs || '—'} mm³/s</span>
                        </div>
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Ratio flujo' : 'Flow ratio'}</span>
                            <span class="spec-value">${f.flow_ratio || '—'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Secado' : 'Drying'}</h3>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Temperatura' : 'Temperature'}</span>
                            <span class="spec-value">${f.drying_temp || '—'}°C</span>
                        </div>
                        <div class="spec-box">
                            <span class="spec-label">${lang === 'es' ? 'Tiempo' : 'Time'}</span>
                            <span class="spec-value">${f.drying_time || '—'}h</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Compatibilidad AMS' : 'AMS compatibility'}</h3>
                    ${amsCompatible}
                </div>

                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Placas compatibles' : 'Build plates'}</h3>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">${buildPlates}</div>
                </div>

                ${f.special_properties && f.special_properties.length > 0 ? `
                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Propiedades especiales' : 'Special properties'}</h3>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        ${f.special_properties.map(p => `<span style="background:rgba(139,92,246,0.15);color:#A78BFA;padding:4px 10px;border-radius:8px;font-size:0.75rem">${p}</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="detail-section">
                    <h3>${lang === 'es' ? 'Dónde comprar' : 'Where to buy'}</h3>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        ${f.buy_url ? `<a href="${f.buy_url}" target="_blank" class="comp-btn-buy">
                            ${lang === 'es' ? 'Tienda oficial' : 'Official store'} <i data-lucide="external-link"></i>
                        </a>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();

        modal.querySelector('#comp-modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.comp-modal__backdrop').addEventListener('click', () => modal.remove());
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
                (f.colors && f.colors.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())));
            return matchMaterial && matchBrand && matchEnclosure && matchSearch;
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

            const colorPreview = f.colors ? f.colors.slice(0, 6).map(c => 
                `<span style="width:14px;height:14px;border-radius:50%;background:${c.hex};border:1px solid rgba(255,255,255,0.2);display:inline-block" title="${c.name}"></span>`
            ).join('') : '';

            const priceDisplay = f.price_eur 
                ? `<b style="color:var(--secondary)">~${f.price_eur}€</b>` 
                : '<b>—</b>';

            card.innerHTML = `
                <div class="comp-card__header">
                    <div class="comp-card__badge-row">
                        ${getMaterialBadge(f.material)}
                        <span class="comp-card__brand">${f.brand}</span>
                    </div>
                    <h3 class="comp-card__name" style="cursor:pointer" title="${lang === 'es' ? 'Ver detalles' : 'View details'}">${f.name}</h3>
                    <div style="margin-top:6px">${colorPreview}</div>
                </div>
                <div class="comp-card__quick-specs">
                    <div class="qs"><span>${lang === 'es' ? 'Nozzle' : 'Nozzle'}</span><b>${f.nozzle_temp_min}–${f.nozzle_temp_max}°C</b></div>
                    <div class="qs"><span>${lang === 'es' ? 'Bed' : 'Bed'}</span><b>${f.bed_temp_min}–${f.bed_temp_max}°C</b></div>
                    <div class="qs"><span>${lang === 'es' ? 'Enclosed' : 'Enclosed'}</span><b>${f.enclosure_needed ? '✓' : '✗'}</b></div>
                    <div class="qs"><span>${lang === 'es' ? 'Price' : 'Price'}</span>${priceDisplay}</div>
                </div>
                <div class="comp-card__actions">
                    <button class="comp-btn-select ${isSelected ? 'comp-btn-select--active' : ''}" data-id="${f.id}">
                        ${isSelected
                            ? `<i data-lucide="check-square"></i> ${lang === 'es' ? 'Seleccionado' : 'Selected'}`
                            : `<i data-lucide="square"></i> ${lang === 'es' ? 'Comparar' : 'Compare'}`}
                    </button>
                    <button class="comp-btn-detail" data-id="${f.id}" title="${lang === 'es' ? 'Ver detalles' : 'View details'}">
                        <i data-lucide="info"></i>
                    </button>
                    ${f.buy_url ? `<a href="${f.buy_url}" target="_blank" class="comp-btn-buy">
                        <i data-lucide="shopping-cart"></i> ${lang === 'es' ? 'Comprar' : 'Buy'}
                    </a>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();

        grid.querySelectorAll('.comp-card__name').forEach(el => {
            el.addEventListener('click', e => {
                const id = e.target.closest('.comp-card').dataset.id;
                const f = allFilaments.find(f => f.id === id);
                if (f) showDetailModal(f);
            });
        });

        grid.querySelectorAll('.comp-btn-detail').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = btn.dataset.id;
                const f = allFilaments.find(f => f.id === id);
                if (f) showDetailModal(f);
            });
        });

        grid.querySelectorAll('.comp-btn-select').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (selected.has(id)) {
                    selected.delete(id);
                } else {
                    if (selected.size >= 4) {
                        showToast(lang === 'es' ? 'Máximo 4 productos' : 'Max 4 products');
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

        const headerCols = filaments.map(f => {
            return `<th>
                <div style="text-align:center">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">${f.brand}</div>
                    <div style="margin-bottom:4px">${getMaterialBadge(f.material)}</div>
                    <div style="font-weight:700;font-size:0.9rem">${f.name}</div>
                    ${f.price_eur ? `<div style="color:var(--secondary);margin-top:4px">~${f.price_eur}€</div>` : ''}
                </div>
            </th>`;
        }).join('');

        const specRows = [
            { key: 'nozzle_temp', label: { en: 'Nozzle', es: 'Nozzle' }, format: f => `${f.nozzle_temp_min}–${f.nozzle_temp_max}°C` },
            { key: 'bed_temp', label: { en: 'Bed', es: 'Cama' }, format: f => `${f.bed_temp_min}–${f.bed_temp_max}°C` },
            { key: 'enclosure', label: { en: 'Enclosed', es: 'Cerrada' }, format: f => f.enclosure_needed ? '✓' : '✗' },
            { key: 'density', label: { en: 'Density', es: 'Densidad' }, format: f => `${f.density} g/cm³` },
            { key: 'mvs', label: { en: 'MVS', es: 'MVS' }, format: f => `${f.mvs || '—'} mm³/s` },
            { key: 'flow_ratio', label: { en: 'Flow ratio', es: 'Ratio flujo' }, format: f => f.flow_ratio || '—' },
            { key: 'drying', label: { en: 'Drying', es: 'Secado' }, format: f => `${f.drying_temp || '—'}°C / ${f.drying_time || '—'}h` },
        ].map(spec => {
            let cells = filaments.map(f => {
                return `<td>${spec.format(f)}</td>`;
            }).join('');
            return `<tr><td class="spec-label">${spec.label[lang]}</td>${cells}</tr>`;
        }).join('');

        const propsRow = filaments.map(f => {
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
            .comp-btn-select, .comp-btn-detail, .comp-btn-buy { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; font-size:0.75rem; font-weight:500; cursor:pointer; border:none; font-family:var(--font-family); text-decoration:none; transition:all 0.2s; }
            .comp-btn-select { background:rgba(139,92,246,0.2); color:#A78BFA; }
            .comp-btn-select:hover { background:rgba(139,92,246,0.3); }
            .comp-btn-select--active { background:#10B981; color:white; }
            .comp-btn-detail { background:rgba(99,102,241,0.2); color:#818CF8; }
            .comp-btn-detail:hover { background:rgba(99,102,241,0.3); }
            .comp-btn-buy { background:rgba(16,185,129,0.2); color:#10B981; }
            .comp-btn-buy:hover { background:rgba(16,185,129,0.3); }
            .comp-no-results { text-align:center; padding:60px 20px; color:var(--text-muted); }
            .comp-bar { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--bg-card); border:1px solid var(--secondary); border-radius:16px; padding:12px 20px; display:flex; align-items:center; gap:16px; box-shadow:0 4px 20px rgba(0,0,0,0.3); z-index:100; }
            .comp-bar button { padding:8px 16px; border-radius:8px; border:none; font-weight:500; cursor:pointer; font-family:var(--font-family); }
            #comp-bar-compare { background:var(--secondary); color:white; }
            #comp-bar-clear { background:rgba(255,255,255,0.1); color:var(--text-main); }
            .comp-modal { position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; }
            .comp-modal__backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); }
            .comp-modal__content { position:relative; background:var(--bg-dark); border:1px solid var(--glass-border); border-radius:16px; max-width:90vw; max-height:90vh; overflow:auto; }
            .comp-modal__content--detail { max-width:600px; }
            .comp-modal__header { display:flex; justify-content:space-between; align-items:start; padding:20px; border-bottom:1px solid var(--glass-border); }
            .comp-modal__header h2 { font-size:1.2rem; }
            .comp-modal__close { background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; }
            .comp-modal__table-wrap { padding:20px; overflow:auto; }
            .comp-table { width:100%; border-collapse:collapse; }
            .comp-table th { padding:12px 8px; vertical-align:bottom; }
            .comp-table td { padding:10px 8px; text-align:center; border-top:1px solid var(--glass-border); }
            .spec-label { text-align:left; color:var(--text-muted); font-size:0.8rem; width:140px; }
            .comp-toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#EF4444; color:white; padding:12px 20px; border-radius:8px; font-weight:500; z-index:1001; }
            
            .detail-section { padding:16px 20px; border-bottom:1px solid var(--glass-border); }
            .detail-section:last-child { border-bottom:none; }
            .detail-section h3 { font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px; }
            .spec-box { background:rgba(255,255,255,0.03); border-radius:8px; padding:10px; }
            .spec-box .spec-label { display:block; font-size:0.7rem; color:var(--text-muted); margin-bottom:2px; }
            .spec-box .spec-value { display:block; font-size:0.9rem; font-weight:600; }
            
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