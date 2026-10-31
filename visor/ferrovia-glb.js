/* ferrovia-glb.js — carga de modelos GLB reales (Kenney CC0, Sketchfab CC-BY)
   Cada GLB se escala a sus dimensiones normativas y queda cacheado. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map();   // slug -> Promise<GLTF scene clonable>
const BASE = 'glb/kenney/';
let texturaComun = null;

/* textura del kit: colormap.png junto a los GLB */
async function cargarTextura(){
  if (texturaComun) return texturaComun;
  texturaComun = new Promise((res) => {
    new THREE.TextureLoader().load(BASE + 'colormap.png',
      tex => { tex.colorSpace = THREE.SRGBColorSpace; res(tex); },
      undefined,
      () => res(null));
  });
  return texturaComun;
}

/* catálogo de GLB disponibles con su escala normativa (metros reales) */
export const GLBS = {
  'glb-locomotora': { slug: 'tren_locomotora', largo: 19.0, ancho: 2.9, alto: 4.3,
    fuente: 'Kenney Holiday Kit (CC0-1.0)' },
  'glb-vagon': { slug: 'tren_vagon', largo: 12.0, ancho: 2.9, alto: 3.2,
    fuente: 'Kenney Holiday Kit (CC0-1.0)' },
  'glb-tender': { slug: 'tren_tender', largo: 8.0, ancho: 2.9, alto: 3.0,
    fuente: 'Kenney Holiday Kit (CC0-1.0)' },
  'glb-via-recta': { slug: 'via_recta', largo: 25.0, ancho: 2.6, alto: 0.3,
    fuente: 'Kenney Holiday Kit (CC0-1.0)' },
  'glb-via-detalle': { slug: 'via_recta_detalle', largo: 25.0, ancho: 2.6, alto: 0.35,
    fuente: 'Kenney Holiday Kit (CC0-1.0)' },
  'glb-via-curva': { slug: 'via_curva', largo: 25.0, ancho: 2.6, alto: 0.3,
    fuente: 'Kenney Holiday Kit (CC0-1.0)' },
};

function cargar(slug){
  if (!cache.has(slug)){
    cache.set(slug, new Promise((res, rej) => {
      loader.load(BASE + slug + '.glb',
        gltf => res(gltf.scene),
        undefined,
        err => rej(err));
    }));
  }
  return cache.get(slug);
}

/* genera el grupo con el GLB escalado a dimensiones normativas */
/* paleta ferroviaria real por familia de pieza (Kenney Holiday Kit: el colormap del
   kit no encaja con los UVs del GLB descargado — usamos colores sólidos de catálogo) */
const PALETA_GLB = {
  'glb-locomotora': { cuerpo: '#c23b2e', detalle: '#2c3540' },   /* rojo Renfe */
  'glb-vagon': { cuerpo: '#3d5a80', detalle: '#2c3540' },        /* azul Renfe mercancías */
  'glb-tender': { cuerpo: '#2c3540', detalle: '#c23b2e' },
  'glb-via-recta': { cuerpo: '#6f6a60', detalle: '#9aa3ad' },
  'glb-via-detalle': { cuerpo: '#6f6a60', detalle: '#9aa3ad' },
  'glb-via-curva': { cuerpo: '#6f6a60', detalle: '#9aa3ad' },
};

export async function generarGLB(genId, params = {}){
  const cfg = GLBS[genId];
  if (!cfg) return null;
  try {
    const escena = await cargar(cfg.slug);
    const clon = escena.clone(true);
    clon.scale.setScalar(cfg.largo);
    const paleta = PALETA_GLB[genId] || { cuerpo: '#8a8f98', detalle: '#5a6068' };
    let primerMesh = true;
    clon.traverse(n => {
      if (n.isMesh){
        n.castShadow = true;
        n.receiveShadow = true;
        n.material = n.material.clone();
        n.material.map = null;
        /* el mesh principal lleva el color de cuerpo; los secundarios el de detalle */
        n.material.color.set(primerMesh ? paleta.cuerpo : paleta.detalle);
        n.material.roughness = 0.65;
        n.material.metalness = genId.startsWith('glb-via') ? 0.5 : 0.25;
        primerMesh = false;
      }
    });
    const g = new THREE.Group();
    g.add(clon);
    g.userData.fuenteGLB = cfg.fuente;
    return g;
  } catch (e) {
    console.warn('GLB no disponible', genId, e.message);
    return null;
  }
}
