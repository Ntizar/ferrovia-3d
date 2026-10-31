# Ferrovia 3D

**Catálogo paramétrico del ferrocarril español en three.js — 594 objetos, 12 familias, 57 generadores.**

Base de datos de objetos ferroviarios con dimensiones reales (UIC/ADIF/Renfe) para construir gemelos digitales de vía: carriles, traviesas, sujeciones, catenaria, señalización, material rodante, puentes, hidráulica, terraplenes y desmontes, gálibos, estaciones y telecomunicaciones.

Hecho con ❤️ por David Antizar

## Qué hay aquí

| Ruta | Contenido |
|---|---|
| `datos/objetos.json` | **La base de datos**: 594 objetos con id, familia, generador, dimensiones y parámetros |
| `visor/index.html` | **El visor**: catálogo 3D navegable (buscador, filtros por familia, selección con ficha) |
| `visor/ferrovia-gen.js` | **Los generadores**: 57+7 funciones paramétricas three.js |
| `scripts/generar_bd.py` | Regenera la base de datos |
| `scripts/ampliar_bd.py` | Ampliación de variantes |
| `scripts/validar_bd.py` | Valida recuento (`--min N`) y cobertura de generadores (`--gen`) |

## Uso del visor

```bash
cd visor && python3 -m http.server 8945
# → http://localhost:8945
```

- **Buscador**: filtra por nombre o id
- **Chips de familia**: filtran el catálogo y recentran la cámara
- **Clic en 3D o en tabla**: abre la ficha con dimensiones y parámetros

## Filosofía

1. **La BD manda**: cada objeto es una fila JSON con parámetros; el generador es una función pura `params → THREE.Group`. Cambiar la BD cambia el 3D.
2. **Dimensiones reales**: perfiles UIC54/60, traviesas monobloque 2,6×0,30×0,21, vanos de catenaria 40-65 m, vanos de puente 5-60 m, alturas de pila 3-55 m.
3. **Escena comparativa**: en el visor, cada objeto se normaliza a celda (su tamaño real va en la ficha) para poder compararlos de un vistazo.
4. **Pensado para LiDAR**: cuando un objeto del mundo real se reconozca en una nube de puntos, se instancia su generador con los parámetros medidos y queda dibujado lo más sencillo posible.

## Familias (594 objetos)

| Familia | Objetos | Ejemplos |
|---|---|---|
| obra_fabrica | 132 | Puentes viga-artesa/losa/cajón/arco/celosía, pilas H y fusto (3-55 m), muros |
| via | 73 | Carriles UIC54/UIC60, traviesas, sujeciones Vossloh/Pandrol, aparatos de vía |
| catenaria | 73 | Pórticos (vano 40-65 m), postes, vainas con zigzag, aisladores, subestaciones |
| hidraulica | 60 | Bajantes Ø0,3-3 m, bóvedas, canales, arquetas, drenes, escolleras |
| senial | 45 | Señales luminosas, Eurobalizas, pasos a nivel, hitos |
| material_rodante | 53 | Series S-100 a S-112, cercanías, mercancías, trenes de obra |
| obra_civil | 39 | Vallados, pistas, accesos, acopios, fases de obra |
| estacion | 32 | Andenes, marquesinas, edificios, mobiliario |
| infra | 37 | Capas del cajón, perfiles de terraplén/desmonte, bermas, cunetas |
| telecom | 20 | GSM-R, torres, arquetas, retornos de tracción |
| geotecnia | 19 | Tipos de terreno y mejoras del terreno |
| galibo | 11 | Perfiles de gálibo GC/GB/GA |

## Verificación

```bash
/home/nan/.mastermind/venv/bin/python scripts/validar_bd.py --min 500 --gen   # → OK
```

Visor verificado headless: 594/594 renderizados, 0 errores JS, buscador y filtros operativos.

## Licencia y crédito

Código y datos generados para Mastermind. Dimensiones de normativa pública (UIC, ADIF, Renfe).
