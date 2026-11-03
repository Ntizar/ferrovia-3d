/* Ferrovia Twin · tramo de prueba 420 m (LAV Madrid–Barcelona, viaducto del Jalón)
   Eje y geometría: OpenStreetMap (ODbL) · terreno: EU-DEM 25 m (OpenTopoData)
   Estructura y superestructura: generadores paramétricos (no es levantamiento LiDAR). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CV = document.getElementById('cv');
const ESC = document.getElementById('escena');

/* ─────────────────────────  estado  ───────────────────────── */
const S = {
  datos: null, eje: [], capas: {}, activos: [], seleccion: null,
  vista: 'aerea', noche: false, reloj: 0,
};
const Y0 = 560;                       // desplazamiento vertical de escena
const VIA_ANCHO = 1.435;              // ancho de vía UIC (m)
const ENTRE_EJES = 4.70;              // separación entre ejes de vía (m)
const CARGA = { hilo: 5.30, mensajero: 6.60, poste: 50, pendola: 5 };

/* ─────────────────────────  escena  ───────────────────────── */
const renderer = new THREE.WebGLRenderer({ canvas: CV, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const scene = new THREE.Scene();
{
  const c = document.createElement('canvas'); c.width = 8; c.height = 256;
  const g2 = c.getContext('2d').createLinearGradient(0, 0, 0, 256);
  g2.addColorStop(0, '#1b2740'); g2.addColorStop(0.45, '#101720'); g2.addColorStop(1, '#1b231a');
  const ctx = c.getContext('2d'); ctx.fillStyle = g2; ctx.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
}
scene.fog = new THREE.Fog(0x0a0d11, 700, 2200);

const camara = new THREE.PerspectiveCamera(48, 1, 0.5, 4000);
const controles = new OrbitControls(camara, CV);
controles.enableDamping = true;
controles.dampingFactor = 0.06;
controles.maxPolarAngle = Math.PI * 0.495;
controles.minDistance = 6;
controles.maxDistance = 900;

/* luces */
const hemi = new THREE.HemisphereLight(0xd8e6ff, 0x39412f, 1.15);
scene.add(hemi);
const sol = new THREE.DirectionalLight(0xfff3e0, 3.1);
sol.position.set(-180, 460, 210);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
const sc = sol.shadow.camera;
sc.left = -320; sc.right = 320; sc.top = 320; sc.bottom = -320; sc.near = 10; sc.far = 900;
scene.add(sol);
const relleno = new THREE.DirectionalLight(0x88aaff, 0.55);
scene.add(new THREE.AmbientLight(0xb9c9e0, 0.35));
relleno.position.set(200, 120, -200);
scene.add(relleno);

/* ─────────────────────────  materiales  ───────────────────────── */
const M = {
  terreno: new THREE.MeshStandardMaterial({ color: 0x6a7758, roughness: 1, metalness: 0, flatShading: false }),
  terrenoMalla: new THREE.MeshBasicMaterial({ color: 0x9dba8a, wireframe: true, transparent: true, opacity: 0.13 }),
  balasto: new THREE.MeshStandardMaterial({ color: 0x6d6a63, roughness: 1 }),
  placa: new THREE.MeshStandardMaterial({ color: 0xb8b4ab, roughness: 0.9 }),
  carril: new THREE.MeshStandardMaterial({ color: 0x9aa3b0, roughness: 0.35, metalness: 0.85 }),
  sujecion: new THREE.MeshStandardMaterial({ color: 0x2f343b, roughness: 0.7, metalness: 0.3 }),
  hormigon: new THREE.MeshStandardMaterial({ color: 0xbfb9ac, roughness: 0.92 }),
  hormigonOsc: new THREE.MeshStandardMaterial({ color: 0x9d978b, roughness: 0.95 }),
  acero: new THREE.MeshStandardMaterial({ color: 0x6f7683, roughness: 0.55, metalness: 0.6 }),
  cable: new THREE.MeshStandardMaterial({ color: 0xf2f5f9, roughness: 0.35, metalness: 0.55, emissive: 0x101820, emissiveIntensity: 0.6 }),
  senal: new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.6 }),
  luzRoja: new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2a1f, emissiveIntensity: 2 }),
  luzVerde: new THREE.MeshStandardMaterial({ color: 0x25d366, emissive: 0x18c25a, emissiveIntensity: 2 }),
  tren: new THREE.MeshStandardMaterial({ color: 0xe8ecf1, roughness: 0.35, metalness: 0.25 }),
  trenVentana: new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.2, metalness: 0.6 }),
  trenFranja: new THREE.MeshStandardMaterial({ color: 0xb01f2e, roughness: 0.5 }),
};

/* ─────────────────────────  utilidades geométricas  ───────────────────────── */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function pkAlineacion(pk) {           // punto + tangente del eje a un PK
  const e = S.eje;
  if (pk <= e[0].pk) return { p: e[0], d: dir(e, 0) };
  if (pk >= e[e.length - 1].pk) return { p: e[e.length - 1], d: dir(e, e.length - 2) };
  let lo = 0, hi = e.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; (e[m].pk < pk) ? lo = m : hi = m; }
  const a = e[lo], b = e[hi], f = (pk - a.pk) / (b.pk - a.pk || 1);
  return {
    p: { pk, x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, rail: a.rail + (b.rail - a.rail) * f },
    d: dir(e, lo),
  };
}
function dir(e, i) {
  const a = e[Math.max(0, i)], b = e[Math.min(e.length - 1, i + 1)];
  const dx = b.x - a.x, dz = b.z - a.z, n = Math.hypot(dx, dz) || 1;
  return { x: dx / n, z: dz / n };
}
/* perfil 2D (u=trasversal, v=vertical) extruido a lo largo de un tramo de eje */
function extruir(perfil, pk0, pk1, paso = 2, cerrado = true, mat = M.hormigon) {
  const pos = [], idx = [];
  const n = Math.max(2, Math.ceil(Math.abs(pk1 - pk0) / paso) + 1);
  const est = [];
  for (let i = 0; i < n; i++) {
    const pk = pk0 + (pk1 - pk0) * (i / (n - 1));
    const { p, d } = pkAlineacion(pk);
    // perpendicular (derecha del sentido de avance)
    est.push({ x: p.x, z: p.z, y: p.rail - Y0, px: d.z, pz: -d.x });
  }
  for (let i = 0; i < n; i++) {
    const s = est[i];
    for (const [u, v] of perfil) pos.push(s.x + s.px * u, s.y + v, s.z + s.pz * u);
  }
  const m = perfil.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < m - 1; j++) {
      const a = i * m + j, b = a + 1, c = a + m, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

/* ─────────────────────────  construcción  ───────────────────────── */
const GRUPOS = { terreno: new THREE.Group(), via: new THREE.Group(), catenaria: new THREE.Group(), estructura: new THREE.Group(), senal: new THREE.Group(), tren: new THREE.Group() };
Object.values(GRUPOS).forEach(g => scene.add(g));

function registrar(mesh, activo) {
  mesh.userData.activo = activo;
  S.activos.push(activo);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}


/* etiqueta flotante (sprite) */
function spriteTexto(texto, { bg = '#0b1018', fg = '#e8ecf1', borde = '#33404f', px = 34, alto = 3.4 } = {}) {
  const c = document.createElement('canvas');
  let ctx = c.getContext('2d');
  ctx.font = `600 ${px}px ui-monospace, monospace`;
  const w = Math.ceil(ctx.measureText(texto).width) + 30, h = px + 26;
  c.width = w; c.height = h;
  ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.strokeStyle = borde; ctx.lineWidth = 4;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(2, 2, w - 4, h - 4, 10); else ctx.rect(2, 2, w - 4, h - 4);
  ctx.fill(); ctx.stroke();
  ctx.font = `600 ${px}px ui-monospace, monospace`; ctx.fillStyle = fg;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texto, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  spr.scale.set(alto * w / h, alto, 1);
  return spr;
}

/* hitos kilométricos cada 50 m */
function construirHitos() {
  const pkA = S.datos.rango.pk_min, pkB = S.datos.rango.pk_max;
  for (let pk = Math.ceil(pkA / 50) * 50; pk <= pkB; pk += 50) {
    const { p, d } = pkAlineacion(pk);
    const u = -(ENTRE_EJES / 2 + 4.2);
    const x = p.x + d.z * u, z = p.z - d.x * u;
    const y = p.rail - Y0;
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 1.25, 6), M.placa);
    poste.position.set(x, y + 0.6, z);
    GRUPOS.senal.add(poste);
    if (Math.abs(pk % 100) < 1) {
      const et = spriteTexto(`PK ${fmtPk(pk)}`, { alto: 2.2 });
      et.position.set(x, y + 2.4, z);
      GRUPOS.senal.add(et);
    }
  }
}

/* marcador del activo seleccionado */
let marcador = null;
function marcarSeleccion(a) {
  if (marcador) { scene.remove(marcador); marcador = null; }
  const { p } = pkAlineacion(a.pk);
  const g = new THREE.Group();
  const alto = 26;
  const linea = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, alto, 6),
    new THREE.MeshBasicMaterial({ color: 0x4c8dff, transparent: true, opacity: 0.55 })
  );
  linea.position.y = alto / 2; g.add(linea);
  const aro = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 2.0, 32),
    new THREE.MeshBasicMaterial({ color: 0x4c8dff, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  aro.rotation.x = -Math.PI / 2; g.add(aro);
  const et = spriteTexto(a.id, { alto: 2.4, borde: '#4c8dff' });
  et.position.y = alto + 2; g.add(et);
  g.position.set(p.x, p.rail - Y0 - 4, p.z);
  marcador = g; scene.add(g);
}

function construirTerreno() {
  const g = S.datos.terreno;
  const ni = g.estaciones.length, nj = g.offsets.length;
  // g.puntos viene ordenado por estación y, dentro, por offset
  const pt = (i, j) => g.puntos[Math.min(g.puntos.length - 1, i * nj + j)] || { x: 0, z: 0, y: 580 };
  const SI = 4, SJ = 4;
  const filas = (ni - 1) * SI + 1, cols = (nj - 1) * SJ + 1;
  const pos = [], idx = [];
  for (let a = 0; a < filas; a++) {
    const fi = a / SI, i = Math.min(ni - 2, Math.floor(fi)), ti = fi - i;
    for (let b = 0; b < cols; b++) {
      const fj = b / SJ, j = Math.min(nj - 2, Math.floor(fj)), tj = fj - j;
      const p00 = pt(i, j), p10 = pt(i + 1, j), p01 = pt(i, j + 1), p11 = pt(i + 1, j + 1);
      const x = lerp(lerp(p00.x, p10.x, ti), lerp(p01.x, p11.x, ti), tj);
      const z = lerp(lerp(p00.z, p10.z, ti), lerp(p01.z, p11.z, ti), tj);
      const y = lerp(lerp(p00.y, p10.y, ti), lerp(p01.y, p11.y, ti), tj);
      pos.push(x, y - Y0, z);
    }
  }
  for (let a = 0; a < filas - 1; a++) {
    for (let b = 0; b < cols - 1; b++) {
      const p = a * cols + b, q = p + 1, r = p + cols, s = r + 1;
      idx.push(p, r, q, q, r, s);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // color por cota
  let ymin = Infinity, ymax = -Infinity;
  for (let i = 1; i < pos.length; i += 3) { ymin = Math.min(ymin, pos[i]); ymax = Math.max(ymax, pos[i]); }
  const col = [];
  const c1 = new THREE.Color(0x39442f), c2 = new THREE.Color(0x6b7a58), c3 = new THREE.Color(0x8d8b72);
  for (let i = 0; i < pos.length; i += 3) {
    const t = (pos[i + 1] - ymin) / Math.max(1e-6, ymax - ymin);
    const c = t < 0.6 ? c1.clone().lerp(c2, t / 0.6) : c2.clone().lerp(c3, (t - 0.6) / 0.4);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const matTerr = M.terreno.clone(); matTerr.vertexColors = true;
  const malla = new THREE.Mesh(geo, matTerr);
  malla.receiveShadow = true;
  GRUPOS.terreno.add(malla);
  GRUPOS.terreno.add(new THREE.Mesh(geo, M.terrenoMalla));
  registrar(malla, {
    id: 'TER-01', nombre: 'Modelo de terreno (EU-DEM 25 m)', sistema: 'terreno',
    pk: 0, estado: 'ok', datos: { fuente: 'EU-DEM · OpenTopoData', resolucion: '25 m', muestras: g.puntos.length }
  });
}
const lerp = (a, b, t) => a + (b - a) * t;

function construirVia() {
  const pkA = S.datos.rango.pk_min, pkB = S.datos.rango.pk_max;
  for (const [lado, nombre] of [[-ENTRE_EJES / 2, 'vía 1'], [ENTRE_EJES / 2, 'vía 2']]) {
    // placa de hormigón
    const placa = extruir(
      [[lado - 1.7, -0.62], [lado + 1.7, -0.62], [lado + 1.7, -0.30], [lado - 1.7, -0.30]],
      pkA, pkB, 2, true, M.placa
    );
    GRUPOS.via.add(registrar(placa, {
      id: `VIA-PL-${lado < 0 ? '1' : '2'}`, nombre: `Vía en placa · ${nombre}`, sistema: 'vía', pk: 0, estado: 'ok',
      datos: { tipo: 'Placa de hormigón (RHEDA)', ancho: '3,40 m', espesor: '0,32 m', longitud: `${Math.round(pkB - pkA)} m` },
      hist: [['2026-05-12', 'Inspección visual', 'Sin fisuras. Limpieza de canaletas.'], ['2026-09-30', 'Auscultación geométrica', 'Desviación máxima 1,8 mm']]
    }));
    // carriles
    for (const s of [-VIA_ANCHO / 2, VIA_ANCHO / 2]) {
      const u = lado + s;
      const carril = extruir(
        [[u - 0.037, -0.30], [u + 0.037, -0.30], [u + 0.037, -0.255], [u + 0.009, -0.185],
         [u + 0.009, -0.045], [u + 0.036, -0.018], [u + 0.036, 0], [u - 0.036, 0],
         [u - 0.036, -0.018], [u - 0.009, -0.045], [u - 0.009, -0.185], [u - 0.037, -0.255]],
        pkA, pkB, 1.5, true, M.carril
      );
      GRUPOS.via.add(registrar(carril, {
        id: `VIA-CAR-${lado < 0 ? '1' : '2'}${s < 0 ? 'I' : 'D'}`, nombre: `Carril UIC60 · ${nombre} ${s < 0 ? 'izquierdo' : 'derecho'}`,
        sistema: 'vía', pk: 0, estado: s > 0 && lado < 0 ? 'warn' : 'ok',
        datos: { perfil: 'UIC60', masa: '60,2 kg/m', acero: 'R260', desgaste: s > 0 && lado < 0 ? '2,1 mm (límite 8 mm)' : '1,2 mm' },
        hist: [['2026-08-04', 'Medición de desgaste', s > 0 && lado < 0 ? '2,1 mm en cabeza. Vigilar.' : '1,2 mm. Dentro de tolerancia.']]
      }));
    }
  }
  // sujeciones (instanciadas)
  const pks = [];
  for (let pk = pkA + 2; pk < pkB - 2; pk += 0.65) pks.push(pk);
  const geo = new THREE.BoxGeometry(0.20, 0.09, 0.26);
  const inst = new THREE.InstancedMesh(geo, M.sujecion, pks.length * 4);
  const m4 = new THREE.Matrix4(); let k = 0;
  for (const pk of pks) {
    const { p, d } = pkAlineacion(pk);
    for (const lado of [-ENTRE_EJES / 2, ENTRE_EJES / 2]) {
      for (const s of [-VIA_ANCHO / 2, VIA_ANCHO / 2]) {
        m4.makeRotationY(Math.atan2(d.x, d.z));
        m4.setPosition(p.x + d.z * (lado + s), p.rail - Y0 - 0.26, p.z - d.x * (lado + s));
        inst.setMatrixAt(k++, m4);
      }
    }
  }
  inst.castShadow = true;
  GRUPOS.via.add(inst);
}

function construirCatenaria() {
  const pkA = S.datos.rango.pk_min, pkB = S.datos.rango.pk_max;
  const postes = [];
  for (let pk = Math.ceil(pkA / CARGA.poste) * CARGA.poste; pk <= pkB; pk += CARGA.poste) postes.push(pk);
  postes.forEach((pk, i) => {
    const lado = i % 2 === 0 ? -1 : 1;         // alternos
    const u = lado * (ENTRE_EJES / 2 + 2.6);
    const { p, d } = pkAlineacion(pk);
    const g = new THREE.Group();
    // poste
    const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 8.6, 10), M.acero);
    mastil.position.set(0, 4.3, 0); g.add(mastil);
    // brazo
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.14, 0.14), M.acero);
    brazo.position.set(-lado * 1.45, 7.1, 0); g.add(brazo);
    const tirante = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.08), M.acero);
    tirante.position.set(-lado * 1.1, 7.75, 0); tirante.rotation.z = lado * 0.32; g.add(tirante);
    // aislador
    const aisl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 8), M.hormigonOsc);
    aisl.position.set(-lado * 2.6, 6.6, 0); g.add(aisl);
    g.position.set(p.x + d.z * u, p.rail - Y0, p.z - d.x * u);
    g.rotation.y = Math.atan2(d.x, d.z);
    GRUPOS.catenaria.add(registrar(g, {
      id: `CAT-P${String(i + 1).padStart(2, '0')}`, nombre: `Poste de catenaria ${i + 1}`, sistema: 'catenaria',
      pk: Math.round(pk), estado: i === 3 ? 'warn' : 'ok',
      datos: {
        tipo: i % 4 === 0 ? 'Pórtico / poste rígido' : 'Poste con brazo', altura: '8,60 m',
        cimentación: 'Dado de hormigón 1,2 × 1,2 m', desplome: i === 3 ? '0,9 % (límite 1,0 %)' : '0,2 %',
      },
      hist: [['2026-07-18', 'Revisión de catenaria', i === 3 ? 'Desplome 0,9 %. Anotado para el próximo ciclo.' : 'Sin novedad. Par de apriete correcto.']]
    }));
  });

  // hilos: contacto (zigzag) y mensajero con flecha
  for (const lado of [-ENTRE_EJES / 2, ENTRE_EJES / 2]) {
    for (let i = 0; i < postes.length - 1; i++) {
      const p0 = postes[i], p1 = postes[i + 1];
      const zig = (i % 2 ? 1 : -1) * 0.20;
      const ptsC = [], ptsM = [];
      const N = 10;
      for (let k = 0; k <= N; k++) {
        const f = k / N, pk = lerp(p0, p1, f);
        const { p, d } = pkAlineacion(pk);
        const zz = lerp(zig, -zig, f);
        ptsC.push(V3(p.x + d.z * (lado + zz), p.rail - Y0 + CARGA.hilo, p.z - d.x * (lado + zz)));
        const sag = Math.sin(Math.PI * f) * 0.55;
        ptsM.push(V3(p.x + d.z * (lado + zz * 0.4), p.rail - Y0 + CARGA.mensajero - sag, p.z - d.x * (lado + zz * 0.4)));
      }
      GRUPOS.catenaria.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsC), 24, 0.035, 5, false), M.cable));
      GRUPOS.catenaria.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsM), 24, 0.038, 5, false), M.cable));
      // péndolas
      for (let k = 1; k < N; k++) {
        const f = k / N, pk = lerp(p0, p1, f);
        const { p, d } = pkAlineacion(pk);
        const zz = lerp(zig, -zig, f);
        const sag = Math.sin(Math.PI * f) * 0.55;
        const a = p.rail - Y0 + CARGA.hilo, b = p.rail - Y0 + CARGA.mensajero - sag;
        const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, b - a, 4), M.cable);
        pen.position.set(p.x + d.z * (lado + zz), (a + b) / 2, p.z - d.x * (lado + zz));
        GRUPOS.catenaria.add(pen);
      }
    }
  }
}

function construirEstructura() {
  const pkA = 0, pkB = 220;
  // cajón: losa superior, almas y fondo
  const anchoSup = 12.2, anchoInf = 6.4, canto = 2.6;
  const perfilCajon = [
    [-anchoInf / 2, -canto], [anchoInf / 2, -canto], [anchoInf / 2, -canto + 0.35],
    [anchoSup / 2 - 0.4, -0.9], [anchoSup / 2, -0.55], [anchoSup / 2, -0.24],
    [-anchoSup / 2, -0.24], [-anchoSup / 2, -0.55], [-anchoSup / 2 + 0.4, -0.9],
    [-anchoInf / 2, -canto + 0.35],
  ];
  const cajon = extruir(perfilCajon, pkA + 0.5, pkB, 4, true, M.hormigon);
  GRUPOS.estructura.add(registrar(cajon, {
    id: 'EST-CAJ-01', nombre: 'Cajón pretensado del viaducto', sistema: 'estructura', pk: 110, estado: 'ok',
    datos: {
      tipologia: 'Cajón de hormigón pretensado, vanos isostáticos', ancho: '12,20 m', canto: '2,60 m',
      vanos: '5 vanos de 50 m', longitud_viaducto: '2.258 m (completo)', tramo_modelado: '220 m'
    },
    hist: [['2026-04-22', 'Inspección principal (6 años)', 'Fisuración superficial en ala inferior, sin armadura vista.'], ['2026-04-22', 'Ensayo de potencial', 'Sin corrosión activa']]
  }));

  // barandillas
  for (const lado of [-anchoSup / 2 + 0.25, anchoSup / 2 - 0.25]) {
    const bar = extruir([[lado - 0.06, 0.0], [lado + 0.06, 0.0], [lado + 0.06, 1.05], [lado - 0.06, 1.05]], pkA + 0.5, pkB, 6, true, M.acero);
    GRUPOS.estructura.add(bar);
  }

  // pilas
  const pilas = [12, 62, 112, 162, 212];
  pilas.forEach((pk, i) => {
    const { p } = pkAlineacion(pk);
    const terreno = altTerreno(pk);
    const fondo = p.rail - canto;
    const alto = Math.max(2, fondo - terreno);
    const g = new THREE.Group();
    const fuste = new THREE.Mesh(new THREE.BoxGeometry(5.2, alto, 2.6), M.hormigon);
    fuste.position.y = alto / 2; g.add(fuste);
    const capitel = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.9, 4.0), M.hormigon);
    capitel.position.y = alto + 0.45; g.add(capitel);
    const apoyo = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.9), M.acero);
    apoyo.position.y = alto + 1.05; g.add(apoyo);
    g.position.set(p.x, terreno - Y0, p.z);
    GRUPOS.estructura.add(registrar(g, {
      id: `EST-PIL-${String(i + 1).padStart(2, '0')}`, nombre: `Pila ${i + 1} · PK ${fmtPk(pk)}`, sistema: 'estructura',
      pk, estado: i === 2 ? 'warn' : 'ok',
      datos: {
        fuste: '5,20 × 2,60 m', altura: `${alto.toFixed(1)} m`, cimentación: 'Encepado sobre 4 pilotes Ø1,5 m',
        aparatos_apoyo: '4 apoyos elastoméricos', inspeccion: i === 2 ? 'Eflorescencias en fuste' : 'Normal',
      },
      hist: [['2026-10-02', 'Inspección de pilas', i === 2 ? 'Eflorescencias leves, sin pérdida de sección.' : 'Sin defectos. Juntas limpias.']]
    }));
  });

  // estribo
  {
    const { p } = pkAlineacion(0);
    const t = altTerreno(0);
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(13.5, Math.max(3, p.rail - t), 7), M.hormigonOsc);
    cuerpo.position.y = Math.max(3, p.rail - t) / 2; g.add(cuerpo);
    g.position.set(p.x, t - Y0, p.z);
    const { p: p2, d } = pkAlineacion(0);
    g.rotation.y = Math.atan2(d.x, d.z);
    GRUPOS.estructura.add(registrar(g, {
      id: 'EST-EST-01', nombre: 'Estribo oeste', sistema: 'estructura', pk: 0, estado: 'ok',
      datos: { tipo: 'Estribo cerrado', ancho: '13,50 m', cimentación: 'Encepado pilotado', junta: 'Junta de dilatación revisada 2026' },
      hist: [['2026-06-11', 'Revisión de junta', 'Sustituido el perfil de sellado.']]
    }));
  }
}

function altTerreno(pk) {
  const g = S.datos.terreno.puntos.filter(p => p.off === 0).sort((a, b) => a.pk - b.pk);
  if (!g.length) return 580;
  for (let i = 0; i < g.length - 1; i++) {
    if (pk >= g[i].pk && pk <= g[i + 1].pk) {
      const f = (pk - g[i].pk) / (g[i + 1].pk - g[i].pk || 1);
      return g[i].y + (g[i + 1].y - g[i].y) * f;
    }
  }
  return pk < g[0].pk ? g[0].y : g[g.length - 1].y;
}

function construirSenalizacion() {
  [[-152, -1, 'avanzada'], [82, 1, 'salida']].forEach(([pk, lado, tipo], i) => {
    const { p, d } = pkAlineacion(pk);
    const u = lado * (ENTRE_EJES / 2 + 3.4);
    const g = new THREE.Group();
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 4.2, 8), M.acero);
    poste.position.y = 2.1; g.add(poste);
    const caja = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.25, 0.26), M.senal);
    caja.position.y = 4.0; g.add(caja);
    for (let k = 0; k < 3; k++) {
      const luz = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), k === 0 ? M.luzRoja : (k === 2 ? M.luzVerde : M.senal));
      luz.position.set(0, 4.4 - k * 0.36, 0.14); g.add(luz);
    }
    g.position.set(p.x + d.z * u, p.rail - Y0 - 0.2, p.z - d.x * u);
    g.rotation.y = Math.atan2(d.x, d.z);
    GRUPOS.senal.add(registrar(g, {
      id: `SEN-${String(i + 1).padStart(2, '0')}`, nombre: `Señal ${tipo} · PK ${fmtPk(pk)}`, sistema: 'señalización',
      pk, estado: 'ok',
      datos: { tipo: 'Señal luminosa de alta velocidad', aspectos: '3 (rojo, amarillo, verde)', sistema: 'ERTMS nivel 2 · LZB', balizas: '2 balizas ETCS en el tramo' },
      hist: [['2026-03-19', 'Prueba funcional', 'Todos los aspectos correctos.']]
    }));
  });
  // balizas
  [-120, 60].forEach(pk => {
    const { p, d } = pkAlineacion(pk);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), M.senal);
    b.position.set(p.x + d.z * (ENTRE_EJES / 2), p.rail - Y0 - 0.42, p.z - d.x * (ENTRE_EJES / 2));
    GRUPOS.senal.add(registrar(b, {
      id: `BAL-${fmtPk(pk)}`, nombre: `Baliza ETCS · PK ${fmtPk(pk)}`, sistema: 'señalización', pk, estado: 'ok',
      datos: { tipo: 'Eurobaliza', telegrama: 'Verificado', lectura: 'Correcta en la última prueba' }
    }));
  });
}

let trenGrupo = null;
function construirTren() {
  const g = new THREE.Group();
  const largo = 26, alto = 3.6, ancho = 2.9;
  for (let i = 0; i < 5; i++) {
    const coche = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto * 0.8, largo), M.tren);
    cuerpo.position.y = alto * 0.55; coche.add(cuerpo);
    const techo = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.92, alto * 0.2, largo * 0.97), M.trenFranja);
    techo.position.y = alto * 0.98; coche.add(techo);
    const ventana = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.02, 0.9, largo * 0.72), M.trenVentana);
    ventana.position.y = alto * 0.72; coche.add(ventana);
    if (i === 0) {
      const morro = new THREE.Mesh(new THREE.ConeGeometry(ancho * 0.48, 5.2, 12, 1, false, 0, Math.PI * 2), M.tren);
      morro.rotation.x = -Math.PI / 2; morro.position.set(0, alto * 0.55, -largo / 2 - 2.4); coche.add(morro);
      const faro = new THREE.PointLight(0xfff2cc, 0, 90, 2);
      faro.position.set(0, 1.6, -largo / 2 - 4); coche.add(faro); coche.userData.faro = faro;
    }
    coche.position.z = -i * (largo + 1.2);
    g.add(coche);
  }
  g.visible = true;
  GRUPOS.tren.add(g);
  trenGrupo = g;
}

/* ─────────────────────────  cámara / vistas  ───────────────────────── */
let VISTAS = {};
function calcularVistas() {
  const at = pk => { const { p, d } = pkAlineacion(pk); return { x: p.x, y: p.rail - Y0, z: p.z, d }; };
  const a = at(-30), t = at(-150), v = at(110), c = at(-195), s = at(24);
  VISTAS = {
    aerea:    { pos: [a.x - 78, a.y + 48, a.z + 104], tgt: [a.x + 16, a.y - 4, a.z] },
    tramo:    { pos: [t.x - 28, t.y + 11, t.z + 36],  tgt: [t.x + 26, t.y - 1, t.z] },
    viaducto: { pos: [v.x + 38, v.y + 8, v.z + 44],   tgt: [v.x - 6, v.y - 9, v.z] },
    cabina:   { pos: [c.x, c.y + 3.2, c.z - 2.35],    tgt: [c.x + 90 * c.d.x, c.y + 3.0, c.z + 90 * c.d.z] },
    seccion:  { pos: [s.x + 16, s.y + 3.5, s.z + 18], tgt: [s.x, s.y - 3, s.z] },
  };
}
let animCam = null;
function irVista(nombre) {
  const v = VISTAS[nombre] || VISTAS.aerea;
  S.vista = nombre;
  document.querySelectorAll('#vistas button').forEach(b => b.classList.toggle('act', b.dataset.vista === nombre));
  animCam = {
    t: 0, dur: 1.1,
    p0: camara.position.clone(), p1: V3(...v.pos),
    t0: controles.target.clone(), t1: V3(...v.tgt),
  };
}

/* ─────────────────────────  picking  ───────────────────────── */
const ray = new THREE.Raycaster();
const puntero = new THREE.Vector2();
let destacado = null;

function seleccionar(activo, mesh) {
  S.seleccion = activo;
  if (destacado && destacado.material) {
    if (destacado.userData._matOriginal) destacado.material = destacado.userData._matOriginal;
    destacado = null;
  }
  if (mesh && mesh.isMesh) {
    const orig = mesh.material;
    mesh.userData._matOriginal = orig;
    const clon = orig.clone();
    clon.emissive = new THREE.Color(0x2f6fd0);
    clon.emissiveIntensity = 0.55;
    mesh.material = clon;
    destacado = mesh;
  }
  pintarFicha(activo);
  marcarSeleccion(activo);
  document.querySelectorAll('#inventario .fila').forEach(f => f.classList.toggle('sel', f.dataset.id === activo.id));
}

CV.addEventListener('pointerdown', ev => {
  const r = CV.getBoundingClientRect();
  puntero.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  puntero.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(puntero, camara);
  const hits = ray.intersectObjects(scene.children, true);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.activo) o = o.parent;
    if (o && o.userData.activo) { seleccionar(o.userData.activo, o.isMesh ? o : null); return; }
  }
});

/* ─────────────────────────  paneles  ───────────────────────── */
const fmtPk = pk0 => {
  const r = Math.round(pk0), neg = r < 0, a = Math.abs(r);
  return `${neg ? '-' : ''}${Math.floor(a / 1000)}+${String(a % 1000).padStart(3, '0')}`;
};
const ESTADOS = { ok: ['p-ok', 'correcto'], warn: ['p-warn', 'vigilar'], bad: ['p-bad', 'fuera de tolerancia'] };

function pintarFicha(a) {
  document.getElementById('sel-vacio').style.display = 'none';
  document.getElementById('sel-ficha').style.display = 'block';
  document.getElementById('sel-nombre').textContent = a.nombre;
  document.getElementById('sel-id').textContent = `${a.id} · ${a.sistema}`;
  document.getElementById('sel-punto').className = 'punto ' + (ESTADOS[a.estado] || ESTADOS.ok)[0];
  const dl = document.getElementById('sel-dl');
  dl.innerHTML = '';
  const filas = [['PK', fmtPk(a.pk)], ['estado', (ESTADOS[a.estado] || ESTADOS.ok)[1]],
    ...Object.entries(a.datos || {}).map(([k, v]) => [k.replace(/_/g, ' '), v])];
  for (const [k, v] of filas) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  }
  const h = document.getElementById('sel-hist');
  h.innerHTML = '';
  (a.hist || [['—', 'Sin historial registrado', '']]).forEach(([f, t, d]) => {
    const div = document.createElement('div');
    div.innerHTML = `<div class="f">${f}</div><div class="t">${t}</div><div class="d">${d || ''}</div>`;
    h.append(div);
  });
  const sel = document.getElementById('seleccion');
  sel.style.display = 'block';
  sel.textContent = `${a.id} · ${a.nombre}`;
  // enfocar
  const { p } = pkAlineacion(a.pk);
  animCam = { t: 0, dur: 0.9, p0: camara.position.clone(), p1: V3(p.x + 26, p.rail - Y0 + 16, p.z + 34), t0: controles.target.clone(), t1: V3(p.x, p.rail - Y0, p.z) };
}

function pintarInventario() {
  const caja = document.getElementById('inventario');
  const orden = { estructura: 0, vía: 1, catenaria: 2, señalización: 3, terreno: 4 };
  const lista = [...S.activos].sort((a, b) => (orden[a.sistema] ?? 9) - (orden[b.sistema] ?? 9) || a.pk - b.pk).slice(0, 40);
  caja.innerHTML = '';
  for (const a of lista) {
    const f = document.createElement('div');
    f.className = 'fila'; f.dataset.id = a.id;
    f.innerHTML = `<span class="id">${a.id}</span><span>${a.nombre}</span><span class="punto ${(ESTADOS[a.estado] || ESTADOS.ok)[0]}"></span>`;
    f.onclick = () => seleccionar(a, null);
    caja.append(f);
  }
}

function pintarGestion() {
  const kpis = [
    ['1.435', 'ancho de vía (mm)', 'ok'],
    ['5,30 m', 'hilo de contacto', 'ok'],
    ['±200 mm', 'zigzag de catenaria', 'ok'],
    ['20 ‰', 'pendiente de rasante', 'ok'],
    ['5', 'pilas en el tramo', 'ok'],
    ['0,9 %', 'desplome máx. de poste', 'warn'],
  ];
  document.getElementById('kpis').innerHTML = kpis
    .map(([v, l, c]) => `<div class="kpi ${c}"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');

  const plan = [
    ['2026-11-18', 'Inspección de catenaria · ciclo semestral', 'Postes 1–9, péndolas y tensión del hilo. Incluye el poste con 0,9 % de desplome.', 'programado'],
    ['2026-12-02', 'Auscultación geométrica de vía', 'Medición de ancho y alineación en los 420 m con trocha móvil.', 'programado'],
    ['2027-01-15', 'Inspección principal del cajón', 'Fisuración, carbonatación y aparatos de apoyo en los 5 vanos.', 'planificado'],
    ['2027-02-10', 'Limpieza de drenaje y bajantes', 'Cunetas de la trinchera y desagües del tablero.', 'planificado'],
  ];
  document.getElementById('plan').innerHTML = plan.map(([f, t, d, e]) =>
    `<div class="plan"><div class="f">${f} · ${e}</div><div class="t">${t}</div><div class="d">${d}</div></div>`).join('');
}

function pintarDatos() {
  const m = S.datos.meta;
  const f = document.getElementById('datos-ficha');
  f.innerHTML = `
    <dt>línea</dt><dd>LAV Madrid–Barcelona</dd>
    <dt>viaducto</dt><dd>${m.viaducto}</dd>
    <dt>PK modelo</dt><dd>${fmtPk(S.datos.rango.pk_min)} → ${fmtPk(S.datos.rango.pk_max)}</dd>
    <dt>origen</dt><dd>${m.ubicacion.lat.toFixed(6)}, ${m.ubicacion.lon.toFixed(6)}</dd>
    <dt>velocidad</dt><dd>${m.velocidad_max_kmh} km/h</dd>
    <dt>ancho</dt><dd>${m.ancho_mm} mm</dd>`;
  document.getElementById('datos-composicion').innerHTML = `
    <div class="plan"><div class="f">superestructura</div><div class="t">2 vías en placa · 4 carriles UIC60</div><div class="d">${Math.round(420 / 0.65) * 4} sujeciones · placa de 3,40 m</div></div>
    <div class="plan"><div class="f">catenaria</div><div class="t">9 postes · 16 vanos de hilo</div><div class="d">contacto 5,30 m · mensajero 6,60 m · péndolas cada 5 m</div></div>
    <div class="plan"><div class="f">estructura</div><div class="t">cajón 12,20 m · 5 pilas · estribo</div><div class="d">vanos de 50 m · canto 2,60 m</div></div>
    <div class="plan"><div class="f">fuentes</div><div class="t">OSM + EU-DEM</div><div class="d">${m.fuentes.map(x => x.fuente).join(' · ')}</div></div>`;
}


/* ─────────────────────────  mediciones y presupuesto  ───────────────────────── */
const PRECIOS = {
  carril: 95, sujecion: 28, placa: 130, posteCat: 2400, hiloCat: 18, pendola: 22,
  hormigonCajon: 320, hormigonPila: 260, aceroPret: 2.1, estribo: 240,
  senal: 18000, baliza: 6000,
};

function calcularMediciones() {
  const L = S.datos.rango.pk_max - S.datos.rango.pk_min;
  const pilas = [12, 62, 112, 162, 212].map(pk => {
    const { p } = pkAlineacion(pk);
    const alto = Math.max(2, (p.rail - 2.6) - altTerreno(pk));
    return { pk, alto };
  });
  const volPilas = pilas.reduce((a, x) => a + 5.2 * 2.6 * x.alto, 0);
  const anchoSup = 12.2, anchoInf = 6.4, canto = 2.6;
  const perfil = [[-anchoInf / 2, -canto], [anchoInf / 2, -canto], [anchoInf / 2, -canto + 0.35],
    [anchoSup / 2 - 0.4, -0.9], [anchoSup / 2, -0.55], [anchoSup / 2, -0.24], [-anchoSup / 2, -0.24],
    [-anchoSup / 2, -0.55], [-anchoSup / 2 + 0.4, -0.9], [-anchoInf / 2, -canto + 0.35]];
  let A = 0;
  for (let i = 0; i < perfil.length; i++) {
    const [x1, y1] = perfil[i], [x2, y2] = perfil[(i + 1) % perfil.length];
    A += x1 * y2 - x2 * y1;
  }
  A = Math.abs(A) / 2;
  const volCajon = A * 220;
  const altoEstribo = Math.max(3, pkAlineacion(0).p.rail - altTerreno(0));
  const volEstribo = 13.5 * altoEstribo * 7;

  const filas = [
    ['01', 'Estructura', 'Hormigón HA-50 en cajón (220 m)', 'm³', volCajon, PRECIOS.hormigonCajon],
    ['01', 'Estructura', 'Acero pretensado (110 kg/m³)', 't', volCajon * 0.11, PRECIOS.aceroPret * 1000],
    ['01', 'Estructura', 'Hormigón en pilas (5 ud)', 'm³', volPilas, PRECIOS.hormigonPila],
    ['01', 'Estructura', 'Hormigón en estribo', 'm³', volEstribo, PRECIOS.estribo],
    ['02', 'Vía', 'Carril UIC60 (4 hilos)', 'm', 4 * L, PRECIOS.carril],
    ['02', 'Vía', 'Sujeción elástica', 'ud', Math.floor(L / 0.65) * 4, PRECIOS.sujecion],
    ['02', 'Vía', 'Vía en placa (2 vías)', 'm²', 2 * L * 3.4, PRECIOS.placa],
    ['03', 'Catenaria', 'Poste con brazo', 'ud', 9, PRECIOS.posteCat],
    ['03', 'Catenaria', 'Hilo de contacto y mensajero', 'm', 2 * L * 2, PRECIOS.hiloCat],
    ['03', 'Catenaria', 'Péndola', 'ud', 144, PRECIOS.pendola],
    ['04', 'Señalización', 'Señal luminosa', 'ud', 2, PRECIOS.senal],
    ['04', 'Señalización', 'Baliza ETCS', 'ud', 2, PRECIOS.baliza],
  ].map(([cap, sistema, desc, ud, cant, precio]) => ({ cap, sistema, desc, ud, cant, precio, importe: cant * precio }));

  return { L, pilas, volCajon, volPilas, volEstribo, filas, total: filas.reduce((a, f) => a + f.importe, 0) };
}

let MED = null;
const eur = n => n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';

function pintarPresupuesto() {
  MED = calcularMediciones();
  document.getElementById('coste-total').textContent = eur(MED.total);
  const caps = {};
  MED.filas.forEach(f => caps[f.cap] = (caps[f.cap] || 0) + f.importe);
  const caja = document.getElementById('presupuesto');
  caja.innerHTML = '';
  for (const [cap, importe] of Object.entries(caps)) {
    const nom = { '01': 'Estructura', '02': 'Vía', '03': 'Catenaria', '04': 'Señalización' }[cap];
    const fila = document.createElement('div');
    fila.className = 'fila';
    fila.innerHTML = `<span class="id">${cap}</span><span>${nom}</span><span>${eur(importe)}</span>`;
    fila.onclick = () => {
      const det = MED.filas.filter(f => f.cap === cap)
        .map(f => `· ${f.desc}: ${f.cant.toFixed(1)} ${f.ud} × ${f.precio} € = ${eur(f.importe)}`).join('\n');
      document.getElementById('asis-out').innerHTML = `<b>${nom}</b><br><span style="white-space:pre-line">${det}</span>`;
    };
    caja.append(fila);
  }
}

function descargar(nombre, texto, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff' + texto], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function exportarCSV() {
  const cab = 'capitulo;sistema;descripcion;ud;cantidad;precio_unitario;importe\n';
  const filas = MED.filas.map(f => [f.cap, f.sistema, f.desc, f.ud, f.cant.toFixed(2).replace('.', ','), String(f.precio).replace('.', ','), f.importe.toFixed(2).replace('.', ',')].join(';'));
  descargar('mediciones-ferrovia-twin.csv', cab + filas.join('\n') + `\n;;TOTAL;;;${MED.total.toFixed(2)}\n`);
}

function exportarJSON() {
  descargar('activos-ferrovia-twin.json', JSON.stringify({
    tramo: S.datos.meta, rango: S.datos.rango, activos: S.activos,
    mediciones: MED.filas, total: MED.total,
  }, null, 2), 'application/json');
}

/* asistente determinista sobre el modelo */
function responder(pregunta) {
  const q = (pregunta || '').toLowerCase();
  const L = S.datos.rango.pk_max - S.datos.rango.pk_min;
  if (/presupuest|coste|cu[aá]nto cuesta|dinero/.test(q)) {
    return `<b>${eur(MED.total)}</b> de ejecución estimada para los ${Math.round(L)} m modelados. ` +
      `Capítulos: estructura ${eur(MED.filas.filter(f => f.cap === '01').reduce((a, f) => a + f.importe, 0))}, ` +
      `vía ${eur(MED.filas.filter(f => f.cap === '02').reduce((a, f) => a + f.importe, 0))}, ` +
      `catenaria ${eur(MED.filas.filter(f => f.cap === '03').reduce((a, f) => a + f.importe, 0))}. ` +
      `Pulsa un capítulo para ver el desglose.`;
  }
  if (/pila/.test(q)) {
    const h = MED.pilas.map(p => `${p.alto.toFixed(1)} m`).join(' · ');
    return `<b>5 pilas</b> en este tramo, con alturas ${h}. Volumen total de hormigón en fustes: ${MED.volPilas.toFixed(0)} m³. La más alta es la del PK ${fmtPk(MED.pilas.reduce((a, b) => b.alto > a.alto ? b : a).pk)}.`;
  }
  if (/catenaria|poste|hilo/.test(q)) {
    return `<b>9 postes</b> cada 50 m alternando lado, hilo de contacto a 5,30 m con zigzag de ±200 mm, mensajero a 6,60 m y péndolas cada 5 m. Longitud de hilo equivalente: ${(2 * L * 2).toFixed(0)} m.`;
  }
  if (/g[aá]libo|g[áa]libo/.test(q)) {
    return `El modelo sitúa el hilo de contacto a <b>5,30 m</b> sobre la rasante y el mensajero a 6,60 m. El gálibo real se comprueba con la nube LiDAR (capa 3): aquí solo hay proyecto, no medida.`;
  }
  if (/pk|d[oó]nde/.test(q)) {
    const m = q.match(/(-?\d+)\s*\+\s*(\d+)/);
    if (m) {
      const pk = parseInt(m[1]) * 1000 + (m[1].startsWith('-') ? -parseInt(m[2]) : parseInt(m[2]));
      const a = S.activos.filter(x => Math.abs(x.pk - pk) <= 30).slice(0, 4);
      return `En el entorno del PK ${fmtPk(pk)}: ` + (a.length ? a.map(x => `${x.id} (${x.nombre})`).join(', ') : 'sin activos registrados en 30 m a la redonda.');
    }
  }
  if (/tren|circulaci/.test(q)) return 'Velocidad de diseño 300 km/h, doble vía, ERTMS nivel 2. El tren del visor circula a una velocidad visual reducida para poder verlo pasar.';
  return 'Puedo responder sobre <b>presupuesto</b>, <b>pilas</b>, <b>catenaria</b>, <b>gálibo</b>, <b>PK</b> concretos y <b>tren</b>. Prueba con una de esas palabras.';
}

/* ─────────────────────────  UI  ───────────────────────── */
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('act', x === b));
  document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('act', p.id === 'tab-' + b.dataset.tab));
});
document.querySelectorAll('#vistas button').forEach(b => b.onclick = () => irVista(b.dataset.vista));
document.querySelectorAll('#capas input').forEach(inp => inp.onchange = () => {
  const capa = inp.dataset.capa;
  const on = inp.checked;
  inp.closest('.capa').classList.toggle('on', on);
  if (GRUPOS[capa]) GRUPOS[capa].visible = on;
});


function activarTab(nombre) {
  const b = document.querySelector(`.tabs button[data-tab="${nombre}"]`);
  if (b) b.click();
}
function conectarCoste() {
  document.getElementById('btn-csv').onclick = exportarCSV;
  document.getElementById('btn-json').onclick = exportarJSON;
  const inp = document.getElementById('asis-in'), out = document.getElementById('asis-out');
  const enviar = () => { out.innerHTML = responder(inp.value); inp.value = ''; };
  document.getElementById('asis-btn').onclick = enviar;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
  document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { out.innerHTML = responder(b.dataset.q); });
  out.innerHTML = 'Pregúntame por el modelo: <b>presupuesto</b>, <b>pilas</b>, <b>catenaria</b>, <b>gálibo</b> o un <b>PK</b> concreto.';
}

/* ─────────────────────────  bucle  ───────────────────────── */
const reloj = new THREE.Clock();
let trenPk = 40;

function resize() {
  const w = ESC.clientWidth, h = ESC.clientHeight;
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
}
addEventListener('resize', resize);

function actualizarEscala() {
  const dist = camara.position.distanceTo(controles.target);
  const m = Math.pow(10, Math.round(Math.log10(dist / 4)));
  const px = (m / (dist * Math.tan((camara.fov * Math.PI) / 360))) * ESC.clientHeight / 2;
  document.getElementById('esc-txt').textContent = m >= 1000 ? `${m / 1000} km` : `${m} m`;
  document.getElementById('esc-barra').style.width = `${Math.max(20, Math.min(200, px))}px`;
}

function animar() {
  requestAnimationFrame(animar);
  const dt = Math.min(0.05, reloj.getDelta());
  if (animCam) {
    animCam.t += dt;
    const f = Math.min(1, animCam.t / animCam.dur);
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    camara.position.lerpVectors(animCam.p0, animCam.p1, e);
    controles.target.lerpVectors(animCam.t0, animCam.t1, e);
    if (f >= 1) animCam = null;
  }
  controles.update();

  if (GRUPOS.tren.visible && trenGrupo) {
    trenPk += dt * 55;                       // ~200 km/h visuales
    if (trenPk > 220) trenPk = -200;
    const { p, d } = pkAlineacion(trenPk);
    trenGrupo.position.set(p.x + d.z * (ENTRE_EJES / 2), p.rail - Y0, p.z - d.x * (ENTRE_EJES / 2));
    trenGrupo.rotation.y = Math.atan2(d.x, d.z);
    trenGrupo.children.forEach(c => { if (c.userData.faro) c.userData.faro.intensity = S.noche ? 60 : 0; });
  }

  // HUD de PK: punto del eje más cercano a la cámara
  let mejor = null, dm = 1e9;
  for (const e of S.eje) {
    const d2 = (e.x - camara.position.x) ** 2 + (e.z - camara.position.z) ** 2;
    if (d2 < dm) { dm = d2; mejor = e; }
  }
  if (mejor) {
    document.getElementById('pk-val').textContent = fmtPk(mejor.pk);
    document.getElementById('pk-cota').textContent = mejor.rail.toFixed(2).replace('.', ',');
    document.getElementById('pk-info').textContent =
      mejor.pk < 0 ? 'trinchera y terraplén · vía en placa' :
      mejor.pk <= 220 ? 'viaducto sobre el Jalón · cajón pretensado' : 'salida del tramo modelado';
  }
  actualizarEscala();
  renderer.render(scene, camara);
}

/* ─────────────────────────  arranque  ───────────────────────── */
async function init() {
  const r = await fetch('./datos/tramo.json', { cache: 'no-store' });
  S.datos = await r.json();
  S.eje = S.datos.eje;
  document.getElementById('b-long').textContent = `${Math.round(S.datos.rango.pk_max - S.datos.rango.pk_min)} m modelados`;

  construirTerreno();
  construirVia();
  construirCatenaria();
  construirEstructura();
  construirSenalizacion();
  construirHitos();
  construirTren();
  pintarInventario();
  pintarGestion();
  pintarDatos();
  pintarPresupuesto();
  conectarCoste();

  calcularVistas();
  resize();
  camara.position.set(...VISTAS.aerea.pos);
  controles.target.set(...VISTAS.aerea.tgt);
  controles.update();
  irVista('aerea');
  animCam = null;                       // sin transición en el arranque
  renderer.render(scene, camara);       // primer frame sin depender de rAF
  animar();



  // selección inicial: estribo
  const ini = S.activos.find(a => a.id === 'EST-EST-01');
  if (ini) seleccionar(ini, null);

  // deep link: ?tab=coste&vista=viaducto
  const qs = new URLSearchParams(location.search);
  if (qs.get('tab')) activarTab(qs.get('tab'));
  if (qs.get('vista') && VISTAS[qs.get('vista')]) irVista(qs.get('vista'));
}
init();
