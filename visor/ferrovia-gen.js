/* ferrovia-gen.js — generadores paramétricos three.js para la BD ferroviaria
   Cada función recibe (params, materiales) y devuelve un THREE.Group.
   Los 594 objetos de objetos.json se resuelven por su campo `gen`. */
import * as THREE from 'three';

/* ---------- materiales compartidos ---------- */
export const MATS = {
  acero:  () => new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.45, metalness: 0.75 }),
  oscuro: () => new THREE.MeshStandardMaterial({ color: 0x4a525c, roughness: 0.6,  metalness: 0.4 }),
  hormigon: () => new THREE.MeshStandardMaterial({ color: 0xb8b2a7, roughness: 0.95, metalness: 0.0 }),
  hormigonOscuro: () => new THREE.MeshStandardMaterial({ color: 0x8e887d, roughness: 0.9, metalness: 0.05 }),
  balasto: () => new THREE.MeshStandardMaterial({ color: 0x6f6a60, roughness: 1.0, metalness: 0.0 }),
  tierra: () => new THREE.MeshStandardMaterial({ color: 0x7a6a52, roughness: 1.0 }),
  verde: () => new THREE.MeshStandardMaterial({ color: 0x4a7c46, roughness: 0.95 }),
  blanco: () => new THREE.MeshStandardMaterial({ color: 0xe4e4e4, roughness: 0.4 }),
  rojo: () => new THREE.MeshStandardMaterial({ color: 0xd94f3d, roughness: 0.5 }),
  amarillo: () => new THREE.MeshStandardMaterial({ color: 0xe8b93d, roughness: 0.5 }),
  azul: () => new THREE.MeshStandardMaterial({ color: 0x4c8dff, roughness: 0.4 }),
  agua: () => new THREE.MeshStandardMaterial({ color: 0x3f7fae, roughness: 0.15, metalness: 0.3 }),
  tubo: () => new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.55, metalness: 0.35 }),
};

/* ---------- utilidades ---------- */
function caja(w, h, d, mat, x=0, y=0, z=0, g){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); g.add(m); return m;
}
function cil(r1, r2, h, mat, x=0, y=0, z=0, g, seg=12){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  m.position.set(x, y, z); g.add(m); return m;
}
function tuboPuntos(pts, radio, mat, g, seg=6){
  const curva = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(12, pts.length*2), radio, seg), mat);
  g.add(m); return m;
}

/* ============ GENERADORES ============ */
const GEN = {};

/* --- vía --- */
GEN.carril = (p) => {
  const g = new THREE.Group();
  const m = MATS.acero();
  const a = p.anchoCabeza || 0.072, e = p.altura || 0.172, pata = p.pata || 0.015;
  // perfil T invertido aproximado: cabeza + alma + pata
  caja(a, 0.045, 25, m, 0, e - 0.022, 0, g);            // cabeza
  caja(0.018, e - 0.09, 25, m, 0, e/2 - 0.02, 0, g);    // alma
  caja(0.15, 0.045, 25, m, 0, 0.022, 0, g);             // pata
  return g;
};
GEN.sabata = (p) => {
  const g = new THREE.Group();
  caja(0.22, 0.02, 0.5, MATS.oscuro(), 0, 0.01, 0, g);
  return g;
};
GEN.traviesa = (p) => {
  const g = new THREE.Group();
  const m = p.material && p.material.includes('madera') ? MATS.tierra() : MATS.hormigon();
  caja(p.lx || 2.6, p.ly || 0.21, p.lz || 0.30, m, 0, p.ly ? p.ly/2 : 0.105, 0, g);
  return g;
};
GEN.tendido = (p) => {
  const g = new THREE.Group();
  const sep = p.sep || 0.6, n = Math.min(40, Math.floor(24 / sep));
  const mat = MATS.hormigon();
  for (let i = 0; i < n; i++)
    caja(2.6, 0.21, 0.30, mat, 0, 0.105, -n*sep/2 + i*sep, g);
  // carriles encima
  for (const sx of [-0.7175, 0.7175]){
    caja(0.072, 0.045, n*sep, MATS.acero(), sx, 0.24, 0, g);
    caja(0.15, 0.045, n*sep, MATS.acero(), sx, 0.02, 0, g);
  }
  return g;
};
GEN.sujecion = (p) => {
  const g = new THREE.Group();
  caja(0.16, 0.018, 0.14, MATS.oscuro(), 0, 0.01, 0, g);        // placa
  for (const dx of [-0.055, 0.055]){
    const clip = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 6, 12, Math.PI), MATS.acero());
    clip.rotation.set(Math.PI, 0, 0);
    clip.position.set(dx, 0.018, 0);
    g.add(clip);
  }
  return g;
};
GEN.aparato = (p) => {
  const g = new THREE.Group();
  // agujas simplificadas: dos carriles divergiendo + traviesas progresivas
  for (let i = 0; i < 20; i++){
    caja(2.6 + i*0.15, 0.21, 0.30, MATS.hormigon(), i*0.1, 0.105, 0, g);
  }
  for (const [sx, ang] of [[-0.7175, 0], [0.7175, 0.06]]){
    const r = caja(0.072, 0.172, 14, MATS.acero(), sx, 0.24, 0, g);
    r.rotation.y = ang;
  }
  return g;
};

/* --- infraestructura --- */
GEN.capa = (p) => {
  const g = new THREE.Group();
  const m = p.capa && p.capa.includes('balasto') ? MATS.balasto() : MATS.hormigonOscuro();
  caja(9, p.espesor || 0.3, 24, m, 0, (p.espesor || 0.3)/2, 0, g);
  return g;
};
GEN.perfil = (p) => {
  const g = new THREE.Group();
  // perfil en sección transversal: terraplén o desmonte con taludes
  const forma = p.forma || '';
  const h = 4, anchoBase = 30;
  const m = forma.includes('desmonte') ? MATS.tierra() : MATS.tierra();
  const shape = new THREE.Shape();
  shape.moveTo(-anchoBase/2, 0);
  shape.lineTo(-2, h);
  shape.lineTo(2, h);
  shape.lineTo(anchoBase/2, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 24, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, m);
  mesh.rotation.y = Math.PI/2;
  mesh.position.set(0, 0, -12);
  g.add(mesh);
  return g;
};
GEN.berma = (p) => {
  const g = new THREE.Group();
  caja(p.ancho || 3, 0.1, 24, MATS.tierra(), 0, 0.05, 0, g);
  return g;
};
GEN.cuneta = (p) => {
  const g = new THREE.Group();
  const m = MATS.hormigonOscuro();
  for (const dx of [-0.4, 0.4])
    caja(0.06, 0.35, 24, m, dx, 0.17, 0, g);
  caja(0.85, 0.06, 24, m, 0, 0.03, 0, g);
  return g;
};

/* --- hidráulica --- */
GEN.hidraulica = (p) => {
  const g = new THREE.Group();
  const d = p.diametro || 0.6;
  if ((p.tipo || '').includes('Bajante') || (p.tipo || '').includes('Hidroductor')){
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(d/2, d/2, 20, 16), MATS.hormigonOscuro());
    tubo.rotation.x = Math.PI/2;
    tubo.position.y = d/2;
    g.add(tubo);
  } else if ((p.tipo || '').includes('Bóveda')){
    const arco = new THREE.Mesh(new THREE.CylinderGeometry(d/2, d/2, 20, 16, 1, true), MATS.hormigon());
    arco.rotation.x = Math.PI/2;
    g.add(arco);
  } else if ((p.tipo || '').includes('Arqueta')){
    caja(1.2, 1.2, 1.2, MATS.hormigon(), 0, 0.6, 0, g);
  } else if ((p.tipo || '').includes('Canal') || (p.tipo || '').includes('Cuneta')){
    for (const dx of [-d/2, d/2]) caja(0.08, 0.5, 20, MATS.hormigon(), dx, 0.25, 0, g);
    caja(d, 0.06, 20, MATS.hormigon(), 0, 0.03, 0, g);
  } else if ((p.tipo || '').includes('Escollera') || (p.tipo || '').includes('Dique')){
    // piedras apiladas
    for (let i = 0; i < 24; i++){
      const r = 0.15 + Math.random()*0.12;
      const piedra = new THREE.Mesh(new THREE.DodecahedronGeometry(r), MATS.hormigonOscuro());
      piedra.position.set((Math.random()-0.5)*2, r, (Math.random()-0.5)*20);
      g.add(piedra);
    }
  } else if ((p.tipo || '').includes('Disipador')){
    caja(d*1.5, d*0.4, d*1.5, MATS.hormigon(), 0, d*0.2, 0, g);
  } else if ((p.tipo || '').includes('Talud') || (p.tipo || '').includes('hidrosiembra')){
    const m = (p.tipo || '').includes('hidrosiembra') ? MATS.verde() : MATS.tierra();
    caja(4, 0.15, 20, m, 0, 0.075, 0, g);
  } else {
    // genérico: caja con tubo
    caja(1, 0.6, 1, MATS.hormigon(), 0, 0.3, 0, g);
  }
  return g;
};
GEN.dren = (p) => {
  const g = new THREE.Group();
  const zanja = caja(0.5, 1.0, 20, MATS.hormigonOscuro(), 0, -0.5, 0, g);
  zanja.visible = false;
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 20, 10), MATS.tubo());
  tubo.rotation.x = Math.PI/2; tubo.position.y = -0.2;
  g.add(tubo);
  const grava = caja(0.45, 0.3, 20, MATS.balasto(), 0, -0.15, 0, g);
  return g;
};

/* --- obras de fábrica --- */
GEN['puente-viga-artesa'] = GEN['puente-viga'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 20;
  const artesa = caja(vano, 0.9, 4.5, MATS.hormigon(), 0, 2.5, 0, g);
  // dos vigas laterales
  for (const dz of [-1.8, 1.8]) caja(vano, 1.4, 0.5, MATS.hormigon(), 0, 2.2, dz, g);
  // vía encima
  caja(vano, 0.35, 2.6, MATS.balasto(), 0, 3.4, 0, g);
  return g;
};
GEN['puente-losa'] = GEN['puente-losa-aligerada'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 12;
  caja(vano, 0.7, 5, MATS.hormigon(), 0, 2.6, 0, g);
  caja(vano, 0.35, 2.6, MATS.balasto(), 0, 3.3, 0, g);
  return g;
};
GEN['puente-cajon'] = GEN['puente-cajon-alto'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 50, h = p.tipologia === 'cajon-alto' ? 20 : 8;
  // pila
  caja(3, h, 2.5, MATS.hormigon(), 0, h/2, 0, g);
  // cajón
  caja(vano, 1.8, 4.5, MATS.hormigon(), 0, h + 1.2, 0, g);
  caja(vano, 0.35, 2.6, MATS.balasto(), 0, h + 2.4, 0, g);
  return g;
};
GEN['puente-arco'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 60;
  const curva = [];
  for (let i = 0; i <= 20; i++){
    const t = i/20;
    curva.push(new THREE.Vector3(-vano/2 + t*vano, 3 + Math.sin(t*Math.PI)*vano*0.25, 0));
  }
  tuboPuntos(curva, 0.5, MATS.hormigon(), g, 12);
  caja(vano, 0.4, 4, MATS.hormigon(), 0, 3 + vano*0.25 + 1.2, 0, g);
  return g;
};
GEN['puente-celosia'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 40;
  for (const dz of [-2.2, 2.2]){
    for (let i = 0; i < vano/2; i++){
      const diag = caja(0.08, 0.08, 2.3, MATS.acero(), -vano/2 + i*2 + 1, 4.2, dz, g);
      diag.rotation.x = i % 2 ? 0.8 : -0.8;
    }
    caja(vano, 0.15, 0.15, MATS.acero(), 0, 3.2, dz, g);
    caja(vano, 0.15, 0.15, MATS.acero(), 0, 5.2, dz, g);
  }
  caja(vano, 0.35, 2.6, MATS.balasto(), 0, 3.5, 0, g);
  return g;
};
GEN['puente-pasarela'] = GEN['puente-pasarela-U'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 20;
  caja(vano, 0.25, 2, MATS.hormigon(), 0, 4.5, 0, g);
  for (const dz of [-0.95, 0.95]) caja(vano, 1.1, 0.06, MATS.acero(), 0, 5.1, dz, g);
  return g;
};
GEN['puente-ps-losa'] = GEN['puente-ps-viga'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 15;
  caja(4.5, 0.8, vano, MATS.hormigon(), -6, 5.8, 0, g);   // tablero sobre la vía
  for (const dz of [-vano/2, vano/2]) caja(4.5, 0.9, 0.5, MATS.hormigon(), -6, 5.2, dz, g);
  return g;
};
GEN['puente-pi-boveda'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 8;
  const arco = new THREE.Mesh(new THREE.CylinderGeometry(vano/2 + 1, vano/2 + 1, 4.5, 20, 1, true, 0, Math.PI), MATS.hormigon());
  arco.rotation.set(0, 0, 0); arco.rotation.y = Math.PI/2;
  arco.position.y = 0;
  g.add(arco);
  return g;
};
GEN['puente-pi-marco'] = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 10;
  caja(0.5, 5, 4.5, MATS.hormigon(), -vano/2, 2.5, 0, g);
  caja(0.5, 5, 4.5, MATS.hormigon(), vano/2, 2.5, 0, g);
  caja(vano + 0.5, 0.6, 4.5, MATS.hormigon(), 0, 5.2, 0, g);
  return g;
};
GEN['pila-H'] = (p) => {
  const g = new THREE.Group();
  const h = p.altura || 8;
  for (const dx of [-1.2, 1.2]) caja(1, h, 1.4, MATS.hormigon(), dx, h/2, 0, g);
  caja(3.4, 0.8, 1.6, MATS.hormigon(), 0, h - 0.4, 0, g);   // dintel superior
  return g;
};
GEN['pila-fusto'] = (p) => {
  const g = new THREE.Group();
  const h = p.altura || 8;
  cil(0.9, 1.4, h, MATS.hormigon(), 0, h/2, 0, g, 16);
  return g;
};
GEN.estribo = (p) => {
  const g = new THREE.Group();
  caja(3, 4, p.lon || 10, MATS.hormigon(), 0, 2, 0, g);
  return g;
};
GEN.muro = (p) => {
  const g = new THREE.Group();
  caja(0.5, 3.5, 20, MATS.hormigon(), 0, 1.75, 0, g);
  if ((p.tipo || '').includes('gabion') || (p.tipo || '').includes('escollera'))
    for (let i = 0; i < 10; i++) caja(0.8, 0.5, 1, MATS.hormigonOscuro(), (Math.random()-0.5)*0.2, 0.25 + Math.floor(i/5)*0.5, -9 + (i%10)*2, g);
  return g;
};

/* --- catenaria --- */
GEN.portico = (p) => {
  const g = new THREE.Group();
  const vano = p.vano || 50;
  const m = (p.fam || '').includes('celosía') ? MATS.oscuro() : MATS.acero();
  const hPoste = 6.6;
  // 2 postes
  for (const dz of [-vano/2, vano/2]){
    if ((p.fam || '').includes('celosía')){
      for (const dx of [-0.17, 0.17])
        cil(0.04, 0.06, hPoste, m, dx, hPoste/2, dz, g, 6);
      for (let s = 0; s < 8; s++){
        const d = caja(0.36, 0.03, 0.03, m, 0, s*hPoste/8 + hPoste/16, dz, g);
        d.rotation.z = s % 2 ? 0.6 : -0.6;
      }
    } else {
      const ipn = caja(0.3, hPoste, 0.14, m, 0, hPoste/2, dz, g);
    }
  }
  // travesaño
  caja(0.14, 0.14, vano, m, 0, hPoste - 0.2, 0, g);
  // registro al hilo
  const reg = caja(0.08, 1.2, 0.08, m, -1, hPoste - 0.8, 0, g);
  return g;
};
GEN.poste = (p) => {
  const g = new THREE.Group();
  const h = p.altura || 6.5;
  const m = MATS.acero();
  cil(0.09, 0.13, h, m, 0, h/2, 0, g, 10);
  return g;
};
GEN.vaina = (p) => {
  const g = new THREE.Group();
  const L = 50;
  // hilo de contacto con zigzag
  const contact = [];
  for (let i = 0; i <= 24; i++){
    const t = i/24;
    contact.push(new THREE.Vector3(-1 + Math.sin(t*4)*0.35, 5.35, -L/2 + t*L));
  }
  tuboPuntos(contact, 0.02, MATS.acero(), g, 5);
  // mensajero con flecha
  const mens = [];
  for (let i = 0; i <= 24; i++){
    const t = i/24;
    mens.push(new THREE.Vector3(-2.3 + t*1.3, 6.45 - Math.sin(t*Math.PI)*p.flecha, -L/2 + t*L));
  }
  tuboPuntos(mens, 0.018, MATS.acero(), g, 5);
  // péndolas
  const mPen = MATS.acero();
  for (let t = 0.2; t < 1; t += 0.2){
    const z = -L/2 + L*t, yM = 6.45 - Math.sin(t*Math.PI)*(p.flecha || 0.7);
    const pen = cil(0.012, 0.012, yM - 5.35, mPen, -2.3 + t*1.3, (5.35 + yM)/2, z, g, 4);
  }
  return g;
};
GEN.pendola = (p) => {
  const g = new THREE.Group();
  cil(0.012, 0.012, 1.1, MATS.acero(), 0, 0.55, 0, g, 4);
  return g;
};
GEN.aislador = (p) => {
  const g = new THREE.Group();
  const m = MATS.hormigonOscuro();
  for (let d = 0; d < 5; d++)
    cil(0.11 - d*0.004, 0.11 - d*0.004, 0.022, m, 0, 0.06 + d*0.05, 0, g, 12);
  return g;
};
GEN.anclaje = (p) => {
  const g = new THREE.Group();
  cil(0.06, 0.06, 3, MATS.acero(), 0, 1.5, 0, g, 8);
  caja(0.5, 0.4, 0.3, MATS.hormigon(), 0, 0.2, 0, g);
  return g;
};
GEN.subestacion = (p) => {
  const g = new THREE.Group();
  caja(p.lx || 20, p.ly || 6, p.lz || 10, MATS.hormigon(), 0, 3, 0, g);
  caja(4, 1, 4, MATS.oscuro(), 4, 6.5, 0, g);   // trafo
  return g;
};

/* --- señalización --- */
GEN.senial = (p) => {
  const g = new THREE.Group();
  const h = p.altura || 3.2;
  const m = MATS.oscuro();
  cil(0.07, 0.085, h - 0.8, m, 0, (h - 0.8)/2, 0, g, 10);
  const cab = caja(0.42, 1.0, 0.2, m, 0, h - 0.5, 0, g);
  const aspecto = p.aspecto || '';
  const colorLuz = aspecto.includes('rojo') ? 0xff3b30 : aspecto.includes('verde') ? 0x3ecf8e :
                   aspecto.includes('amarillo') ? 0xffd60a : 0xffffff;
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10),
    new THREE.MeshStandardMaterial({ color: colorLuz, emissive: colorLuz, emissiveIntensity: 0.9 }));
  luz.position.set(0.13, h - 0.85, 0);
  g.add(luz);
  return g;
};
GEN.baliza = (p) => {
  const g = new THREE.Group();
  caja(0.42, 0.04, 0.42, MATS.oscuro(), 0, 0.02, 0, g);
  return g;
};
GEN.mobiliario = (p) => {
  const g = new THREE.Group();
  const t = p.tipo || '';
  if (t.includes('Hito')){
    caja(0.12, 1, 0.08, MATS.hormigon(), 0, 0.5, 0, g);
    caja(0.14, 0.3, 0.02, MATS.blanco(), 0, 0.7, 0.041, g);
  } else if (t.includes('Barrera')){
    for (const dz of [-2, 2]){
      caja(0.3, 1.1, 0.3, MATS.rojo(), dz, 0.55, 0, g);
    }
    const brazo = caja(0.08, 0.08, 4, MATS.rojo(), 0, 1.05, 0, g);
    for (let i = 0; i < 8; i++) caja(0.085, 0.085, 0.25, MATS.blanco(), 0, 1.06, -2 + i*0.5, g);
  } else if (t.includes('Placa') || t.includes('Panel') || t.includes('tablero')){
    caja(0.06, 1, 1.4, MATS.blanco(), 0, 1.2, 0, g);
    cil(0.05, 0.05, 1, MATS.oscuro(), 0, 0.5, 0, g, 8);
  } else if (t.includes('Banco')){
    caja(1.6, 0.06, 0.45, MATS.tierra(), 0, 0.45, 0, g);
    for (const dx of [-0.7, 0.7]) caja(0.08, 0.45, 0.4, MATS.oscuro(), dx, 0.22, 0, g);
  } else {
    caja(0.3, 0.9, 0.3, MATS.oscuro(), 0, 0.45, 0, g);
  }
  return g;
};

/* --- material rodante --- */
GEN.tren = (p) => {
  const g = new THREE.Group();
  const LONG = 25/p.coches || 12, ANCHO = 1.6, ALTO = 1.7;
  const mCaja = MATS.blanco(), mVentana = new THREE.MeshStandardMaterial({ color: 0x0d1420, roughness: 0.15, metalness: 0.5 });
  for (let c = 0; c < (p.coches || 3); c++){
    const coche = new THREE.Group();
    caja(ANCHO, ALTO, LONG, mCaja, 0, 0.5 + ALTO/2, c*(LONG + 0.6), coche);
    caja(ANCHO + 0.02, 0.12, LONG*0.96, mVentana, 0, 0.5 + ALTO*0.62, c*(LONG + 0.6), coche);
    for (const dz of [-LONG/2 + 1.4, LONG/2 - 1.4]){
      for (const dx of [-ANCHO/2 - 0.05, ANCHO/2 + 0.05]){
        const rueda = cil(0.42, 0.42, 0.12, MATS.oscuro(), dx, 0.42, c*(LONG + 0.6) + dz, g, 16);
        rueda.rotation.z = Math.PI/2;
      }
    }
    g.add(coche);
  }
  return g;
};
GEN.locomotora = (p) => {
  const g = new THREE.Group();
  caja(1.7, 2.4, 18, MATS.rojo(), 0, 1.7, 0, g);
  caja(1.6, 0.9, 2, MATS.oscuro(), 0, 1.4, -9.2, g);
  return g;
};
GEN.vagon = (p) => {
  const g = new THREE.Group();
  caja(1.7, 1.4, 12, MATS.oscuro(), 0, 1.2, 0, g);
  return g;
};
GEN['obra_tren'] = (p) => {
  const g = new THREE.Group();
  caja(1.8, 1.2, 10, MATS.amarillo(), 0, 1.1, 0, g);
  return g;
};
GEN.pantografo = (p) => {
  const g = new THREE.Group();
  const m = MATS.acero();
  caja(0.5, 0.06, 0.9, m, 0, 0, 0, g);
  const b1 = caja(0.05, 0.05, 2.9, m, 0, 1.32, -0.6, g); b1.rotation.x = -0.75;
  const b2 = caja(0.05, 0.05, 2.7, m, 0, 4.0, 0.2, g);   b2.rotation.x = 0.85;
  caja(0.7, 0.05, 0.14, m, 0, 2.65, 0, g);
  return g;
};

/* --- estaciones --- */
GEN.anden = (p) => {
  const g = new THREE.Group();
  const lon = (p.tipo || '').includes('720') ? 720 : (p.tipo || '').includes('550') ? 550 :
              (p.tipo || '').includes('400') ? 400 : (p.tipo || '').includes('200') ? 200 : 300;
  const L = Math.min(lon, 60); // recortado para escena
  caja(3, 0.9, L, MATS.hormigon(), 3.5, 0.45, 0, g);
  // franja táctil
  caja(0.4, 0.05, L, MATS.amarillo(), 2.2, 0.92, 0, g);
  return g;
};
GEN.edificio = (p) => {
  const g = new THREE.Group();
  const t = p.tipo || '';
  if (t.includes('Terminal')){
    caja(40, 10, 20, MATS.blanco(), 0, 5, 0, g);
    caja(44, 0.5, 24, MATS.oscuro(), 0, 10.2, 0, g);
  } else if (t.includes('Pabellón')){
    caja(15, 4, 8, MATS.blanco(), 0, 2, 0, g);
  } else {
    caja(6, 2.8, 4, MATS.blanco(), 0, 1.4, 0, g);
  }
  return g;
};
GEN.mobiliario = GEN.baliza || GEN.mobiliario;

/* --- telecom --- */
GEN.telecom = (p) => {
  const g = new THREE.Group();
  const t = p.tipo || '';
  if (t.includes('torre') || t.includes('Torre')){
    cil(0.2, 0.5, 30, MATS.acero(), 0, 15, 0, g, 6);
    caja(1.5, 0.5, 0.1, MATS.blanco(), 0, 28, 0, g);
  } else if (t.includes('Poste')){
    cil(0.08, 0.1, 12, MATS.acero(), 0, 6, 0, g, 8);
    caja(0.6, 0.4, 0.3, MATS.blanco(), 0, 11, 0, g);
  } else if (t.includes('Caseta') || t.includes('armario') || t.includes('Armario')){
    caja(2.5, 2.2, 1.8, MATS.blanco(), 0, 1.1, 0, g);
  } else {
    caja(0.4, 0.3, 0.4, MATS.oscuro(), 0, 0.15, 0, g);
  }
  return g;
};
GEN.retorno = GEN.baliza;

/* --- obra civil --- */
GEN.obracivil = (p) => {
  const g = new THREE.Group();
  const t = p.tipo || '';
  if (t.includes('Vallado')){
    for (let i = 0; i <= 12; i++) cil(0.03, 0.03, 2, MATS.oscuro(), i*2 - 12, 1, 0, g, 4);
    caja(24, 0.02, 0.02, MATS.oscuro(), 0, 1.8, 0, g);
    caja(24, 0.02, 0.02, MATS.oscuro(), 0, 1.2, 0, g);
    caja(24, 0.02, 0.02, MATS.oscuro(), 0, 0.6, 0, g);
  } else if (t.includes('Pista') || t.includes('camino') || t.includes('Caminos')){
    caja(3.5, 0.15, 24, MATS.tierra(), 0, 0.075, 0, g);
  } else if (t.includes('Escalera') || t.includes('Rampa')){
    for (let i = 0; i < 8; i++) caja(1, 0.18, 0.3, MATS.hormigon(), 0, 0.09 + i*0.18, i*0.3, g);
  } else if (t.includes('Vado')){
    caja(3, 0.1, 4, MATS.hormigon(), 0, 0.05, 0, g);
  } else if (t.includes('Baliza') || t.includes('Señal')){
    cil(0.03, 0.03, 1, MATS.rojo(), 0, 0.5, 0, g, 6);
    caja(0.2, 0.2, 0.02, MATS.rojo(), 0, 0.85, 0, g);
  } else if (t.includes('Puerta')){
    for (const dx of [-0.8, 0.8]) cil(0.04, 0.04, 2, MATS.oscuro(), dx, 1, 0, g, 6);
    caja(1.7, 1.6, 0.04, MATS.acero(), 0, 1, 0, g);
  } else {
    caja(0.5, 0.5, 0.5, MATS.oscuro(), 0, 0.25, 0, g);
  }
  return g;
};
GEN.acopio = (p) => {
  const g = new THREE.Group();
  // montículo de material
  const geo = new THREE.ConeGeometry(4, 1.6, 12);
  const m = new THREE.Mesh(geo, MATS.balasto());
  m.position.y = 0.8;
  g.add(m);
  return g;
};
GEN.fase = (p) => {
  // representación del estado de obra: la vía al nivel de esa fase
  const g = new THREE.Group();
  const f = p.fase || 0;
  if (f >= 0) caja(10, 0.6, 24, MATS.tierra(), 0, 0.3, 0, g);
  if (f >= 1) caja(9, 0.2, 24, MATS.hormigonOscuro(), 0, 0.7, 0, g);
  if (f >= 2) caja(8, 0.35, 24, MATS.balasto(), 0, 0.98, 0, g);
  if (f >= 3){
    for (let i = 0; i < 40; i++) caja(2.6, 0.21, 0.3, MATS.hormigon(), 0, 1.25, -12 + i*0.6, g);
    for (const sx of [-0.7175, 0.7175]) caja(0.072, 0.172, 24, MATS.acero(), sx, 1.45, 0, g);
  }
  return g;
};

/* --- geotecnia --- */
GEN.terreno = (p) => {
  const g = new THREE.Group();
  const t = p.tipo || '';
  const m = t.includes('roca') ? MATS.hormigonOscuro() : t.includes('vegetación') ? MATS.verde() : MATS.tierra();
  caja(12, 0.8, 24, m, 0, 0.4, 0, g);
  return g;
};

/* --- gálibo (wireframe) --- */
GEN.galibo = (p) => {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xe8b93d, wireframe: true });
  // perfil de gálibo: semicírculo + laterales
  const pts = [];
  for (let i = 0; i <= 16; i++){
    const a = Math.PI * i/16;
    pts.push(new THREE.Vector3(Math.cos(a)*2.2, 4.5 + Math.sin(a)*1.5, 0));
  }
  pts.push(new THREE.Vector3(-2.2, 0.5, 0));
  const geo = new THREE.BufferGeometry().setFromPoints(pts.concat([pts[0]]));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe8b93d }));
  g.add(line);
  return g;
};

/* alias de generadores: tipologías de la BD que reutilizan un generador base */
const ALIAS = {
  'puente-tablero-esbelto': 'puente-viga',
  'puente-cajon-alto': 'puente-cajon',
  'puente-pasarela': 'puente-pasarela-U',
  'puente-ps-losa': 'puente-ps-viga',
  'talud': 'terreno',
  'malla': 'obracivil',
  'obra_tren': 'vagon',
};

export function generarObjeto(o){
  const gen = GEN[o.gen] || (ALIAS[o.gen] ? GEN[ALIAS[o.gen]] : null);
  if (!gen) return null;
  try { return gen(o.params || {}); }
  catch (e) { console.warn('gen error', o.id, e.message); return null; }
}
export function listaGeneradores(){ return Object.keys(GEN); }
