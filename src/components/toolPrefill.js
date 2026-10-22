/**
 * toolPrefill.js — Pasa valores de una herramienta a otra.
 *
 * Ejemplo: el analizador de logs extrae el E-steps y los microsteps de la
 * configuración y abre la calculadora de E-steps con esos valores ya puestos.
 *
 * Sin dependencias. window.ToolPrefill
 */
(function (root) {
  'use strict';
  const PREFIX = '3dwork:prefill:';

  function set(tool, payload) {
    try {
      localStorage.setItem(PREFIX + tool, JSON.stringify(payload || {}));
    } catch (e) { /* modo privado o cuota llena */ }
  }

  function take(tool) {
    try {
      const key = PREFIX + tool;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      localStorage.removeItem(key);
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function apply(tool, map) {
    // map: { 'id-input': 'campo-del-payload' }
    // Devuelve el payload aplicado (o null) para que la herramienta decida
    // qué hacer según las claves que recibió.
    const p = take(tool);
    if (!p) return null;
    let touched = false;
    for (const id of Object.keys(map)) {
      const el = document.getElementById(id);
      if (el && p[map[id]] !== undefined && p[map[id]] !== null) {
        el.value = p[map[id]];
        touched = true;
      }
    }
    return touched ? p : null;
  }

  root.ToolPrefill = { set: set, take: take, apply: apply };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.ToolPrefill;
  }
})(typeof window !== 'undefined' ? window : globalThis);
