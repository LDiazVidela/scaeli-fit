# Base de alimentos ampliada

`data/foods_extra.json` (489 alimentos) se genera a partir de dos fuentes:

- **USDA SR Legacy** (dominio público): `want.txt` lista, por regex, qué alimentos tomar y con qué nombre en español y porción casera. `pick.py` busca cada uno en el JSON de USDA (`FoodData_Central_sr_legacy_food_json_2018-04.json`, descargable de fdc.nal.usda.gov) y arma `picked.json`.
- **Comidas argentinas** sin equivalente en USDA: `argentinos.txt`, valores por 100 g tomados de tablas argentinas (Argenfoods UNLu, SARA) y recetas típicas, redondeados. Son valores de referencia, no de laboratorio.

Cada registro: `id, name, kcal, p, c, f (por 100 g), unitG, unitName, src` (`usda:<ndb>` o `ar`).
Los nombres que ya existían en `foods.json` se descartan al fusionar, así que los dos archivos no se pisan.
