// Auditoria de contraste WCAG 2.1 (1.4.3 Contraste minimo y 1.4.11 Contraste
// no textual, nivel AA) para los tokens de color de DAFI.
//
// Sin dependencias:  node S07_S08_A1/evidencia/contraste.mjs
//
// Imprime DOS pasadas:
//   1. ANTES  - la paleta tal como salio del sistema de diseno en Figma.
//   2. DESPUES - con las correcciones aplicadas en frontend/src/app/globals.css
//                y en los componentes.
//
// Formula: W3C WCAG 2.1, "relative luminance" y "contrast ratio".
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance

const PALETA = {
  'brand/50': '#EAF4F6',
  'brand/100': '#D3E7EB',
  'brand/200': '#AFD3DA',
  'brand/500': '#1F7A89',
  'brand/600': '#176371',
  'brand/700': '#114E5A',
  'brand/900': '#0A2F37',
  'ink/0': '#FFFFFF',
  'ink/50': '#F6F9FA',
  'ink/100': '#EDF2F4',
  'ink/200': '#DEE6E9',
  'ink/300': '#C3CFD4',
  'ink/500': '#7B8A91',
  'ink/600': '#5C6B73',
  'ink/700': '#44555D',
  'ink/900': '#16262C',
  'estado/borrador-bg': '#EEF1F4',
  'estado/borrador-fg': '#4F5B66',
  'estado/enviada-bg': '#E4EEFD',
  'estado/enviada-fg': '#1D4ED8',
  'estado/revision-bg': '#EFE9FB',
  'estado/revision-fg': '#6D28D9',
  'estado/info-bg': '#FDF0DC',
  'estado/info-fg': '#B45309',
  'estado/indicaciones-bg': '#E2F5E9',
  'estado/indicaciones-fg': '#15803D',
  'estado/cerrada-bg': '#E8EDF1',
  'estado/cerrada-fg': '#475569',
  'estado/sinmedico-bg': '#FDE7ED',
  'estado/sinmedico-fg': '#BE123C',
  'alerta/bg': '#FFF1F1',
  'alerta/fg': '#9F1D1D',
  'prioridad/bg': '#FDF0DC',
  'prioridad/fg': '#9A4E07',
  'peligro/500': '#DC2626',
  'exito/500': '#15803D',
};

// Correccion tipo A: cambia el VALOR del token.
const CORRECCIONES_DE_TOKEN = {
  'estado/info-fg': '#92400E',
  'estado/indicaciones-fg': '#166534',
};

// Pares (uso, primer plano, fondo, umbralBajo) que usan los componentes.
// umbralBajo = texto grande (>=18.66px negrita o >=24px) o componente de UI no
// textual: su minimo AA es 3.0:1 en vez de 4.5:1.
const PARES = [
  ['Boton primario / etiqueta', 'ink/0', 'brand/500', false],
  ['Boton secundario / etiqueta', 'brand/700', 'ink/0', false],
  ['Boton secundario / borde', 'ink/300', 'ink/0', true],
  ['Boton fantasma / etiqueta', 'brand/600', 'ink/50', false],
  ['Boton peligro / etiqueta', 'ink/0', 'peligro/500', false],
  ['Campo / texto capturado', 'ink/900', 'ink/0', false],
  ['Campo / marcador de posicion', 'ink/500', 'ink/0', false],
  ['Campo / etiqueta', 'ink/600', 'ink/0', false],
  ['Campo / mensaje de error', 'peligro/500', 'ink/0', false],
  ['Campo / borde en reposo', 'ink/300', 'ink/0', true],
  ['Tarjeta / titulo', 'ink/900', 'ink/0', false],
  ['Tarjeta / texto secundario', 'ink/500', 'ink/0', false],
  ['Navbar / enlace inactivo', 'ink/600', 'ink/0', false],
  ['Navbar / enlace activo', 'brand/700', 'brand/50', false],
  ['Navbar / borde del boton de menu', 'ink/300', 'ink/0', true],
  ['Chip BORRADOR', 'estado/borrador-fg', 'estado/borrador-bg', false],
  ['Chip ENVIADA', 'estado/enviada-fg', 'estado/enviada-bg', false],
  ['Chip EN_REVISION', 'estado/revision-fg', 'estado/revision-bg', false],
  ['Chip INFO_SOLICITADA', 'estado/info-fg', 'estado/info-bg', false],
  ['Chip CON_INDICACIONES', 'estado/indicaciones-fg', 'estado/indicaciones-bg', false],
  ['Chip CERRADA', 'estado/cerrada-fg', 'estado/cerrada-bg', false],
  ['Chip SIN_MEDICO', 'estado/sinmedico-fg', 'estado/sinmedico-bg', false],
  ['Aviso de emergencias / texto', 'alerta/fg', 'alerta/bg', false],
  ['Anillo de foco', 'brand/500', 'ink/0', true],
];

// Correccion tipo B: cambia el TOKEN QUE USA el componente, no su valor.
const CORRECCIONES_DE_USO = {
  'Campo / marcador de posicion': { fg: 'ink/600' },
  'Tarjeta / texto secundario': { fg: 'ink/600' },
  'Campo / borde en reposo': { fg: 'ink/500' },
  'Boton secundario / borde': { fg: 'ink/500' },
  'Navbar / borde del boton de menu': { fg: 'ink/500' },
};

const canal = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

function ratio(hexA, hexB) {
  const a = luminancia(hexA);
  const b = luminancia(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function evaluar(paleta, pares) {
  return pares.map(([uso, fg, bg, umbralBajo]) => {
    const r = ratio(paleta[fg], paleta[bg]);
    const minimo = umbralBajo ? 3.0 : 4.5;
    return { uso, fg, bg, ratio: r, minimo, pasa: r >= minimo };
  });
}

const pad = (s, n) => String(s).padEnd(n);

function imprimir(titulo, filas) {
  const ancho = Math.max(...filas.map((f) => f.uso.length));
  console.log('');
  console.log(titulo);
  console.log('='.repeat(titulo.length));
  console.log('');
  console.log(
    `${pad('Uso', ancho)}  ${pad('Primer plano', 22)} ${pad('Fondo', 22)} ${pad('Ratio', 9)} ${pad('Min', 6)} Resultado`
  );
  console.log('-'.repeat(ancho + 68));
  for (const f of filas) {
    console.log(
      `${pad(f.uso, ancho)}  ${pad(f.fg, 22)} ${pad(f.bg, 22)} ` +
        `${pad(f.ratio.toFixed(2) + ':1', 9)} ${pad(f.minimo.toFixed(1), 6)} ${f.pasa ? 'PASA' : 'FALLA'}`
    );
  }
  const fallan = filas.filter((f) => !f.pasa);
  console.log('-'.repeat(ancho + 68));
  console.log(`${filas.length} pares | ${filas.length - fallan.length} pasan | ${fallan.length} fallan`);
  return fallan;
}

console.log('Auditoria de contraste WCAG 2.1 AA - sistema de diseno de DAFI');
console.log('Umbrales: 4.5:1 texto normal (1.4.3) | 3.0:1 texto grande y UI no textual (1.4.11)');

// ---- Pasada 1: antes ----
const antes = evaluar(PALETA, PARES);
const fallanAntes = imprimir('PASADA 1 - ANTES de las correcciones', antes);

// ---- Pasada 2: despues ----
const paletaCorregida = { ...PALETA, ...CORRECCIONES_DE_TOKEN };
const paresCorregidos = PARES.map(([uso, fg, bg, bajo]) => {
  const c = CORRECCIONES_DE_USO[uso];
  return [uso, c?.fg ?? fg, c?.bg ?? bg, bajo];
});
const despues = evaluar(paletaCorregida, paresCorregidos);
const fallanDespues = imprimir('PASADA 2 - DESPUES de las correcciones', despues);

// ---- Resumen de cambios ----
console.log('');
console.log('CORRECCIONES APLICADAS');
console.log('======================');
console.log('');
console.log('A. Cambio de valor del token (globals.css):');
for (const [token, nuevo] of Object.entries(CORRECCIONES_DE_TOKEN)) {
  const a = antes.find((f) => f.fg === token);
  const d = despues.find((f) => f.fg === token);
  console.log(
    `   ${pad(token, 24)} ${PALETA[token]} -> ${nuevo}   ` +
      `${a.ratio.toFixed(2)}:1 -> ${d.ratio.toFixed(2)}:1`
  );
}
console.log('');
console.log('B. Cambio del token que usa el componente:');
for (const [uso, c] of Object.entries(CORRECCIONES_DE_USO)) {
  const original = PARES.find((p) => p[0] === uso);
  const a = antes.find((f) => f.uso === uso);
  const d = despues.find((f) => f.uso === uso);
  console.log(
    `   ${pad(uso, 34)} ${pad(original[1], 10)} -> ${pad(c.fg, 10)} ` +
      `${a.ratio.toFixed(2)}:1 -> ${d.ratio.toFixed(2)}:1`
  );
}

console.log('');
console.log(`RESULTADO: ${fallanAntes.length} incumplimientos antes -> ${fallanDespues.length} despues.`);

process.exitCode = fallanDespues.length ? 1 : 0;
