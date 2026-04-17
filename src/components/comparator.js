window.renderComparator = function (container, t, opts) {
    const PRINTERS_URL = (opts && opts.dataUrl) || './src/assets/printers.json';
    let allPrinters = [];
    let selected = new Set();
    let activeType = 'all';
    let activeBrand = 'all';
    let searchTerm = '';

    const SPEC_DEFS = {
        FDM: [
            { key: 'build_volume', label: { en: 'Build Volume', es: 'Volumen impresión' }, format: p => `${p.specs.build_x}×${p.specs.build_y}×${p.specs.build_z} mm`, best: null },
            { key: 'speed_max', label: { en: 'Max Speed', es: 'Velocidad máx.' }, format: p => p.specs.speed_max ? `${p.specs.speed_max} mm/s` : '—', best: 'max' },
            { key: 'nozzle_temp_max', label: { en: 'Nozzle Temp', es: 'Temp. nozzle' }, format: p => p.specs.nozzle_temp_max ? `${p.specs.nozzle_temp_max}°C` : '—', best: 'max' },
            { key: 'bed_temp_max', label: { en: 'Bed Temp', es: 'Temp. cama' }, format: p => p.specs.bed_temp_max ? `${p.specs.bed_temp_max}°C` : '—', best: 'max' },
            { key: 'layer_min', label: { en: 'Min Layer Height', es: 'Capa mínima' }, format: p => p.specs.layer_min ? `${p.specs.layer_min} mm` : '—', best: 'min' },
            { key: 'extruder', label: { en: 'Extruder', es: 'Extrusor' }, format: p => p.specs.extruder || '—', best: null },
            { key: 'auto_leveling', label: { en: 'Auto Leveling', es: 'Nivelación auto' }, format: p => p.specs.auto_leveling != null ? (p.specs.auto_leveling ? '✓' : '✗') : '—', best: null },
            { key: 'multi_material', label: { en: 'Multi-Material', es: 'Multifilamento' }, format: p => p.specs.multi_material != null ? (p.specs.multi_material ? '✓' : '✗') : '—', best: null },
            { key: 'enclosed', label: { en: 'Enclosed', es: 'Cerrada' }, format: p => p.specs.enclosed != null ? (p.specs.enclosed ? '✓' : '✗') : '—', best: null },
            { key: 'firmware', label: { en: 'Firmware', es: 'Firmware' }, format: p => p.specs.firmware || '—', best: null },
            { key: 'price_eur', label: { en: 'Approx. Price', es: 'Precio aprox.' }, format: p => p.specs.price_eur ? `~${p.specs.price_eur}€` : '—', best: 'min' },
        ],
        Resina: [
            { key: 'build_volume', label: { en: 'Build Volume', es: 'Volumen impresión' }, format: p => `${p.specs.build_x}×${p.specs.build_y}×${p.specs.build_z} mm`, best: null },
            { key: 'xy_resolution_mm', label: { en: 'XY Resolution', es: 'Resolución XY' }, format: p => p.specs.xy_resolution_mm ? `${p.specs.xy_resolution_mm} mm (${p.specs.resolution_label||''})` : '—', best: 'min' },
            { key: 'layer_min', label: { en: 'Min Layer', es: 'Capa mínima' }, format: p => p.specs.layer_min ? `${p.specs.layer_min} mm` : '—', best: 'min' },
            { key: 'light_source', label: { en: 'Light Source', es: 'Fuente luz' }, format: p => p.specs.light_source || '—', best: null },
            { key: 'wavelength_nm', label: { en: 'Wavelength', es: 'Longitud onda' }, format: p => p.specs.wavelength_nm ? `${p.specs.wavelength_nm} nm` : '—', best: null },
            { key: 'lift_speed', label: { en: 'Lift Speed', es: 'Vel. elevación' }, format: p => p.specs.lift_speed ? `${p.specs.lift_speed} mm/s` : '—', best: 'max' },
            { key: 'price_eur', label: { en: 'Approx. Price', es: 'Precio aprox.' }, format: p => p.specs.price_eur ? `~${p.specs.price_eur}€` : '—', best: 'min' },
        ],
        Escaner: [
            { key: 'accuracy_mm', label: { en: 'Accuracy', es: 'Precisión' }, format: p => p.specs.accuracy_mm ? `${p.specs.accuracy_mm} mm` : '—', best: 'min' },
            { key: 'resolution_mm', label: { en: 'Resolution', es: 'Resolución' }, format: p => p.specs.resolution_mm ? `${p.specs.resolution_mm} mm` : '—', best: 'min' },
            { key: 'scan_mode', label: { en: 'Scan Mode', es: 'Modo escaneo' }, format: p => p.specs.scan_mode || '—', best: null },
            { key: 'scan_area', label: { en: 'Scan Area', es: 'Área escaneo' }, format: p => p.specs.scan_area || '—', best: null },
            { key: 'color_scan', label: { en: 'Color Scan', es: 'Escaneo color' }, format: p => p.specs.color_scan != null ? (p.specs.color_scan ? '✓' : '✗') : '—', best: null },
            { key: 'output_format', label: { en: 'Output Formats', es: 'Formatos salida' }, format: p => p.specs.output_format || '—', best: null },
            { key: 'price_eur', label: { en: 'Approx. Price', es: 'Precio aprox.' }, format: p => p.specs.price_eur ? `~${p.specs.price_eur}€` : '—', best: 'min' },
        ],
        Laser: [
            { key: 'work_area', label: { en: 'Work Area', es: 'Área trabajo' }, format: p => p.specs.work_area || '—', best: null },
            { key: 'laser_power', label: { en: 'Laser Power', es: 'Potencia láser' }, format: p => p.specs.laser_power || '—', best: null },
            { key: 'speed_max', label: { en: 'Max Speed', es: 'Vel. máx.' }, format: p => p.specs.speed_max ? `${p.specs.speed_max} mm/min` : '—', best: 'max' },
            { key: 'price_eur', label: { en: 'Approx. Price', es: 'Precio aprox.' }, format: p => p.specs.price_eur ? `~${p.specs.price_eur}€` : '—', best: 'min' },
        ],
        Electronica: [
            { key: 'subtype', label: { en: 'Type', es: 'Tipo' }, format: p => p.specs.subtype || '—', best: null },
            { key: 'processor', label: { en: 'Processor/CPU', es: 'Procesador/CPU' }, format: p => p.specs.processor || '—', best: null },
            { key: 'firmware_compatibility', label: { en: 'Firmware', es: 'Firmware' }, format: p => p.specs.firmware_compatibility || '—', best: null },
            { key: 'connectivity', label: { en: 'Connectivity', es: 'Conectividad' }, format: p => p.specs.connectivity || '—', best: null },
            { key: 'input_voltage', label: { en: 'Input Voltage', es: 'Voltaje entrada' }, format: p => p.specs.input_voltage || '—', best: null },
            { key: 'price_eur', label: { en: 'Approx. Price', es: 'Precio aprox.' }, format: p => p.specs.price_eur ? `~${p.specs.price_eur}€` : '—', best: 'min' },
        ]
    };

    function getTypeBadge(type) {
        const colors = { FDM: '#8B5CF6', Resina: '#06B6D4', Escaner: '#10B981', Laser: '#F59E0B', Electronica: '#EC4899' };
        const color = colors[type] || '#94A3B8';
        return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;letter-spacing:0.05em;">${type}</span>`;
    }

    function getScoreColor(score) {
        if (!score) return '#94A3B8';
        if (score >= 9) return '#10B981';
        if (score >= 8) return '#8B5CF6';
        if (score >= 7) return '#F59E0B';
        return '#EF4444';
    }

    function getStars(score) {
        if (!score) return '';
        const full = Math.floor(score / 2);
        const half = (score % 2) >= 1 ? 1 : 0;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
    }

    function filtered() {
        return allPrinters.filter(p => {
            const matchType = activeType === 'all' || p.type === activeType;
            const matchBrand = activeBrand === 'all' || p.brand === activeBrand;
            const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm);
            return matchType && matchBrand && matchSearch;
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

        list.forEach(p => {
            const isSelected = selected.has(p.id);
            const scoreColor = getScoreColor(p.score);
            const scoreHtml = p.score
                ? `<div class="comp-card__score" style="color:${scoreColor}">
                      <span class="comp-card__score-num">${p.score}</span>
                      <span class="comp-card__score-stars">${getStars(p.score)}</span>
                   </div>`
                : '';

            const card = document.createElement('div');
            card.className = 'comp-card' + (isSelected ? ' comp-card--selected' : '');
            card.dataset.id = p.id;
            card.innerHTML = `
                <div class="comp-card__header">
                    <div class="comp-card__img-wrap">
                        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <div class="comp-card__img-placeholder" style="display:none"><i data-lucide="printer"></i></div>
                    </div>
                    <div class="comp-card__badge-row">
                        ${getTypeBadge(p.type)}
                        <span class="comp-card__brand">${p.brand}</span>
                    </div>
                    <h3 class="comp-card__name">${p.name}</h3>
                    ${scoreHtml}
                </div>
                <div class="comp-card__quick-specs">
                    ${getQuickSpecs(p, lang)}
                </div>
                <div class="comp-card__actions">
                    <button class="comp-btn-select ${isSelected ? 'comp-btn-select--active' : ''}" data-id="${p.id}">
                        ${isSelected
                            ? `<i data-lucide="check-square"></i> ${lang === 'es' ? 'Seleccionado' : 'Selected'}`
                            : `<i data-lucide="square"></i> ${lang === 'es' ? 'Comparar' : 'Compare'}`}
                    </button>
                    ${p.reviewUrl ? `<a href="${p.reviewUrl}" target="_blank" class="comp-btn-review">
                        ${lang === 'es' ? 'Review' : 'Review'} <i data-lucide="external-link"></i>
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

    function getQuickSpecs(p, lang) {
        if (p.type === 'FDM') {
            const vol = (p.specs.build_x && p.specs.build_y && p.specs.build_z)
                ? `${p.specs.build_x}×${p.specs.build_y}×${p.specs.build_z}mm` : '—';
            return `
                <div class="qs"><span>${lang === 'es' ? 'Volumen' : 'Volume'}</span><b>${vol}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Vel. máx.' : 'Max speed'}</span><b>${p.specs.speed_max ? p.specs.speed_max + ' mm/s' : '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Extrusor' : 'Extruder'}</span><b>${p.specs.extruder || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Precio' : 'Price'}</span><b>${p.specs.price_eur ? '~' + p.specs.price_eur + '€' : '—'}</b></div>
            `;
        } else if (p.type === 'Resina') {
            const vol = (p.specs.build_x && p.specs.build_y && p.specs.build_z)
                ? `${p.specs.build_x}×${p.specs.build_y}×${p.specs.build_z}mm` : '—';
            return `
                <div class="qs"><span>${lang === 'es' ? 'Volumen' : 'Volume'}</span><b>${vol}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Resolución XY' : 'XY Res.'}</span><b>${p.specs.resolution_label || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Fuente luz' : 'Light'}</span><b>${p.specs.light_source || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Precio' : 'Price'}</span><b>${p.specs.price_eur ? '~' + p.specs.price_eur + '€' : '—'}</b></div>
            `;
        } else if (p.type === 'Escaner') {
            return `
                <div class="qs"><span>${lang === 'es' ? 'Precisión' : 'Accuracy'}</span><b>${p.specs.accuracy_mm ? p.specs.accuracy_mm + ' mm' : '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Modo' : 'Mode'}</span><b>${p.specs.scan_mode || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Color' : 'Color'}</span><b>${p.specs.color_scan != null ? (p.specs.color_scan ? '✓' : '✗') : '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Precio' : 'Price'}</span><b>${p.specs.price_eur ? '~' + p.specs.price_eur + '€' : '—'}</b></div>
            `;
        } else if (p.type === 'Laser') {
            return `
                <div class="qs"><span>${lang === 'es' ? 'Área' : 'Area'}</span><b>${p.specs.work_area || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Potencia' : 'Power'}</span><b>${p.specs.laser_power || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Precio' : 'Price'}</span><b>${p.specs.price_eur ? '~' + p.specs.price_eur + '€' : '—'}</b></div>
                <div class="qs"><span></span><b></b></div>
            `;
        } else if (p.type === 'Electronica') {
            return `
                <div class="qs"><span>${lang === 'es' ? 'Tipo' : 'Type'}</span><b>${p.specs.subtype || '—'}</b></div>
                <div class="qs"><span>Firmware</span><b>${p.specs.firmware_compatibility || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Conectividad' : 'Connectivity'}</span><b>${p.specs.connectivity || '—'}</b></div>
                <div class="qs"><span>${lang === 'es' ? 'Precio' : 'Price'}</span><b>${p.specs.price_eur ? '~' + p.specs.price_eur + '€' : '—'}</b></div>
            `;
        }
        return '';
    }

    function updateCompareBar() {
        const bar = document.getElementById('comp-bar');
        const count = document.getElementById('comp-bar-count');
        if (!bar) return;
        if (selected.size >= 2) {
            bar.style.display = 'flex';
            const lang = window.currentLang || 'es';
            if (count) count.textContent = lang === 'es'
                ? `${selected.size} ${selected.size === 1 ? 'producto seleccionado' : 'productos seleccionados'}`
                : `${selected.size} product${selected.size > 1 ? 's' : ''} selected`;
        } else {
            bar.style.display = 'none';
        }
    }

    function showCompareModal() {
        const lang = window.currentLang || 'es';
        const ps = allPrinters.filter(p => selected.has(p.id));
        if (ps.length < 2) return;

        const types = [...new Set(ps.map(p => p.type))];
        const defs = SPEC_DEFS[types[0]] || SPEC_DEFS.FDM;

        let headerCols = ps.map(p => {
            const scoreColor = getScoreColor(p.score);
            const scoreHtml = p.score
                ? `<div style="font-size:1.5rem;font-weight:800;color:${scoreColor}">${p.score}</div>
                   <div style="font-size:0.8rem;color:${scoreColor}">${getStars(p.score)}</div>`
                : '';
            return `<th>
                <div style="text-align:center">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">${p.brand}</div>
                    <div style="font-weight:700;margin-bottom:6px">${p.name}</div>
                    ${scoreHtml}
                    ${p.buyUrl ? `<a href="${p.buyUrl}" target="_blank" class="comp-buy-btn" style="margin-top:8px;display:inline-flex">
                        <i data-lucide="shopping-cart"></i> ${lang === 'es' ? 'Comprar' : 'Buy'}
                    </a>` : ''}
                    ${p.reviewUrl ? `<a href="${p.reviewUrl}" target="_blank" class="comp-review-btn-sm" style="margin-top:4px;display:inline-flex">
                        <i data-lucide="file-text"></i> ${lang === 'es' ? 'Review' : 'Review'}
                    </a>` : ''}
                </div>
            </th>`;
        }).join('');

        let rows = defs.map(def => {
            const vals = ps.map(p => { try { return def.format(p); } catch(e) { return '—'; }});
            const rawVals = ps.map(p => { try {
                if (def.key === 'price_eur') return p.specs.price_eur;
                if (def.key === 'speed_max') return p.specs.speed_max;
                if (def.key === 'nozzle_temp_max') return p.specs.nozzle_temp_max;
                if (def.key === 'bed_temp_max') return p.specs.bed_temp_max;
                if (def.key === 'layer_min') return p.specs.layer_min;
                if (def.key === 'xy_resolution_mm') return p.specs.xy_resolution_mm;
                if (def.key === 'accuracy_mm') return p.specs.accuracy_mm;
                if (def.key === 'lift_speed') return p.specs.lift_speed;
                return null;
            } catch(e){ return null; }});

            let bestIdx = -1;
            const numericVals = rawVals.filter(v => v !== null && v !== undefined);
            if (def.best === 'max' && numericVals.length > 0) bestIdx = rawVals.indexOf(Math.max(...numericVals));
            if (def.best === 'min' && numericVals.length > 0) bestIdx = rawVals.indexOf(Math.min(...numericVals));

            const cells = vals.map((v, i) => {
                const isBest = bestIdx === i && def.best !== null && v !== '—';
                return `<td class="${isBest ? 'comp-best' : ''}">${v}</td>`;
            }).join('');

            return `<tr><td class="comp-spec-label">${def.label[lang] || def.label.en}</td>${cells}</tr>`;
        }).join('');

        const modal = document.getElementById('comp-modal');
        const modalContent = document.getElementById('comp-modal-content');
        if (!modal || !modalContent) return;

        modalContent.innerHTML = `
            <div class="comp-modal-header">
                <h2>${lang === 'es' ? 'Comparativa' : 'Comparison'}</h2>
                <button id="comp-modal-close" class="comp-modal-close"><i data-lucide="x"></i></button>
            </div>
            <div class="comp-table-wrap">
                <table class="comp-table">
                    <thead><tr><th>${lang === 'es' ? 'Especificación' : 'Spec'}</th>${headerCols}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:1rem;text-align:center">
                ${lang === 'es'
                    ? '🟢 Mejor valor resaltado · Precios aproximados · Consultar reviews completas para datos definitivos'
                    : '🟢 Best value highlighted · Approximate prices · Check full reviews for definitive data'}
            </p>
        `;
        modal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('comp-modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1E293B;border:1px solid rgba(255,255,255,0.1);color:#F8FAFC;padding:10px 20px;border-radius:8px;z-index:9999;font-size:0.875rem;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }

    function buildFilters(lang) {
        const types = ['all', ...new Set(allPrinters.map(p => p.type))];
        const brands = ['all', ...new Set(allPrinters.map(p => p.brand))];
        const typeLabels = { all: lang === 'es' ? 'Todos' : 'All', FDM: 'FDM', Resina: lang === 'es' ? 'Resina' : 'Resin', Escaner: lang === 'es' ? 'Escáner' : 'Scanner', Laser: 'Laser', Electronica: lang === 'es' ? 'Electrónica' : 'Electronics' };

        return `
            <div class="comp-filter-row">
                <div class="comp-filter-group">
                    <span class="comp-filter-label">${lang === 'es' ? 'Tecnología' : 'Technology'}</span>
                    <div class="comp-filter-pills" id="filter-type">
                        ${types.map(ty => `<button class="comp-pill ${activeType === ty ? 'active' : ''}" data-type="${ty}">${typeLabels[ty] || ty}</button>`).join('')}
                    </div>
                </div>
                <div class="comp-filter-group">
                    <span class="comp-filter-label">${lang === 'es' ? 'Marca' : 'Brand'}</span>
                    <div class="comp-filter-pills" id="filter-brand">
                        ${brands.map(b => `<button class="comp-pill ${activeBrand === b ? 'active' : ''}" data-brand="${b}">${b === 'all' ? (lang === 'es' ? 'Todas' : 'All') : b}</button>`).join('')}
                    </div>
                </div>
                <div class="comp-filter-group comp-search-group">
                    <div class="comp-search-wrap">
                        <i data-lucide="search"></i>
                        <input type="text" id="comp-search" placeholder="${lang === 'es' ? 'Buscar modelo...' : 'Search model...'}" value="${searchTerm}">
                    </div>
                </div>
            </div>
        `;
    }

    function render() {
        const lang = window.currentLang || 'es';
        container.innerHTML = `
            <style>
                .comp-wrap { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
                .comp-filter-row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem 1.25rem; }
                .comp-filter-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .comp-search-group { flex: 1; min-width: 200px; justify-content: flex-end; }
                .comp-filter-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .comp-filter-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
                .comp-pill { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-muted); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
                .comp-pill:hover { border-color: var(--primary-light); color: var(--primary-light); }
                .comp-pill.active { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }
                .comp-search-wrap { position: relative; display: flex; align-items: center; }
                .comp-search-wrap svg { position: absolute; left: 10px; width: 16px; height: 16px; color: var(--text-muted); }
                .comp-search-wrap input { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-main); padding: 6px 12px 6px 32px; border-radius: 8px; font-size: 0.875rem; width: 100%; outline: none; font-family: var(--font-family); }
                .comp-search-wrap input:focus { border-color: var(--primary); }
                .comp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
                .comp-card { background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.2s, transform 0.15s; }
                .comp-card:hover { border-color: rgba(139,92,246,0.4); transform: translateY(-2px); }
                .comp-card--selected { border-color: var(--primary) !important; box-shadow: 0 0 0 2px rgba(139,92,246,0.3); }
                .comp-card__header { padding: 1rem 1rem 0.5rem; }
                .comp-card__img-wrap { height: 140px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; background: rgba(255,255,255,0.03); margin-bottom: 0.75rem; }
                .comp-card__img-wrap img { max-height: 130px; max-width: 100%; object-fit: contain; }
                .comp-card__img-placeholder { width: 100%; height: 100%; align-items: center; justify-content: center; color: var(--text-muted); }
                .comp-card__badge-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
                .comp-card__brand { font-size: 0.75rem; color: var(--text-muted); }
                .comp-card__name { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; line-height: 1.3; }
                .comp-card__score { display: flex; align-items: baseline; gap: 0.4rem; margin-bottom: 0.25rem; }
                .comp-card__score-num { font-size: 1.6rem; font-weight: 800; }
                .comp-card__score-stars { font-size: 0.75rem; letter-spacing: 2px; }
                .comp-card__quick-specs { padding: 0.75rem 1rem; border-top: 1px solid var(--glass-border); display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; flex: 1; }
                .qs { display: flex; flex-direction: column; }
                .qs span { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
                .qs b { font-size: 0.8rem; font-weight: 600; }
                .comp-card__actions { padding: 0.75rem 1rem; display: flex; gap: 0.5rem; }
                .comp-btn-select { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); color: var(--primary-light); transition: all 0.15s; font-family: var(--font-family); }
                .comp-btn-select:hover { background: rgba(139,92,246,0.2); }
                .comp-btn-select--active { background: var(--primary); border-color: var(--primary); color: #fff; }
                .comp-btn-review { display: flex; align-items: center; gap: 4px; padding: 7px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: var(--secondary); text-decoration: none; transition: all 0.15s; }
                .comp-btn-review:hover { background: rgba(16,185,129,0.2); }
                .comp-no-results { text-align: center; padding: 3rem; color: var(--text-muted); display: none; }
                .comp-bar { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(15,23,42,0.95); backdrop-filter: blur(12px); border-top: 1px solid rgba(139,92,246,0.4); padding: 1rem 2rem; display: none; align-items: center; justify-content: center; gap: 1rem; z-index: 500; }
                .comp-bar-text { font-size: 0.875rem; color: var(--text-muted); }
                .comp-bar-btn { background: var(--primary); border: none; color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: var(--font-family); transition: background 0.15s; }
                .comp-bar-btn:hover { background: var(--primary-dark); }
                .comp-bar-clear { background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); padding: 9px 16px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-family: var(--font-family); }
                .comp-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 1rem; }
                .comp-modal-inner { background: #0F172A; border: 1px solid rgba(139,92,246,0.3); border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 1.5rem; }
                .comp-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .comp-modal-header h2 { font-size: 1.4rem; font-weight: 800; }
                .comp-modal-close { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-main); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .comp-table-wrap { overflow-x: auto; }
                .comp-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .comp-table th, .comp-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left; }
                .comp-table thead th { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
                .comp-table thead tr th:first-child { width: 160px; }
                .comp-spec-label { color: var(--text-muted); font-size: 0.8rem; white-space: nowrap; }
                .comp-best { color: #10B981; font-weight: 700; }
                .comp-buy-btn { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: var(--secondary); padding: 5px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
                .comp-review-btn-sm { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); color: var(--primary-light); padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
                @media (max-width: 600px) {
                    .comp-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
                    .comp-card__img-wrap { height: 100px; }
                    .comp-filter-row { flex-direction: column; }
                }
            </style>

            <div class="comp-wrap">
                <div id="comp-filters">${buildFilters(lang)}</div>
                <div id="comp-grid" class="comp-grid"></div>
                <div id="comp-no-results" class="comp-no-results">
                    <i data-lucide="search-x" style="width:40px;height:40px;margin-bottom:1rem"></i>
                    <p>${lang === 'es' ? 'No se encontraron resultados' : 'No results found'}</p>
                </div>
            </div>

            <div id="comp-bar" class="comp-bar">
                <span id="comp-bar-count" class="comp-bar-text"></span>
                <button id="comp-bar-btn" class="comp-bar-btn">
                    <i data-lucide="columns-2"></i>
                    ${lang === 'es' ? 'Comparar' : 'Compare'}
                </button>
                <button id="comp-bar-clear" class="comp-bar-clear">
                    ${lang === 'es' ? 'Limpiar' : 'Clear'}
                </button>
            </div>

            <div id="comp-modal" class="comp-modal">
                <div id="comp-modal-content" class="comp-modal-inner"></div>
            </div>
        `;

        document.querySelectorAll('#filter-type .comp-pill').forEach(btn => {
            btn.addEventListener('click', () => { activeType = btn.dataset.type; refreshFilters(); renderGrid(); });
        });
        document.querySelectorAll('#filter-brand .comp-pill').forEach(btn => {
            btn.addEventListener('click', () => { activeBrand = btn.dataset.brand; refreshFilters(); renderGrid(); });
        });
        const searchInput = document.getElementById('comp-search');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                searchTerm = e.target.value.toLowerCase().trim();
                renderGrid();
            });
        }

        const barBtn = document.getElementById('comp-bar-btn');
        if (barBtn) barBtn.addEventListener('click', showCompareModal);

        const clearBtn = document.getElementById('comp-bar-clear');
        if (clearBtn) clearBtn.addEventListener('click', () => {
            selected.clear();
            updateCompareBar();
            renderGrid();
        });

        if (window.lucide) window.lucide.createIcons();
        renderGrid();
        updateCompareBar();
    }

    function refreshFilters() {
        const lang = window.currentLang || 'es';
        const filtersEl = document.getElementById('comp-filters');
        if (filtersEl) {
            filtersEl.innerHTML = buildFilters(lang);
            document.querySelectorAll('#filter-type .comp-pill').forEach(btn => {
                btn.addEventListener('click', () => { activeType = btn.dataset.type; refreshFilters(); renderGrid(); });
            });
            document.querySelectorAll('#filter-brand .comp-pill').forEach(btn => {
                btn.addEventListener('click', () => { activeBrand = btn.dataset.brand; refreshFilters(); renderGrid(); });
            });
            const si = document.getElementById('comp-search');
            if (si) si.addEventListener('input', e => { searchTerm = e.target.value.toLowerCase().trim(); renderGrid(); });
            if (window.lucide) window.lucide.createIcons();
        }
    }

    fetch(PRINTERS_URL + '?v=' + Date.now())
        .then(r => r.json())
        .then(data => {
            allPrinters = data;
            render();
        })
        .catch(() => {
            container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted)">Error loading comparator data.</div>`;
        });
};
