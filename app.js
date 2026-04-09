/* ============================================================
   FirmaPro — app.js
   Lógica principal del Generador de Firmas Corporativas
   ============================================================ */

'use strict';

// ─── Estado de la aplicación ───────────────────────────────────────────────
const state = {
    nombre: '',
    cargo: '',
    telefono: '',
    correo: '',
    sucursal: '',
    color: '#1a2a6c',
    grosor: 2,
    layout: 'vertical',
    logoSrc: null,      // URL base64 o ruta del logo activo
    logoMode: 'preset',  // 'preset' | 'custom'
    presetKey: null,      // clave del preset seleccionado
};

// ─── Imágenes preestablecidas (coloca los archivos en la misma carpeta) ────
const PRESETS = [
    {
        key: 'general',
        label: 'General — Todas las marcas',
        file: 'firma_general.jpg',
        icon: '🏢',
    },
    {
        key: 'ford',
        label: 'Ford',
        file: 'firma_ford.jpg',
        icon: '🚙',
    },
    {
        key: 'kia',
        label: 'KIA',
        file: 'firma_kia.jpg',
        icon: '🚘',
    },
    {
        key: 'jeep',
        label: 'Jeep / RAM / FIAT',
        file: 'firma_jeep.jpg',
        icon: '🚐',
    },
    {
        key: 'honda',
        label: 'Honda',
        file: 'firma_honda.jpg',
        icon: '🏍️',
    },
    {
        key: 'omoda',
        label: 'OMODA | JAECOO',
        file: 'firma_omoda.jpg',
        icon: '🚗',
    },
];

// ─── Referencias al DOM ────────────────────────────────────────────────────
const els = {
    nombre: () => document.getElementById('inputNombre'),
    cargo: () => document.getElementById('inputCargo'),
    telefono: () => document.getElementById('inputTelefono'),
    correo: () => document.getElementById('inputCorreo'),
    sucursal: () => document.getElementById('selectSucursal'),
    colorPicker: () => document.getElementById('inputColor'),
    inputGrosor: () => document.getElementById('inputGrosor'),
    grosorValor: () => document.getElementById('grosorValor'),
    btnLayoutVertical: () => document.getElementById('btnLayoutVertical'),
    btnLayoutHorizontal: () => document.getElementById('btnLayoutHorizontal'),
    uploadZone: () => document.getElementById('uploadZone'),
    inputLogo: () => document.getElementById('inputLogo'),
    logoPreviewWrap: () => document.getElementById('logoPreviewWrap'),
    logoPreviewImg: () => document.getElementById('logoPreviewImg'),
    removeLogoBtn: () => document.getElementById('removeLogoBtn'),
    signaturePreview: () => document.getElementById('signaturePreview'),
    copyBtn: () => document.getElementById('copyBtn'),
    resetBtn: () => document.getElementById('resetBtn'),
    copyFeedback: () => document.getElementById('copyFeedback'),
    colorDots: () => document.querySelectorAll('.color-dot'),
    presetContainer: () => document.getElementById('presetContainer'),
    tabPreset: () => document.getElementById('tabPreset'),
    tabCustom: () => document.getElementById('tabCustom'),
    tabPresetPanel: () => document.getElementById('tabPresetPanel'),
    tabCustomPanel: () => document.getElementById('tabCustomPanel'),
};

// ─── Inicialización ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    buildPresetUI();
    bindFormEvents();
    bindColorEvents();
    bindLogoEvents();
    bindTabEvents();
    bindButtons();
    renderSignature();
});

// ─── Construir grid de presets ────────────────────────────────────────────
function buildPresetUI() {
    const container = els.presetContainer();
    if (!container) return;
    container.innerHTML = '';

    PRESETS.forEach(preset => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'preset-card';
        card.dataset.key = preset.key;
        card.setAttribute('aria-label', preset.label);
        card.innerHTML = `
      <div class="preset-thumb">
        <img src="${preset.file}" alt="${preset.label}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="preset-placeholder" style="display:none">${preset.icon}</div>
      </div>
      <span class="preset-label">${preset.label}</span>
    `;
        card.addEventListener('click', () => selectPreset(preset));
        container.appendChild(card);
    });
}

function selectPreset(preset) {
    state.presetKey = preset.key;
    state.logoSrc = preset.file;
    state.logoMode = 'preset';

    // Highlight seleccionado
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(`.preset-card[data-key="${preset.key}"]`);
    if (card) card.classList.add('selected');

    renderSignature();
}

// ─── Eventos del formulario ───────────────────────────────────────────────
function bindFormEvents() {
    const inputs = ['nombre', 'cargo', 'telefono', 'correo'];
    inputs.forEach(id => {
        const el = document.getElementById(`input${capitalize(id)}`);
        if (el) el.addEventListener('input', () => {
            state[id] = el.value.trim();
            renderSignature();
        });
    });

    const sel = els.sucursal();
    if (sel) sel.addEventListener('change', () => {
        state.sucursal = sel.value;
        renderSignature();
    });

    const grosorSel = els.inputGrosor();
    const grosorVal = els.grosorValor();
    if (grosorSel) {
        grosorSel.addEventListener('input', () => {
            state.grosor = grosorSel.value;
            if (grosorVal) grosorVal.textContent = grosorSel.value + 'px';
            renderSignature();
        });
    }

    const layoutVert = els.btnLayoutVertical();
    const layoutHoriz = els.btnLayoutHorizontal();
    if (layoutVert && layoutHoriz) {
        layoutVert.addEventListener('click', () => {
            state.layout = 'vertical';
            layoutVert.classList.add('tab-active');
            layoutHoriz.classList.remove('tab-active');
            renderSignature();
        });
        layoutHoriz.addEventListener('click', () => {
            state.layout = 'horizontal';
            layoutHoriz.classList.add('tab-active');
            layoutVert.classList.remove('tab-active');
            renderSignature();
        });
    }
}

// ─── Eventos de color ─────────────────────────────────────────────────────
function bindColorEvents() {
    const picker = els.colorPicker();
    if (picker) picker.addEventListener('input', () => {
        state.color = picker.value;
        updateActiveDot(picker.value);
        renderSignature();
    });

    els.colorDots().forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.color;
            state.color = color;
            if (picker) picker.value = color;
            updateActiveDot(color);
            renderSignature();
        });
    });
}

function updateActiveDot(color) {
    els.colorDots().forEach(d => {
        d.classList.toggle('active', d.dataset.color === color);
    });
}

// ─── Eventos de logo (subida personalizada) ───────────────────────────────
function bindLogoEvents() {
    const zone = els.uploadZone();
    const input = els.inputLogo();
    const remove = els.removeLogoBtn();

    if (input) input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) loadCustomLogo(file);
    });

    // Drag & drop
    if (zone) {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) loadCustomLogo(file);
        });
    }

    if (remove) remove.addEventListener('click', () => {
        clearCustomLogo();
    });
}

function loadCustomLogo(file) {
    const reader = new FileReader();
    reader.onload = e => {
        const src = e.target.result;
        state.logoSrc = src;
        state.logoMode = 'custom';
        state.presetKey = null;

        // Mostrar preview en el panel
        const img = els.logoPreviewImg();
        const wrap = els.logoPreviewWrap();
        if (img) img.src = src;
        if (wrap) wrap.style.display = 'inline-flex';

        // Deselect presets
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('selected'));

        renderSignature();
    };
    reader.readAsDataURL(file);
}

function clearCustomLogo() {
    state.logoSrc = null;
    state.logoMode = 'preset';
    state.presetKey = null;

    const img = els.logoPreviewImg();
    const wrap = els.logoPreviewWrap();
    const input = els.inputLogo();
    if (img) img.src = '';
    if (wrap) wrap.style.display = 'none';
    if (input) input.value = '';

    renderSignature();
}

// ─── Tabs: Presets vs Personalizado ──────────────────────────────────────
function bindTabEvents() {
    const tabPreset = els.tabPreset();
    const tabCustom = els.tabCustom();
    const panelPreset = els.tabPresetPanel();
    const panelCustom = els.tabCustomPanel();

    if (tabPreset && tabCustom) {
        tabPreset.addEventListener('click', () => {
            tabPreset.classList.add('tab-active');
            tabCustom.classList.remove('tab-active');
            if (panelPreset) panelPreset.style.display = 'block';
            if (panelCustom) panelCustom.style.display = 'none';
        });
        tabCustom.addEventListener('click', () => {
            tabCustom.classList.add('tab-active');
            tabPreset.classList.remove('tab-active');
            if (panelCustom) panelCustom.style.display = 'block';
            if (panelPreset) panelPreset.style.display = 'none';
        });
    }
}

// ─── Botones: Copiar y Limpiar ────────────────────────────────────────────
function bindButtons() {
    const copy = els.copyBtn();
    const copySmall = document.getElementById('copyBtnSmall');
    const reset = els.resetBtn();
    const downloadJpg = document.getElementById('downloadJpgBtn');

    if (copy) copy.addEventListener('click', copySignatureHTML);
    if (copySmall) copySmall.addEventListener('click', copySignatureHTML);
    if (reset) reset.addEventListener('click', resetForm);
    if (downloadJpg) downloadJpg.addEventListener('click', downloadSignatureJpg);
}

async function copySignatureHTML() {
    // Registro fantasma para Nginx: guarda silenciosamente quién lo usó, hora e IP
    if (state.nombre) {
        const url = `/registro_de_uso?usuario=${encodeURIComponent(state.nombre)}&cargo=${encodeURIComponent(state.cargo)}&accion=Copia_HTML_Outlook`;
        fetch(url, { mode: 'no-cors' }).catch(() => { });
    }

    const html = buildSignatureHTML();
    try {
        await navigator.clipboard.writeText(html);
        showFeedback('✅ ¡Firma copiada al portapapeles!', 'success');
    } catch {
        const ta = document.createElement('textarea');
        ta.value = html;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showFeedback('✅ ¡Firma copiada!', 'success');
    }
}

// ─── Descargar firma como JPG ─────────────────────────────────────────────
async function downloadSignatureJpg() {
    const { nombre, cargo, telefono, correo, sucursal, logoSrc } = state;
    const hasData = nombre || cargo || telefono || correo || sucursal || logoSrc;

    if (!hasData) {
        showFeedback('⚠️ Completa al menos un campo antes de descargar', 'error');
        return;
    }

    // Registro fantasma para Nginx
    if (state.nombre) {
        const url = `/registro_de_uso?usuario=${encodeURIComponent(state.nombre)}&cargo=${encodeURIComponent(state.cargo)}&accion=Descarga_JPG`;
        fetch(url, { mode: 'no-cors' }).catch(() => { });
    }

    const btn = document.getElementById('downloadJpgBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando…'; }

    // Crear contenedor temporal con fondo blanco para renderizar la firma
    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
        'position:fixed', 'left:-9999px', 'top:0',
        'background:#ffffff', 'padding:24px 28px',
        'font-family:Calibri,Segoe UI,Arial,sans-serif',
        'display:inline-block', 'min-width:500px',
    ].join(';');
    wrapper.innerHTML = buildSignatureHTML();
    document.body.appendChild(wrapper);

    try {
        // Esperar a que las imágenes dentro del wrapper carguen
        const imgs = wrapper.querySelectorAll('img');
        await Promise.all([...imgs].map(img =>
            img.complete ? Promise.resolve() :
                new Promise(res => { img.onload = res; img.onerror = res; })
        ));

        const canvas = await html2canvas(wrapper, {
            backgroundColor: '#ffffff',
            scale: 2,           // alta resolución
            useCORS: true,
            logging: false,
        });

        // Descargar como JPG
        const link = document.createElement('a');
        const nombreArchivo = (nombre || 'firma').replace(/\s+/g, '_').toLowerCase();
        link.download = `firma_${nombreArchivo}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();

        showFeedback('✅ ¡Imagen descargada correctamente!', 'success');
    } catch (err) {
        console.error(err);
        showFeedback('❌ Error al generar la imagen. Intenta de nuevo.', 'error');
    } finally {
        document.body.removeChild(wrapper);
        if (btn) { btn.disabled = false; btn.innerHTML = '⬇️ Descargar JPG'; }
    }
}

function showFeedback(msg, type = 'success') {
    const fb = els.copyFeedback();
    if (!fb) return;
    fb.textContent = msg;
    fb.style.color = type === 'success' ? '#34d399' : '#f87171';
    fb.style.opacity = '1';
    setTimeout(() => { fb.style.opacity = '0'; }, 3500);
}

function resetForm() {
    Object.assign(state, {
        nombre: '', cargo: '', telefono: '', correo: '',
        sucursal: '', color: '#1a2a6c', grosor: 2, layout: 'vertical', logoSrc: null,
        logoMode: 'preset', presetKey: null,
    });

    ['inputNombre', 'inputCargo', 'inputTelefono', 'inputCorreo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sel = els.sucursal();
    if (sel) sel.value = '';
    const picker = els.colorPicker();
    if (picker) picker.value = '#1a2a6c';

    const grosorSel = els.inputGrosor();
    if (grosorSel) grosorSel.value = 2;
    const grosorVal = els.grosorValor();
    if (grosorVal) grosorVal.textContent = '2px';

    const layoutVert = els.btnLayoutVertical();
    const layoutHoriz = els.btnLayoutHorizontal();
    if (layoutVert) layoutVert.classList.add('tab-active');
    if (layoutHoriz) layoutHoriz.classList.remove('tab-active');

    clearCustomLogo();
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('selected'));
    updateActiveDot('#1a2a6c');
    renderSignature();
}

// ─── Renderizar vista previa en tiempo real ───────────────────────────────
function renderSignature() {
    const preview = els.signaturePreview();
    const htmlWrap = document.getElementById('htmlOutputWrap');
    const htmlCode = document.getElementById('htmlCodeDisplay');
    if (!preview) return;

    const { nombre, cargo, telefono, correo, sucursal, logoSrc } = state;
    const hasData = nombre || cargo || telefono || correo || sucursal || logoSrc;

    if (!hasData) {
        preview.innerHTML = `<div class="sig-loading">✉ Completa el formulario para ver tu firma</div>`;
        if (htmlWrap) htmlWrap.style.display = 'none';
        return;
    }

    const html = buildSignatureHTML();
    preview.innerHTML = html;

    // Mostrar código generado
    if (htmlWrap) htmlWrap.style.display = 'block';
    if (htmlCode) htmlCode.textContent = html;
}

// ─── Construir el HTML final de la firma ──────────────────────────────────
function buildSignatureHTML() {
    const { nombre, cargo, telefono, correo, sucursal, color, grosor, layout, logoSrc } = state;

    // Convertir color hex a rgb para la línea lateral
    const rgb = hexToRgb(color);
    const colorLight = `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)`;

    // Convertir ruta de imagen a URL absoluta (necesario para Outlook/Gmail)
    let absoluteLogoUrl = logoSrc;
    if (logoSrc && !logoSrc.startsWith('http') && !logoSrc.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = logoSrc;
        absoluteLogoUrl = a.href; // Transforma "foto.jpg" a "https://firma.valdelarze.cl/foto.jpg"
    }

    // Etiqueta img del logo
    const logoImg = absoluteLogoUrl
        ? `<img src="${absoluteLogoUrl}" alt="Valenzuela &amp; Delarze"
              style="width:220px;max-width:220px;height:auto;display:block;border:0;" />`
        : '';

    // Datos de texto (ultra comprimido extremo)
    const rows = [];
    const infoLines = [];

    let cleanPhone = '';
    if (telefono) {
        // Limpia el número para formato internacional (solo números)
        cleanPhone = telefono.replace(/[^0-9]/g, '');
    }

    if (nombre) infoLines.push(`<span style="font-size:16px;font-weight:700;color:${color};">${escHtml(nombre)}</span>`);
    if (cargo) infoLines.push(`<span style="font-size:12px;color:#555555;font-style:italic;">${escHtml(cargo)}</span>`);
    if (telefono) infoLines.push(`<span style="font-size:12px;color:#444444;"><a href="https://wa.me/${cleanPhone}" target="_blank" style="text-decoration:none;"><img src="https://firma.valdelarze.cl/whatsapp.png" alt="WA" width="13" height="13" style="vertical-align:middle; border:0; margin-right:3px;"></a><a href="https://wa.me/${cleanPhone}" target="_blank" style="color:#444444;text-decoration:none;vertical-align:middle;">${escHtml(telefono)}</a></span>`);
    if (correo) infoLines.push(`<span style="font-size:12px;color:#444444;"><span style="color:${color};font-weight:600;vertical-align:middle;">✉</span>&nbsp;<a href="mailto:${escHtml(correo)}" style="color:${color};text-decoration:none;vertical-align:middle;">${escHtml(correo)}</a></span>`);
    if (sucursal) infoLines.push(`<span style="font-size:12px;color:#444444;"><span style="color:${color};font-weight:600;vertical-align:middle;">🏢</span>&nbsp;<span style="vertical-align:middle;">${escHtml(sucursal)}</span></span>`);

    if (infoLines.length > 0) {
        rows.push(`<tr><td style="padding:0; margin:0; font-family:Calibri,Segoe UI,Arial,sans-serif; line-height:14px; mso-line-height-rule:exactly;">
          ${infoLines.join('<br>')}
        </td></tr>`);
    }

    let finalTable = '';

    if (layout === 'horizontal') {
        finalTable = `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        ${rows.length > 0 ? `<tr>
          <td style="vertical-align:top;padding:0 0 16px 0;">
            <table cellpadding="0" cellspacing="0" border="0">
              ${rows.join('\n              ')}
            </table>
          </td>
        </tr>` : ''}
        ${logoSrc ? `<tr><td style="border-top: ${grosor}px solid ${color}; padding:0 0 16px 0; font-size:0; line-height:0;">&nbsp;</td></tr>` : ''}
        ${logoSrc ? `<tr><td style="padding:0;">${logoImg}</td></tr>` : ''}
      </table>`;
    } else {
        // Vertical layout
        finalTable = `
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoSrc ? `<td style="padding:0 20px 0 0;vertical-align:middle;">${logoImg}</td>` : ''}
          ${logoSrc ? `<td style="width:16px; border-left: ${grosor}px solid ${color}; padding:0;"></td>` : ''}
          <td style="vertical-align:top;padding:${logoSrc ? '0' : '0 0 0 0'};">
            <table cellpadding="0" cellspacing="0" border="0">
              ${rows.join('\n              ')}
            </table>
          </td>
        </tr>
      </table>`;
    }

    return `<!-- Firma Corporativa — Valenzuela & Delarze -->
<table cellpadding="0" cellspacing="0" border="0"
  style="font-family:Calibri,Segoe UI,Arial,sans-serif;border-collapse:collapse;max-width:600px;">
  <tr>
    <td style="padding:12px 0 0 0;">
      ${finalTable}
    </td>
  </tr>
</table>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}
