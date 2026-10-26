import json, re, sys
d = json.load(open('FoodData_Central_sr_legacy_food_json_2018-04.json'))['SRLegacyFoods']
NUT = {'208': 'kcal', '203': 'p', '205': 'c', '204': 'f', '291': 'fib'}
idx = []
for f in d:
    n = {}
    for x in f['foodNutrients']:
        k = NUT.get(x['nutrient']['number'])
        if k: n[k] = x['amount']
    idx.append({'ndb': f['ndbNumber'], 'desc': f['description'], 'cat': f['foodCategory']['description'], **n,
                'portions': [(p.get('modifier') or p['measureUnit']['name'], p['gramWeight']) for p in f.get('foodPortions', [])][:3]})
json.dump(idx, open('idx.json', 'w'))
# Lista de búsquedas: (regex sobre description, nombre en español, unitG, unitName)
# El script elige la coincidencia con la descripción más corta (la más genérica).
WANT = [l.strip().split('|') for l in open('want.txt', encoding='utf-8') if l.strip() and not l.startswith('#')]
out, miss = [], []
for w in WANT:
    rx, name = w[0], w[1]
    unitG = float(w[2]) if len(w) > 2 and w[2] else None
    unitName = w[3] if len(w) > 3 and w[3] else None
    cands = [i for i in idx if re.search(rx, i['desc'], re.I)]
    if not cands: miss.append(rx); continue
    cands.sort(key=lambda i: len(i['desc']))
    b = cands[0]
    out.append({'ndb': b['ndb'], 'usda': b['desc'], 'name': name, 'kcal': round(b.get('kcal', 0)), 'p': round(b.get('p', 0), 1),
                'c': round(b.get('c', 0), 1), 'f': round(b.get('f', 0), 1), 'unitG': unitG, 'unitName': unitName})
json.dump(out, open('picked.json', 'w'), ensure_ascii=False, indent=0)
print(len(out), 'elegidos;', len(miss), 'sin coincidencia:', miss)
for o in out: print(f"{o['kcal']:4} {o['p']:5} {o['c']:5} {o['f']:5}  {o['name']:38} <- {o['usda'][:70]}")
