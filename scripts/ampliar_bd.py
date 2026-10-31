#!/usr/bin/env python3
"""Ampliación BD: más variantes paramétricas para superar los 500 objetos."""
import json, os

RUTA = os.path.join(os.path.dirname(__file__), '..', 'datos', 'objetos.json')
with open(RUTA) as f:
    bd = json.load(f)

n = bd['total']
def add(nombre, familia, gen, dims, params, nota=''):
    global n
    n += 1
    bd['objetos'].append({
        'id': f'{familia[:3].upper()}-{n:04d}',
        'nombre': nombre, 'familia': familia, 'gen': gen,
        'dims': dims, 'params': params, 'nota': nota,
    })

# --- Puentes: más tipologías y vanos ---
for vano in [10, 15, 20, 25, 30, 35, 40, 45]:
    for tip in ['viga-artesa', 'losa', 'viga', 'cajon', 'celosia']:
        add(f'Puente {tip} — vano {vano} m', 'obra_fabrica', 'puente-' + tip,
            f'vano {vano} m', {'vano': vano, 'tipologia': tip})
for vano in [5, 8, 10, 12, 15]:
    add(f'Paso inferior marco — vano {vano} m', 'obra_fabrica', 'puente-pi-marco',
        f'vano {vano} m', {'vano': vano, 'tipologia': 'pi-marco'})
    add(f'Paso inferior bóveda — vano {vano} m', 'obra_fabrica', 'puente-pi-boveda',
        f'vano {vano} m', {'vano': vano, 'tipologia': 'pi-boveda'})
for h in [3, 5, 7, 9, 11, 13, 18, 22, 28, 35, 45, 55]:
    add(f'Pila fusto circular — h={h} m', 'obra_fabrica', 'pila-fusto',
        f'h {h} m', {'altura': h, 'forma': 'fusto'})
    add(f'Pila en H — h={h} m', 'obra_fabrica', 'pila-H',
        f'h {h} m', {'altura': h, 'forma': 'H'})

# --- Catenaria: más vanos y alturas ---
for vano in [40, 45, 50, 55, 60, 65]:
    for fam in ['pórtico con postes IPN', 'ménsula simple', 'ménsula con registro', 'pórtico en celosía']:
        add(f'{fam} — vano {vano} m', 'catenaria', 'portico',
            f'vano {vano} m', {'vano': vano, 'fam': fam})
for h in [5.2, 5.4, 5.8, 6.2, 6.8, 7.2]:
    add(f'Poste de catenaria h={h} m', 'catenaria', 'poste', f'h {h} m', {'altura': h})

# --- Hidráulica: más diámetros y tipos ---
for d in [0.3, 0.45, 0.5, 0.7, 0.9, 1.1, 1.3, 1.6, 1.8, 2.2, 2.5, 3.0]:
    add(f'Bajante circular Ø{d} m', 'hidraulica', 'hidraulica',
        f'Ø {d} m', {'tipo': 'Bajante circular', 'diametro': d})
for nombre in ['Sifón invertido', 'Canal de recogida de aguas (CECA)', 'Foso de defensa',
               'Dique de escollera en pie', 'Muro de defensa fluvial', 'Pozo de bombeo',
               'Arqueta rompe-presiones', 'Balsa de retención temporal',
               'Canal de derivación', 'Tubería de impulsión DN400']:
    add(nombre, 'hidraulica', 'hidraulica', 'elemento hidráulico', {'tipo': nombre})

# --- Señalización: más variantes ---
for nombre in ['Señal de parada diferida', 'Señal de rebase', 'Señal de inicio de zona de maniobras',
               'Señal de fin de zona de maniobras', 'Señal de esquiva (frente rojo)',
               'Señal de silencio (zona hospitalaria)', 'Señal de aviso de estación',
               'Señal de cambio de tracción', 'Señal de limitación 160', 'Señal de limitación 200',
               'Señal de limitación 220', 'Señal de limitación 300', 'Señal de reanudar LTV',
               'Señal de inicio de circuito de vía', 'Señal de final de circuito de vía',
               'Detector de caja caliente', 'Detector de Tamizaje (cajón)',
               'Fotocélula de ocupación', 'Contador de ejes', 'Pedal de ayuda al arranque']:
    add(nombre, 'senial', 'senial', 'elemento', {'tipo': nombre})

# --- Material rodante: más series y variantes ---
series_mas = [
    ('S-101 (Talgo AV)', 'AVE', 200, 10, 25, '300'),
    ('S-102 (Talgo 350)', 'AVE', 200, 11, 25, '330'),
    ('S-113 (Talgo 350)', 'AVE', 200, 11, 25, '330'),
    ('S-120 (Alvia)', 'ancho variable', 160, 5, 29, '250'),
    ('S-598.1 (diésel)', 'convencional', 160, 3, 24, '160'),
    ('S-592 (diésel RENFE)', 'convencional', 120, 3, 24, '160'),
    ('S-592.300 (diésel)', 'convencional', 120, 3, 24, '160'),
    ('S-470 (eléctrico regional)', 'convencional', 160, 3, 24, '160'),
    ('S-440 (cercanías)', 'cercanías', 120, 3, 24, '120'),
    ('S-440R (cercanías reformado)', 'cercanías', 120, 3, 24, '120'),
    ('S-463 (Cercanías Civia corto)', 'cercanías', 120, 2, 24, '120'),
    ('S-465 (Cercanías Civia 5 coches)', 'cercanías', 120, 5, 24, '120'),
    ('S-2994 (châssis de maniobras)', 'maniobras', 60, 1, 24, '60'),
    ('S-319 (diésel mercancías)', 'mercancías', 100, 1, 20, '100'),
    ('S-335 (diésel mercancías)', 'mercancías', 100, 1, 20, '100'),
    ('S-256 (eléctrica mercancías)', 'mercancías', 100, 1, 20, '100'),
]
for nombre, tipo, _kmh, coches, largo, vmax in series_mas:
    add(f'Tren {nombre}', 'material_rodante', 'tren',
        f'{coches} coches · {vmax} km/h', {'series': nombre, 'coches': coches, 'vmax': vmax})
for nombre in ['Vagón tolva de balasto', 'Vagón plataforma para vías', 'Vagón cisterna',
               'Vagón cerrado tipo Hbis', 'Vagón de borde bajo tipo Eanos',
               'Tren de alisado Plasser APT', 'Tren de alineación Plasser 09-3X',
               'Bastidor de transporte de carril', 'Máquina de cambio de traviesas',
               'Máquina de cribar balasto CSS-96', 'Vagón de obra para catenaria',
               'Coche taller de obra', 'Coche de trabajo en catenaria (TRC)']:
    add(nombre, 'material_rodante', 'obra_tren', 'material de obra', {'tipo': nombre})

# --- Estaciones: más ---
for nombre in ['Andén insular', 'Andén tipo terminal (topes)', 'Andén provisional de obra',
               'Marquesina corta (20 m)', 'Marquesina media (40 m)', 'Marquesina larga (60 m)',
               'Escalera fija de acceso a andén', 'Escalera mecánica de andén',
               'Ascensor de andén', 'Rampa accesible de andén', 'Túnel de acceso bajo vías',
               'Paso elevado de viajeros (PEV)', 'Aparcamiento disuasorio',
               'Darse de vuelta (loop) de trenes', 'Calle de apartado de trenes']:
    add(nombre, 'estacion', 'anden', 'elemento de estación', {'tipo': nombre})

# --- Aparatos de vía: más ---
for nombre in ['Desvío tipo 760-1:9', 'Desvío tipo 760-1:12', 'Desvío tipo 760-1:18,5',
               'Desvío tipo 760-1:22,5', 'Desvío tipo 760-1:33,3', 'Desvío de alta velocidad 1:42',
               'Cruzamiento simple 1:9', 'Cruzamiento simple 1:12',
               'Diamante 60°', 'Diamante 120°', 'Triple desvío', 'Desvío curvo interior',
               'Aparato con movable point frog (MPF)', 'Aparato con corazón fijo']:
    add(nombre, 'via', 'aparato', 'según radio', {'tipo': nombre})

# --- Geo / terrenos ---
for nombre in ['Excavación en roca sana', 'Excavación en roca media', 'Excavación en tierra',
               'Terraplén homogéneo de préstamo', 'Terraplén mixto (núcleo/filtro)',
               'Terraplén con escollera', 'Mejora de terreno con geosintéticos',
               'Columnas de grava', 'Columnas rígidas (CFA)', 'Compactación dinámica',
               'Precarga con drenes', 'Inyecciones de consolidación']:
    add(nombre, 'geotecnia', 'terreno', 'unidad de terreno', {'tipo': nombre})

# --- Obras civiles: más ---
for nombre in ['Explanada en terraplén de 2 m', 'Explanada en desmonte de 2 m',
               'Plataforma de vía (imprimación)', 'Pista de servicio en banca',
               'Paso de maquinaria (paso de obra)', 'Zanja de telecomunicaciones con tapa de hormigón',
               'Zanja de alta tensión', 'Arqueta de telecomunicaciones', 'Arqueta de alta tensión',
               'Cepo de anclaje de catenaria', 'Masa de anclaje (deadman)',
               'Vallado de malla con alambre', 'Vallado de malla electro-soldada',
               'Escalera de pies (montantes) de acceso', 'Pasarela de servicio sobre cuneta']:
    add(nombre, 'obra_civil', 'obracivil', 'elemento', {'tipo': nombre})

# --- Tele / señalización de pista ---
for nombre in ['Cable de alimentación de catenaria (AT)', 'Cable de retorno de tracción',
               'Caja de conexión de tierra (SAA)', 'Conmutador de seccionamiento',
               'Ficha de conexión de vía (FPV)', 'Bobina de sintonía de bloqueo',
               'Señal de ocupación de vía (SOV)', 'Tag RFID de vía']:
    add(nombre, 'telecom', 'telecom', 'elemento eléctrico', {'tipo': nombre})

# --- Vía: variantes dimensionales y de montaje ---
for perf in ['UIC54', 'UIC60']:
    for sep in [0.60, 0.625, 0.65]:
        add(f'Tendido {perf} a {sep} m', 'via', 'tendido',
            f'{perf} · {sep} m', {'perfil': perf, 'sep': sep})
for nombre in ['Placa de asiento de 4 agujeros', 'Placa de asiento de 6 agujeros',
               'Aplaca de cuña para puentes', 'Junta soldada aluminotérmica',
               'Junta soldada por resistencia eléctrica', 'Junta soldada por electroescoria',
               'Junta mecánica (mariposa)', 'Tope de vía (topes de retaco)',
               'Tope de vía provisional (portátil)']:
    add(nombre, 'via', 'sujecion', 'elemento de vía', {'tipo': nombre})

# --- Gálibos adicionales ---
for nombre in ['Gálibo de puente para AV (GC-AV)', 'Gálibo de puente para convencional (GB-AV)',
               'Gálibo para vehículos de obra (GC-OBR)', 'Gálibo de límite de andén',
               'Gálibo para cargas excepcionales']:
    add(nombre, 'galibo', 'galibo', 'perfil de tolerancia', {'tipo': nombre})

# --- Más muros ---
for nombre in ['Muro MG-II (tierra reforzada)', 'Muro de pantallas con anclajes',
               'Muro de hormigón en masa', 'Muro de escollera con frente de gaviones',
               'Muro cellulaire (células de hormigón)', 'Pantalla de pilotes secantes']:
    add(nombre, 'obra_fabrica', 'muro', 'contención', {'tipo': nombre})

bd['total'] = n
bd['familias'] = sorted(set(o['familia'] for o in bd['objetos']))
with open(RUTA, 'w') as f:
    json.dump(bd, f, ensure_ascii=False, indent=1)
print(f'BD ampliada: {n} objetos en {len(bd["familias"])} familias')
