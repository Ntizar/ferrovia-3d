#!/usr/bin/env python3
"""Validador de la BD ferroviaria: --min N (recuento) y --gen (todos con generador)."""
import json, sys

RUTA = '/home/nan/Projects/ferrovia-3d/datos/objetos.json'
with open(RUTA) as f:
    bd = json.load(f)

ok = True
if '--min' in sys.argv:
    n = int(sys.argv[sys.argv.index('--min') + 1])
    total = bd['total']
    print(f"objetos: {total} (mínimo {n})")
    if total < n:
        print('FALLO: recuento insuficiente'); ok = False
if '--gen' in sys.argv:
    sin = [o['id'] for o in bd['objetos'] if not o.get('gen')]
    print(f"sin generador: {len(sin)}")
    if sin:
        print('FALLO:', sin[:10]); ok = False
print('OK' if ok else 'FALLO')
sys.exit(0 if ok else 1)
