// =====================================================
// Shared UI Components (pure React components)
// =====================================================
// These must be loaded before the tool components

// ----- ControlSlider -----
window.ControlSlider = function ControlSlider({ label, value, min, max, step, onChange, unit, accent }) {
    const isBlue = accent === 'var(--blue)';
    const pct = ((value - min) / (max - min)) * 100;
    const fillStyle = {
        background: `linear-gradient(to right, ${accent || 'var(--accent)'} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`
    };
    return (
        <div className="control-group">
            <div className="control-label">
                <span>{label}</span>
                <span className="control-value" style={isBlue ? { color: '#93C5FD', background: 'rgba(59,130,246,0.1)' } : {}}>
                    {unit ? `${value}${unit}` : Math.round(value * 100) + '%'}
                </span>
            </div>
            <div className="slider-wrap">
                <input
                    type="range"
                    min={min} max={max} step={step || 0.01}
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className={isBlue ? 'blue' : ''}
                    style={fillStyle}
                />
            </div>
        </div>
    );
};

// ----- ToggleSwitch -----
window.ToggleSwitch = function ToggleSwitch({ label, checked, onChange, accent }) {
    const id = React.useId ? React.useId() : 'toggle_' + Math.random();
    return (
        <div className="toggle-row">
            <span className="toggle-label">{label}</span>
            <label className={`toggle${accent === 'blue' ? ' blue' : ''}`} htmlFor={id}>
                <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} />
                <span className="toggle-slider"></span>
            </label>
        </div>
    );
};
