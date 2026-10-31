#!/usr/bin/env python3
"""Genera la base de datos de objetos ferroviarios paramétricos (objetos.json).

Cada objeto: {id, nombre, familia, gen, dims, params} — el gen es el nombre del
generador three.js (función del visor) y params son sus parámetros reales.
Dimensiones de normativa española/renfe (UIC, ADIF) con trazabilidad en la nota.
"""
import json, os, itertools

RUTA = os.path.join(os.path.dirname(__file__), '..', 'datos', 'objetos.json')

obj = []
n = [0]
def add(nombre, familia, gen, dims, params, nota=''):
    n[0] += 1
    obj.append({
        'id': f'{familia[:3].upper()}-{n[0]:04d}',
        'nombre': nombre,
        'familia': familia,
        'gen': gen,
        'dims': dims,
        'params': params,
        'nota': nota,
    })

# ============ 1. VÍA: CARRILES (perfiles UIC) ============
perfiles = {
    'UIC54': {'a': 0.067, 'p': 0.016, 'e': 0.049, 'peso': 54.4},
    'UIC60': {'a': 0.072, 'p': 0.0165, 'e': 0.049, 'peso': 60.3},
    'UIC60E5': {'a': 0.072, 'p': 0.0145, 'e': 0.049, 'peso': 60.3},
}
for perf, d in perfiles.items():
    for tramo in ['tramo recto', 'tramo curva R300', 'tramo curva R500', 'aparato vía']:
        add(f'Carril {perf} — {tramo}', 'via', 'carril',
            f'{perf} · {d["peso"]} kg/m',
            {'perfil': perf, 'anchoCabeza': d['a'], 'pata': d['p'], 'altura': d['e']})
    add(f'Carril {perf} — sabata de apoyo', 'via', 'sabata',
        f'{perf} · apoyo contínuo', {'perfil': perf})

# ============ 2. VÍA: TRAVIESAS ============
traviesas = [
    ('Monobloque PS-93', 2.60, 0.30, 0.21, 'prefabricado HA-45'),
    ('Monobloque SZ-41 (Rheda)', 2.60, 0.30, 0.20, 'bicapa con revestimiento'),
    ('Traviesa de madera FS', 2.60, 0.26, 0.16, 'roble creosotado (línea convencional)'),
    ('Traviesa bi-bloque VD', 2.42, 0.28, 0.19, 'bi-bloque con tirante'),
    ('Traviesa puente (aplaca)', 2.80, 0.30, 0.24, 'para placa de puente'),
    ('Traviesa corta de aparato', 2.20, 0.26, 0.18, 'progresiva en desvío'),
    ('Traviesa de cambio larga', 4.50, 0.30, 0.21, 'en aparatos de vía'),
]
for nombre, x, z, y, mat in traviesas:
    add(f'Traviesa {nombre}', 'via', 'traviesa',
        f'{x}×{z}×{y} m', {'lx': x, 'lz': z, 'ly': y, 'material': mat})
# separaciones reales
for sep in [0.60, 0.625, 0.65, 0.68]:
    add(f'Tendido a {sep} m de separación', 'via', 'tendido',
        f'{sep} m entre ejes', {'sep': sep}, 'separación en función de velocidad y radio')

# ============ 3. VÍA: SUJECIONES ============
sujeciones = [
    ('Vossloh SKL-14', 'clip helicoidal e-colgado', 'AV'),
    ('Vossloh SKL-12', 'clip helicoidal', 'convencional'),
    ('Vossloh SKL-15', 'clip con versión alta', 'AV plataformado'),
    ('Pandrol Fastclip', 'clip auto-encajable', 'convencional'),
    ('Pandrol e-Clip', 'clip e-Clip', 'AV'),
    ('Sujeción W-14 con placa elástica', 'placa + tirafondo', 'puente'),
    ('Sujeción de aplaca PF', 'aplaca + clavija', 'convencional'),
    ('Sujeción antivibratoria Colex', 'aislante intercalar', 'zona urbana'),
    ('Sujeción con regulador de nivel (H-20)', 'aplaca cunera', 'ajuste'),
    ('Sujeción con regulador lateral (H-30)', 'tope lateral', 'ajuste'),
]
for nombre, tipo, uso in sujeciones:
    add(f'Sujeción {nombre}', 'via', 'sujecion',
        'clip + placa', {'tipo': tipo, 'uso': uso})

# ============ 4. INFRAESTRUCTURA: CAJÓN ============
for capa in ['formación (subexplanada)', 'subbalasto GCA', 'balasto 25/50', 'balasto 31,5/50',
             'subbalasto tratado in situ', 'capa drenante']:
    for esp in [20, 25, 30, 35]:
        add(f'Capa: {capa} — {esp} cm', 'infra', 'capa',
            f'{esp} cm', {'espesor': esp/100, 'capa': capa})
for forma in ['terraplén 3H/2V', 'terraplén 1,5H/1V', 'desmonte 1H/1V', 'desmonte 3/2 con berma',
              'terraplén en trinchera', 'desmonte rocoso vertical']:
    add(f'Perfil: {forma}', 'infra', 'perfil',
        'sección transversal tipo', {'forma': forma})
for berma in [2, 3, 5]:
    add(f'Berma de {berma} m', 'infra', 'berma', f'{berma} m', {'ancho': berma})
for cuneta in ['triangular', 'trapecial', 'de hormigón en V', 'de piña']:
    add(f'Cuneta {cuneta}', 'infra', 'cuneta', 'sección hidráulica', {'tipo': cuneta})

# ============ 5. HIDRÁULICA ============
hidraulica = [
    ('Bajante circular', 0.4), ('Bajante circular', 0.6), ('Bajante circular', 0.8),
    ('Bajante circular', 1.0), ('Bajante circular', 1.2), ('Bajante circular', 1.5),
    ('Bajante circular', 2.0),
    ('Bóveda de paso superior', 3.0), ('Bóveda de paso inferior', 4.0),
    ('Canal revestido trapecial', 1.0), ('Canal revestido trapecial', 2.0),
    ('Cuneta de profundidad entubada', 0.6),
    ('Arqueta de registro DIF', 1.2), ('Arqueta de registro DIN', 1.2),
    ('Desagüe transversal (balsa)', 0.8),
    ('Tubo frontal de desagüe', 0.5),
    ('Hidroductor bajo vía', 1.0), ('Hidroductor bajo vía', 1.4),
    ('Zanja de drenaje longitudinal profunda', 2.5),
    ('Dique de encauzamiento', 3.0),
    ('Escollera de protección de talud', 1.0),
    ('Pozo de absorción', 2.0),
    ('Canal de coronación', 1.0),
    ('Bajante de talud en escalones', 0.3),
    ('Disipador de energía (cuenco)', 2.5),
    ('Aliviadero lateral de cuneta', 1.0),
]
for nombre, d in hidraulica:
    add(f'{nombre} Ø{d} m', 'hidraulica', 'hidraulica',
        f'Ø {d} m', {'tipo': nombre, 'diametro': d})
for nombre in ['Dren longitudinal con geotextil', 'Dren transversal con filtro',
               'Zanja drenante con tubería ranurada', 'Dren tapizado (geocompuesto)',
               'Capa anticapilar', 'Formación granular drenante']:
    add(nombre, 'hidraulica', 'dren', 'dren longitudinal/transversal', {'tipo': nombre})

# ============ 6. OBRAS DE FÁBRICA: PUENTES ============
puentes = [
    ('Puente viga artesa pretensada tipo "losa" (vano ≤ 20 m)', 20, 'viga-artesa'),
    ('Puente viga artesa pretensada (vano 25 m)', 25, 'viga-artesa'),
    ('Puente viga artesa pretensada (vano 35 m)', 35, 'viga-artesa'),
    ('Puente losa maciza de hormigón (vano ≤ 12 m)', 12, 'losa'),
    ('Puente losa aligerada (vano 15 m)', 15, 'losa-aligerada'),
    ('Puente viga de alma llena (vano 20 m)', 20, 'viga'),
    ('Puente tablero esbelto pretensado (vano 45 m)', 45, 'tablero-esbelto'),
    ('Viaducto viga cajón (vano 50 m)', 50, 'cajon'),
    ('Viaducto viga cajón (vano 60 m)', 60, 'cajon'),
    ('Viaducto pila alta H>40 m (vano 50 m)', 50, 'cajon-alto'),
    ('Puente arco de hormigón (vano 60 m)', 60, 'arco'),
    ('Puente celosía metálica (vano 40 m)', 40, 'celosia'),
    ('Pasarela peatonal de viga artesa (vano 20 m)', 20, 'pasarela'),
    ('Pasarela metálica en U (vano 25 m)', 25, 'pasarela-U'),
    ('Paso superior losa (vano 15 m)', 15, 'ps-losa'),
    ('Paso superior viga artesa (vano 25 m)', 25, 'ps-viga'),
    ('Paso inferior bóveda (vano 8 m)', 8, 'pi-boveda'),
    ('Paso inferior marco (vano 10 m)', 10, 'pi-marco'),
]
for nombre, vano, gen in puentes:
    add(nombre, 'obra_fabrica', 'puente-' + gen,
        f'vano {vano} m', {'vano': vano, 'tipologia': gen})
for h in [4, 6, 8, 10, 12, 15, 20, 25, 30, 40]:
    add(f'Pila tipo en H — h={h} m', 'obra_fabrica', 'pila-H',
        f'h {h} m', {'altura': h, 'forma': 'H'})
    add(f'Pila tipo fusto hueco — h={h} m', 'obra_fabrica', 'pila-fusto',
        f'h {h} m', {'altura': h, 'forma': 'fusto'})
for lon in [8, 10, 12]:
    add(f'Estribo tipo en U — {lon} m', 'obra_fabrica', 'estribo',
        f'{lon} m de alero', {'lon': lon})
for nombre in ['Muro de contención en L', 'Muro pantalla', 'Muro de gaviones',
               'Muro de gabiones con frente escalonado', 'Muro MG-III (tierra armada)']:
    add(nombre, 'obra_fabrica', 'muro', 'contención', {'tipo': nombre})

# ============ 7. CATENARIA ============
for fam in ['pórtico con postes IPN', 'pórtico con tubo redondo', 'pórtico con poste UIC',
            'ménsula simple', 'ménsula con registro', 'pórtico en celosía']:
    for sep in [45, 50, 55, 60]:
        add(f'{fam} — {sep} m de vano', 'catenaria', 'portico',
            f'vano {sep} m', {'vano': sep, 'fam': fam})
for h in [5.6, 6.0, 6.5, 7.0]:
    add(f'Poste de catenaria h={h} m', 'catenaria', 'poste',
        f'h {h} m', {'altura': h})
add('Catenaria simple (hilo contacto + mensajero)', 'catenaria', 'vaina',
    'vano entre postes', {'flecha': 0.7})
add('Catenaria con hilo auxiliar (compuesta)', 'catenaria', 'vaina',
    'vano entre postes', {'flecha': 0.5, 'auxiliar': True})
add('Catenaria con registrar regulable', 'catenaria', 'vaina',
    'vano entre postes', {'flecha': 0.7, 'regulador': True})
for t in ['péndola simple', 'péndola doble', 'péndola con recorte']:
    add(f'{t}', 'catenaria', 'pendola', 'elemento', {'tipo': t})
for a in ['aislador de porcelana', 'aislador polimérico', 'aislador de vidrio']:
    add(a, 'catenaria', 'aislador', '5-6 discos', {'tipo': a})
for nombre in ['Anclaje con contrapeso (tapanco)', 'Anclaje a pórtico',
               'Seccionador de islas', 'Interruptor de vía', 'Parallelo de alimentación']:
    add(nombre, 'catenaria', 'anclaje', 'elemento', {'tipo': nombre})
add('Subestación de tracción (caseta tipo)', 'catenaria', 'subestacion',
    '20×10×6 m', {'lx': 20, 'lz': 10, 'ly': 6})

# ============ 8. SEÑALIZACIÓN ============
senales = [
    ('Señal de parada', 'fijo con luz roja', '3.2'),
    ('Señal de anuncio de parada', 'amarillo parpadeante', '3.5'),
    ('Señal de anuncio de preaviso', 'amarillo fijo', '3.5'),
    ('Señal de reanudar marcha', 'verde', '3.2'),
    ('Señal de maniobra', 'luz azul-blanca', '3.0'),
    ('Señal de fin de autorización', 'blanco-f', '3.0'),
    ('Señal de limitación de velocidad (ETCS)', 'baliza+aspecto', '3.0'),
    ('Señal ERTMS L2 (baliza Eurobaliza)', 'baliza', '3.0'),
    ('Señal de cambio de vía (desvío)', 'luz angular', '3.2'),
    ('Señal de protección de paso a nivel', 'rojo intermitente', '3.0'),
]
for nombre, aspecto, h in senales:
    add(nombre, 'senial', 'senial',
        f'h {h} m', {'altura': float(h), 'aspecto': aspecto})
for nombre in ['Eurobaliza (baliza ETCS)', 'Euroloop (extensión electrónica)', 'LTV (punto informativo)']:
    add(nombre, 'senial', 'baliza', 'elemento embutido', {'tipo': nombre})
for nombre in ['Hito kilométrico', 'Hito hectométrico', 'Señal de límite de maniobras (tablero)',
               'Placa de gálibo', 'Señal de topes de retaco', 'Señal de localización (PRL)',
               'Señal de inicio de circular con une', 'Señal de estación (placa de nombre)',
               'Faro de paso a nivel (cuarto luminoso)', 'Barrera de paso a nivel',
               'Semibarrera de paso a nivel', 'Panel de encarrilado']:
    add(nombre, 'senial', 'mobiliario', 'elemento', {'tipo': nombre})

# ============ 9. VEHÍCULOS (material rodante España) ============
series = [
    ('S-103 (Velaro E)', 'AVE alta velocidad', 200, 8, 25, '380'),
    ('S-112 (Velaro)', 'AVE alta velocidad', 202, 8, 26, '380'),
    ('S-100 (AVE)', 'AVE alta velocidad', 200, 8, 25, '300'),
    ('S-130 (Alvia)', 'ancho variable', 200, 13, 30, '250'),
    ('S-730 (Alvia híbrido)', 'ancho variable + diésel', 200, 13, 30, '250'),
    ('S-121 (Alvia)', 'ancho variable', 180, 9, 29, '250'),
    ('S-106 (Talgo Avril)', 'AV ancho variable', 203, 11, 30, '330'),
    ('S-107 (Talgo AVRIL G3)', 'AV alta velocidad', 205, 11, 30, '330'),
    ('S-104 (Avant)', 'media distancia AV', 200, 8, 20, '250'),
    ('S-114 (Avant)', 'media distancia AV', 200, 8, 22, '250'),
    ('S-599 (Altaria)', 'convencional locomotora+coches', 200, 9, 25, '200'),
    ('S-449 (Regional)', 'convencional', 160, 3, 28, '160'),
    ('S-464 (Cercanías Civia)', 'cercanías', 120, 4, 24, '120'),
    ('S-450 (Cercanías)', 'cercanías doble', 120, 6, 24, '120'),
    ('S-598 (Intercity diesel)', 'convencional diésel', 160, 3, 24, '180'),
    ('S-599.2 (Intercity)', 'convencional', 200, 3, 24, '200'),
]
for nombre, tipo, _kmh, coches, largo, vmax in series:
    add(f'Tren {nombre}', 'material_rodante', 'tren',
        f'{coches} coches · {vmax} km/h', {'series': nombre, 'coches': coches, 'vmax': vmax})
add('Locomotora S-252 ( eléctrica)', 'material_rodante', 'locomotora',
    '1 vehículo', {'series': 'S-252'})
add('Locomotora S-333 (diésel)', 'material_rodante', 'locomotora',
    '1 vehículo', {'series': 'S-333'})
add('Vagón de mercancías tipo E', 'material_rodante', 'vagon',
    '1 vehículo', {'tipo': 'mercancías'})

# ============ 10. VIA ÚTIL / GÁLIBO ============
for nombre in ['Gálibo GC (líneas AV)', 'Gálibo GB (convencional)', 'Gálibo GA (especial)',
               'Gálibo de pasarela PE', 'Gálibo de plataforma', 'Gálibo para catenaria']:
    add(nombre, 'galibo', 'galibo', 'perfil de tolerancia', {'tipo': nombre})

# ============ 11. ESTACIONES Y MOBILIARIO ============
for nombre in ['Andén lateral 200 m', 'Andén central 400 m', 'Andén de 550 m (AVE)',
               'Andén de 720 m (AVE)']:
    add(nombre, 'estacion', 'anden', 'longitud de andén', {'tipo': nombre})
for nombre in ['Marquesina de andén', 'Marquesina integral de andén',
               'Caseta de técnicos', 'Caseta de SAI', 'Pabellón de viajeros pequeño',
               'Pabellón de viajeros medio', 'Terminal de AV']:
    add(nombre, 'estacion', 'edificio', 'edificación', {'tipo': nombre})
for nombre in ['Tornos de acceso', 'Barandilla de andén', 'Papelera de andén',
               'Banco de andén', 'Tótem informativo', 'Máquina de billetes']:
    add(nombre, 'estacion', 'mobiliario', 'elemento', {'tipo': nombre})

# ============ 12. TELECOMUNICACIONES Y GROUND ============
for nombre in ['Poste GSM-R', 'Poste GSM-R con repetidor', 'Cable de fibra en zanja (tubo)',
               'Cañera de telecomunicaciones', 'Armario de vías (blanco ADIF)',
               'Caseta de enclavamiento electrónico', 'Antena GSM-R en torre', 'Torre de comunicaciones']:
    add(nombre, 'telecom', 'telecom', 'elemento', {'tipo': nombre})
for nombre in ['Cepillo de tierra (SAA)', 'Retorno de tracción', 'Conector transversal de vía',
               'Conexión equipotencial de puentes']:
    add(nombre, 'telecom', 'retorno', 'elemento', {'tipo': nombre})

# ============ 13. SEGURIDAD / OTROS ============
for nombre in ['Vallado perimetral de 2 m', 'Vallado de malla simple',
               'Puerta de acceso con cerradura', 'Caminos de servicio (pista de 3,5 m)',
               'Pista de acceso en firme de zahorra', 'Paso de servicio hormigonado',
               'Vado de acceso a fincas', 'Escalera de acceso a plataforma',
               'Rampa de acceso para mantenimiento']:
    add(nombre, 'obra_civil', 'obracivil', 'elemento', {'tipo': nombre})
for nombre in ['Señal vertical de obra', 'Baliza de obra', 'Valla de obra']:
    add(nombre, 'obra_civil', 'obracivil', 'elemento temporal', {'tipo': nombre})

# ============ 14. SUELO Y GEOLOGÍA (cortes) ============
for tipo in ['terreno natural (roca)', 'terreno natural (granular)', 'material de préstamo',
             'material de explotación', 'escollera de zanja', 'suelo mejorado (seleccionado)',
             'suelo estabilizado con cemento']:
    add(f'Terreno: {tipo}', 'geotecnia', 'terreno', 'volumen', {'tipo': tipo})

# ============ 15. APARATOS DE VÍA ============
for tipo in ['Desvío simple recto-curveado', 'Desvío simple recto-recto',
             'Desvío interior de cruzamiento', 'Cruzamiento simple',
             'Cruzamiento de vía (diamante)', 'Desvío compensado',
             'Aparato de vía con accionamiento eléctrico S-1000',
             'Aparato de vía con accionamiento hidráulico']:
    add(tipo, 'via', 'aparato',
        'según número de agujas', {'tipo': tipo})

# ============ 16. EXPLOTACIÓN / ÁREAS DE ACOPIO ============
for nombre in ['Área de acopio de balasto', 'Área de acopio de tierra',
               'Área de carga de tren de obra', 'Rampa de acceso a plataforma para trenes de obra',
               'Cruce de trenes de obra', 'Estación de obra provisional']:
    add(nombre, 'obra_civil', 'acopio', 'área', {'tipo': nombre})

# ============ 17. PANTÓGRAFOS Y EQUIPO EMBARCADO ============
for nombre in ['Pantógrafo de media velocidad (AX)', 'Pantógrafo de alta velocidad (CX)',
               'Pantógrafo de última generación (CX-AT)', 'Bobina de inducción magnética',
               'Antena ETCS (Eurocab)']:
    add(nombre, 'material_rodante', 'pantografo', 'elemento embarcado', {'tipo': nombre})

# ============ 18. ESTRUCTURAS DE DRENAJE VERTICALES ============
for nombre in ['Talud con hidrosiembra', 'Talud con manta de control de erosión',
               'Talud con ochorera de piedra', 'Talud con geocelda rellena',
               'Ribera con poda de seguridad', 'Franja de vegetación controlada']:
    add(nombre, 'hidraulica', 'talud', 'tratamiento de talud', {'tipo': nombre})

# ============ 19. CERCAS, MALLAS Y TRAMPAS ============
for nombre in ['Malla anticaída de talud (piso básico)', 'Malla de alta resistencia',
               'Barera física anticaída (40 kJ)', 'Cortina de anclajes',
               'Red de captura de bloques (500 kJ)', 'Barrera anticaída rígida']:
    add(nombre, 'obra_fabrica', 'malla', 'protección de talud', {'tipo': nombre})

# ============ 20. CRONOTECA: FASES DE OBRA ============
for fase, num in [('Fase 0: explanada', 0), ('Fase 1: subbalasto', 1), ('Fase 2: balasto', 2),
                  ('Fase 3: vía montada', 3), ('Fase 4: catenaria', 4), ('Fase 5: señalización', 5)]:
    add(f'{fase}', 'obra_civil', 'fase', 'estado de obra', {'fase': num})

# guardar
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
salida = {
    'version': '1.0',
    'total': len(obj),
    'fuente': 'dimensiones de normativa UIC/ADIF/Renfe; generadores paramétricos three.js',
    'familias': sorted(set(o['familia'] for o in obj)),
    'objetos': obj,
}
with open(RUTA, 'w') as f:
    json.dump(salida, f, ensure_ascii=False, indent=1)
print(f'BD generada: {len(obj)} objetos en {len(salida["familias"])} familias')
