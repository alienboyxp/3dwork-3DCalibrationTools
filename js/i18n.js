// =====================================================
// i18n.js – Centralized translations (ES / EN)
// Uses i18next loaded from CDN
// =====================================================

const translations = {
    en: {
        translation: {
            // ---- Navigation ----
            nav_home: '3Dwork.io',
            nav_litho: 'Lithophane Generator',
            nav_hueforge: 'HueForge (Filament Painting)',
            nav_back: '← Back to Tools',
            lang_en: '🇬🇧 EN',
            lang_es: '🇪🇸 ES',

            // ---- Home page ----
            home_title: 'Advanced 3D Printing Tools',
            home_subtitle: 'Professional tools for lithophane generation and filament painting — 100% client-side.',
            litho_title: 'Lithophane Generator',
            litho_desc: 'Transform any photo into a 3D-printable lithophane with real-time 3D preview, adjustable thickness & geometry, and direct STL export.',
            litho_f1: 'Real-time 3D heightmap preview',
            litho_f2: 'Brightness, Contrast & Invert controls',
            litho_f3: 'Flat, Cylindrical & Curved geometry',
            litho_f4: 'Light source simulation',
            litho_f5: 'Watertight binary STL export',
            litho_cta: 'Open Lithophane Tool',
            hueforge_title: 'HueForge Simulator',
            hueforge_desc: 'Simulate multi-color filament painting with per-layer TD-based blending. Generate filament change heights (M600) for your slicer.',
            hueforge_f1: 'Layer & Filament Manager',
            hueforge_f2: 'TD-based color blending shader',
            hueforge_f3: 'Brand filament library (50+ filaments)',
            hueforge_f4: 'Automatic M600 change heights',
            hueforge_f5: 'Export HueForge guide + STL',
            hueforge_cta: 'Open HueForge Tool',

            // ---- Lithophane Tool ----
            litho_panel_title: 'LITHOPHANE',
            litho_preview: '3D PREVIEW',
            litho_upload: 'Click or drop image',
            litho_brightness: 'Brightness',
            litho_contrast: 'Contrast',
            litho_invert: 'Invert',
            litho_light: 'Light Source',
            litho_thickness_section: 'Thickness',
            litho_base: 'Base',
            litho_max: 'Max',
            litho_resolution: 'Resolution',
            litho_res_low: 'Low',
            litho_res_high: 'High',
            litho_geometry: 'Geometry',
            litho_flat: 'Flat',
            litho_cylindrical: 'Cylindrical',
            litho_curved: 'Curved',
            litho_download: 'Download STL',
            litho_hint: 'Drag to rotate • Scroll to zoom',
            litho_info_thick: 'Thickness',
            litho_info_base: 'Base',
            litho_info_max: 'Max',
            litho_info_res: 'Res',
            litho_no_image: 'Upload an image to start',
            litho_processing: 'Generating mesh…',

            // ---- HueForge Tool ----
            hueforge_panel_left: 'LAYER & FILAMENT MANAGER',
            hueforge_panel_right: 'PRESET FILAMENTS',
            hueforge_search: 'Search filaments…',
            hueforge_add_layer: 'Add layer',
            hueforge_layer_start: 'Start',
            hueforge_color_changes: 'Color Change Heights (M600)',
            hueforge_generate: 'Generate HueForge STL & Guide',
            hueforge_advanced: 'Advanced Shader',
            hueforge_td_label: 'TD',
            hueforge_layers_empty: 'Add filaments from the right panel →',
            hueforge_upload: 'Click or drop image',

            // ---- Common ----
            brand_all: 'All',
        }
    },
    es: {
        translation: {
            // ---- Navegación ----
            nav_home: '3Dwork.io',
            nav_litho: 'Generador de Litofanías',
            nav_hueforge: 'HueForge (Pintura de Filamento)',
            nav_back: '← Volver a Herramientas',
            lang_en: '🇬🇧 EN',
            lang_es: '🇪🇸 ES',

            // ---- Inicio ----
            home_title: 'Herramientas Avanzadas de Impresión 3D',
            home_subtitle: 'Herramientas profesionales para litofanías y pintura de filamento — 100% en el cliente.',
            litho_title: 'Generador de Litofanías',
            litho_desc: 'Transforma cualquier foto en una litofanía imprimible en 3D con previsualización en tiempo real, grosor ajustable y exportación STL directa.',
            litho_f1: 'Previsualización 3D en tiempo real',
            litho_f2: 'Brillo, Contraste e Inversión',
            litho_f3: 'Geometría Plana, Cilíndrica y Curva',
            litho_f4: 'Simulación de fuente de luz',
            litho_f5: 'Exportación STL binario estanco',
            litho_cta: 'Abrir Herramienta de Litofanía',
            hueforge_title: 'Simulador HueForge',
            hueforge_desc: 'Simula pintura multicolor basada en TD por capa. Genera alturas de cambio de filamento (M600) para tu slicer.',
            hueforge_f1: 'Gestor de Capas y Filamentos',
            hueforge_f2: 'Shader de mezcla basado en TD',
            hueforge_f3: 'Biblioteca de filamentos (50+)',
            hueforge_f4: 'Alturas M600 automáticas',
            hueforge_f5: 'Exportar guía HueForge + STL',
            hueforge_cta: 'Abrir HueForge',

            // ---- Herramienta Litofanía ----
            litho_panel_title: 'LITOFANÍA',
            litho_preview: 'PREVISUALIZACIÓN 3D',
            litho_upload: 'Haz clic o arrastra imagen',
            litho_brightness: 'Brillo',
            litho_contrast: 'Contraste',
            litho_invert: 'Invertir',
            litho_light: 'Fuente de Luz',
            litho_thickness_section: 'Grosor',
            litho_base: 'Base',
            litho_max: 'Máx',
            litho_resolution: 'Resolución',
            litho_res_low: 'Baja',
            litho_res_high: 'Alta',
            litho_geometry: 'Geometría',
            litho_flat: 'Plana',
            litho_cylindrical: 'Cilíndrica',
            litho_curved: 'Curva',
            litho_download: 'Descargar STL',
            litho_hint: 'Arrastra para rotar • Rueda para zoom',
            litho_info_thick: 'Grosor',
            litho_info_base: 'Base',
            litho_info_max: 'Máx',
            litho_info_res: 'Res',
            litho_no_image: 'Sube una imagen para empezar',
            litho_processing: 'Generando malla…',

            // ---- HueForge ----
            hueforge_panel_left: 'GESTOR DE CAPAS Y FILAMENTOS',
            hueforge_panel_right: 'FILAMENTOS PRECONFIGURADOS',
            hueforge_search: 'Buscar filamentos…',
            hueforge_add_layer: 'Añadir capa',
            hueforge_layer_start: 'Inicio',
            hueforge_color_changes: 'Alturas de Cambio de Color (M600)',
            hueforge_generate: 'Generar STL y Guía HueForge',
            hueforge_advanced: 'Shader Avanzado',
            hueforge_td_label: 'TD',
            hueforge_layers_empty: 'Añade filamentos desde el panel derecho →',
            hueforge_upload: 'Haz clic o arrastra imagen',

            // ---- Común ----
            brand_all: 'Todos',
        }
    }
};

// Initialize i18next
(function initI18n() {
    const savedLang = localStorage.getItem('3dw-lang') || navigator.language.slice(0, 2) || 'en';
    const lang = ['en', 'es'].includes(savedLang) ? savedLang : 'en';

    window.__i18nReady = false;
    window.__i18nLang = lang;

    i18next.init({
        lng: lang,
        fallbackLng: 'en',
        resources: translations,
        interpolation: { escapeValue: false }
    }, function (err) {
        if (err) console.warn('i18n init error', err);
        window.__i18nReady = true;
        window.__t = i18next.t.bind(i18next);
        document.dispatchEvent(new CustomEvent('i18nReady'));
    });

    window.changeLanguage = function (lang) {
        localStorage.setItem('3dw-lang', lang);
        i18next.changeLanguage(lang, () => {
            window.__i18nLang = lang;
            document.dispatchEvent(new CustomEvent('i18nChanged', { detail: lang }));
        });
    };
})();
