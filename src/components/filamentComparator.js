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

const mmuCompatible = (f.ams || f.ams_lite || f.ams_2_pro || f.ams_ht);
        const amsBg = (f.ams || f.ams_lite) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)';
        const amsColor = (f.ams || f.ams_lite) ? '#10B981' : 'var(--text-muted)';
        const amsBorder = (f.ams || f.ams_lite) ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)';
        const amsIcon = (f.ams || f.ams_lite) ? 'check-circle' : 'x-circle';
        const amsHtBg = f.ams_ht ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)';
        const amsHtColor = f.ams_ht ? '#10B981' : 'var(--text-muted)';
        const amsHtBorder = f.ams_ht ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)';
        const amsHtIcon = f.ams_ht ? 'check-circle' : 'x-circle';

        const mmuHtml = mmuCompatible ? 
            `<div style="display:flex;gap:12px;align-items:center">
                <span style="display:flex;align-items:center;gap:4px;padding:4px 10px;background:${amsBg};color:${amsColor};border-radius:6px;font-size:0.75rem;border:1px solid ${amsBorder}">
                    <i data-lucide="${amsIcon}" style="width:14px;height:14px"></i>
                    AMS
                </span>
                <span style="display:flex;align-items:center;gap:4px;padding:4px 10px;background:${amsHtBg};color:${amsHtColor};border-radius:6px;font-size:0.75rem;border:1px solid ${amsHtBorder}">
                    <i data-lucide="${amsHtIcon}" style="width:14px;height:14px"></i>
                    AMS HT
                </span>
            </div>` : 
            `<span style="color:var(--text-muted)">—</span>`;

        const modal = document.getElementById('comp-modal');
        const content = document.getElementById('comp-modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="comp-modal-header">
                <div>
                    ${getMaterialBadge(f.material)}
                    <h2 style="margin:8px 0 0;font-size:1.3rem">${f.brand} ${f.name}</h2>
                </div>
                <button class="comp-modal-close" id="comp-modal-close-detail"><i data-lucide="x"></i></button>
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
                <h3>${lang === 'es' ? 'Compatibilidad MMU' : 'MMU Compatibility'}</h3>
                ${mmuHtml}
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
                    ${f.aliexpress_url ? `<a href="${f.aliexpress_url}" target="_blank" class="comp-buy-btn" style="background:#FF681F;color:#FFF;border-color:#FF681F;font-weight:600">ALIEXPRESS</a>` : ''}
                    ${f.buy_url ? `<a href="${f.buy_url}" target="_blank" class="comp-buy-btn">${f.brand}</a>` : ''}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('comp-modal-close-detail').onclick = () => { modal.style.display = 'none'; };
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
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
            if (noResults) noResults.style.display = 'flex';
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
                    <h3 class="comp-card__name detail-trigger" style="cursor:pointer" title="${lang === 'es' ? 'Ver detalles' : 'View details'}">${f.name}</h3>
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
                    ${f.aliexpress_url ? `<a href="${f.aliexpress_url}" target="_blank" class="comp-btn-ali">ALIEXPRESS</a>` : ''}
                    ${f.buy_url ? `<a href="${f.buy_url}" target="_blank" class="comp-buy-btn-sm">${f.brand}</a>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();

        grid.querySelectorAll('.detail-trigger, .comp-btn-detail').forEach(el => {
            el.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id || e.target.closest('.comp-card').dataset.id;
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

        const modal = document.getElementById('comp-modal');
        const content = document.getElementById('comp-modal-content');
        if (!modal || !content) return;

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
            return `<tr><td class="comp-spec-label">${spec.label[lang]}</td>${cells}</tr>`;
        }).join('');

        const propsRow = filaments.map(f => {
            const props = f.special_properties ? f.special_properties.join(', ') : '—';
            return `<td style="font-size:0.75rem;padding:8px">${props}</td>`;
        }).join('');

        content.innerHTML = `
            <div class="comp-modal-header">
                <h2>${lang === 'es' ? 'Comparar filamentos' : 'Compare filaments'}</h2>
                <button class="comp-modal-close" id="comp-modal-close-compare"><i data-lucide="x"></i></button>
            </div>
            <div class="comp-table-wrap">
                <table class="comp-table">
                    <thead><tr><th></th>${headerCols}</tr></thead>
                    <tbody>${specRows}<tr><td class="comp-spec-label">${lang === 'es' ? 'Propiedades' : 'Properties'}</td>${propsRow}</tr></tbody>
                </table>
            </div>
        `;

        modal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('comp-modal-close-compare').onclick = () => { modal.style.display = 'none'; };
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
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
                <i data-lucide="search-x" style="width:40px;height:40px;margin-bottom:1rem"></i>
                <p>${window.currentLang === 'es' ? 'No se encontraron filamentos' : 'No filaments found'}</p>
            </div>
            <div id="comp-bar" class="comp-bar" style="display:none">
                <span id="comp-bar-count" class="comp-bar-text"></span>
                <button id="comp-bar-btn" class="comp-bar-btn">
                    <i data-lucide="columns-2"></i>
                    ${window.currentLang === 'es' ? 'Comparar' : 'Compare'}
                </button>
                <button id="comp-bar-clear" class="comp-bar-clear">
                    ${window.currentLang === 'es' ? 'Limpiar' : 'Clear'}
                </button>
            </div>
            <div id="comp-modal" class="comp-modal" style="display:none">
                <div id="comp-modal-content" class="comp-modal-inner"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .comp-hero { text-align:center; padding:40px 20px 40px; }
            .comp-hero h1 { font-size:2rem; font-weight:800; margin-bottom:8px; background:linear-gradient(135deg,#06B6D4,#10B981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
            .comp-hero p { color:var(--text-muted); max-width:600px; margin:0 auto; }
            .comp-filters { display:flex; flex-wrap:wrap; gap:16px; padding:20px; background:var(--bg-card); border-radius:16px; margin:0 20px 20px; border:1px solid var(--glass-border); }
            .comp-filter-group { display:flex; flex-direction:column; gap:6px; }
            .comp-filter-group label { font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
            .comp-filter-group select, .comp-filter-group input { background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:8px; padding:8px 12px; color:var(--text-main); font-family:var(--font-family); }
            .comp-filter-group--search { flex:1; min-width:200px; }
            .comp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1rem; padding:0 20px 120px; }
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
            .comp-btn-select, .comp-btn-detail { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; font-size:0.75rem; font-weight:500; cursor:pointer; border:none; font-family:var(--font-family); transition:all 0.2s; }
            .comp-btn-select { background:rgba(139,92,246,0.2); color:#A78BFA; }
            .comp-btn-select:hover { background:rgba(139,92,246,0.3); }
            .comp-btn-select--active { background:#10B981; color:white; }
            .comp-btn-detail { background:rgba(99,102,241,0.2); color:#818CF8; padding:6px; }
            .comp-btn-detail:hover { background:rgba(99,102,241,0.3); }
            .comp-btn-ali { background:#FF681F; color:#FFF; padding:6px 10px; border-radius:8px; font-size:0.7rem; font-weight:700; text-decoration:none; }
            .comp-btn-ali:hover { background:#FF8550; }
            .comp-buy-btn-sm { background:rgba(16,185,129,0.2); color:#10B981; padding:6px 10px; border-radius:8px; font-size:0.7rem; font-weight:600; text-decoration:none; }
            .comp-no-results { display:none; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; color:var(--text-muted); text-align:center; }
            
            .comp-bar { position:fixed; bottom:0; left:0; right:0; background:rgba(15,23,42,0.95); backdrop-filter:blur(12px); border-top:1px solid rgba(139,92,246,0.4); padding:1rem 2rem; display:none; align-items:center; justify-content:center; gap:1rem; z-index:500; }
            .comp-bar-text { font-size:0.875rem; color:var(--text-muted); }
            .comp-bar-btn { background:var(--primary); border:none; color:#fff; padding:10px 24px; border-radius:8px; font-size:0.9rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:8px; font-family:var(--font-family); transition:background 0.15s; }
            .comp-bar-btn:hover { background:var(--primary-dark); }
            .comp-bar-clear { background:transparent; border:1px solid var(--glass-border); color:var(--text-muted); padding:9px 16px; border-radius:8px; font-size:0.85rem; cursor:pointer; font-family:var(--font-family); }
            
            .comp-modal { position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:1000; display:none; align-items:center; justify-content:center; padding:1rem; }
            .comp-modal-inner { background:#0F172A; border:1px solid rgba(139,92,246,0.3); border-radius:16px; max-width:900px; width:100%; max-height:90vh; overflow-y:auto; padding:1.5rem; }
            .comp-modal-header { display:flex; justify-content:space-between; align-items:start; margin-bottom:1.5rem; }
            .comp-modal-header h2 { font-size:1.4rem; font-weight:800; }
            .comp-modal-close { background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:var(--text-main); width:36px; height:36px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
            .comp-table-wrap { overflow-x:auto; }
            .comp-table { width:100%; border-collapse:collapse; font-size:0.875rem; }
            .comp-table th, .comp-table td { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.06); text-align:center; }
            .comp-table th { text-align:left; }
            .comp-spec-label { text-align:left; color:var(--text-muted); font-size:0.8rem; white-space:nowrap; }
            .comp-buy-btn { background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:var(--secondary); padding:8px 16px; border-radius:8px; font-size:0.85rem; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
            .comp-toast { position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#EF4444; color:white; padding:12px 20px; border-radius:8px; font-weight:500; z-index:1001; }
            
            .detail-section { padding:16px 0; border-bottom:1px solid var(--glass-border); }
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
        document.getElementById('comp-bar-btn').addEventListener('click', showCompareModal);
        document.getElementById('comp-bar-clear').addEventListener('click', () => { selected.clear(); updateCompareBar(); renderGrid(); });

        fetch(FILAMENTS_URL + '?v=' + Date.now())
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