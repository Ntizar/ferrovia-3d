/* ferrovia-glb.js — carga de modelos GLB reales (Kenney CC0, Sketchfab CC-BY)
   Cada GLB se escala a sus dimensiones normativas y queda cacheado. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map();   // slug -> Promise<GLTF scene clonable>
const BASE = 'glb/kenney/';

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
export async function generarGLB(genId, params = {}){
  const cfg = GLBS[genId];
  if (!cfg) return null;
  try {
    const escena = await cargar(cfg.slug);
    const clon = escena.clone(true);
    /* escala: el GLB original es de ~1 m; escalo al largo normativo */
    clon.scale.setScalar(cfg.largo);
    clon.traverse(n => {
      if (n.isMesh){
        n.castShadow = true;
        n.receiveShadow = true;
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
