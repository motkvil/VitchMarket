#!/usr/bin/env python3
"""Precios reales de Mercadona para el catálogo del juego.

Descarga el catálogo público de tienda.mercadona.es (almacén mad1, Madrid) y
regenera productos.js y productos.json con el precio, el formato y el IVA
legal de cada producto del juego. Uso:

    python3 mercadona_precios.py            # descarga y regenera
    python3 mercadona_precios.py cache.json # usa una descarga guardada

MAP empareja cada id del juego con el id del producto en Mercadona.
El IVA va por ley (art. 91 Ley 37/1992): 4 % pan (común y especial, también el de molde: Resolución
de la DGT de 24-02-2025), leche, quesos, huevos,
frutas, verduras, legumbres, cereales, harina panificable y aceite de oliva;
10 % el resto de alimentos y el agua; 21 % alcohol, refrescos azucarados y droguería.
"""
import json, sys, time, datetime, urllib.request

API = 'https://tienda.mercadona.es/api/categories/'
WH = 'mad1'
# id juego: (id Mercadona, nombre en el juego, emoji, IVA %, +18)
MAP = {
 1: ('10380', 'Leche entera', '🥛', 4, 0),
 2: ('10382', 'Leche semidesnatada', '🥛', 4, 0),
 3: ('22313', 'Yogur natural', '🥣', 10, 0),
 4: ('20559', 'Yogur griego', '🥣', 10, 0),
 5: ('51110', 'Queso rallado', '🧀', 4, 0),
 6: ('50543', 'Queso en lonchas', '🧀', 4, 0),
 7: ('20716', 'Mantequilla', '🧈', 10, 0),
 8: ('31505', 'Huevos', '🥚', 4, 0),
 9: ('13810', 'Pan de molde', '🍞', 4, 0),
 10: ('83202.1', 'Barra de pan', '🥖', 4, 0),
 11: ('82931', 'Croissants', '🥐', 10, 0),
 12: ('14102', 'Galletas María', '🍪', 10, 0),
 13: ('22966', 'Cereales corn flakes', '🥣', 10, 0),
 14: ('6277', 'Espaguetis', '🍝', 10, 0),
 15: ('5063', 'Arroz largo', '🍚', 4, 0),
 16: ('17108', 'Tomate frito', '🥫', 10, 0),
 17: ('4740', 'Aceite de oliva virgen extra', '🫒', 4, 0),
 18: ('4040', 'Aceite de girasol', '🌻', 10, 0),
 19: ('19897', 'Azúcar', '🍬', 10, 0),
 20: ('19731', 'Sal fina', '🧂', 10, 0),
 21: ('29100', 'Harina de trigo', '🌾', 4, 0),
 22: ('15923', 'Café molido mezcla', '☕', 10, 0),
 23: ('23773', 'Chocolate negro', '🍫', 10, 0),
 24: ('86146', 'Patatas fritas', '🍟', 10, 0),
 25: ('22911', 'Aceitunas rellenas', '🫒', 10, 0),
 26: ('18092', 'Atún claro', '🐟', 10, 0),
 27: ('26029', 'Garbanzos cocidos', '🫘', 10, 0),
 28: ('26030', 'Lentejas cocidas', '🫘', 10, 0),
 29: ('15604', 'Gazpacho', '🍅', 10, 0),
 30: ('2787', 'Pechuga de pollo', '🍗', 10, 0),
 31: ('2788', 'Muslos de pollo', '🍗', 10, 0),
 32: ('62113', 'Merluza congelada', '🐟', 10, 0),
 33: ('24511', 'Lomos de salmón', '🐟', 10, 0),
 34: ('59256', 'Jamón cocido', '🥓', 10, 0),
 35: ('6048', 'Chorizo', '🌭', 10, 0),
 36: ('53141', 'Salchichas', '🌭', 10, 0),
 37: ('63613', 'Pizza barbacoa', '🍕', 10, 0),
 38: ('3819', 'Plátano de Canarias', '🍌', 4, 0),
 39: ('3269', 'Manzanas golden', '🍎', 4, 0),
 40: ('3277', 'Naranjas', '🍊', 4, 0),
 41: ('69971', 'Tomates', '🍅', 4, 0),
 42: ('68130', 'Lechuga iceberg', '🥬', 4, 0),
 43: ('69089', 'Cebollas', '🧅', 4, 0),
 44: ('69586', 'Zanahorias', '🥕', 4, 0),
 45: ('3858', 'Aguacates', '🥑', 4, 0),
 46: ('3236', 'Limones', '🍋', 4, 0),
 47: ('3313', 'Uva blanca', '🍇', 4, 0),
 48: ('69166', 'Patatas', '🥔', 4, 0),
 49: ('15759', 'Agua mineral', '💧', 10, 0),
 50: ('21726', 'Refresco de cola', '🥤', 21, 0),
 51: ('3362', 'Zumo de naranja', '🧃', 10, 0),
 52: ('66462', 'Cerveza', '🍺', 21, 1),
 53: ('35710', 'Vino tinto Rioja', '🍷', 21, 1),
 54: ('28921', 'Cava brut', '🍾', 21, 1),
 55: ('28613', 'Whisky', '🥃', 21, 1),
 56: ('47835', 'Papel higiénico', '🧻', 21, 0),
 57: ('49176', 'Papel de cocina', '🧻', 21, 0),
 58: ('46567', 'Gel de ducha', '🧴', 21, 0),
 59: ('35419', 'Champú', '🧴', 21, 0),
 60: ('73978', 'Pasta de dientes', '🪥', 21, 0),
 61: ('86400', 'Detergente líquido', '🧺', 21, 0),
 62: ('42441', 'Lavavajillas', '🧽', 21, 0),
 63: ('49750', 'Bolsas de basura', '🗑️', 21, 0),
 64: ('14122', 'Suavizante', '🧴', 21, 0),
 65: ('8966', 'Helado de vainilla', '🍨', 10, 0),
 66: ('61261', 'Brócoli congelado', '🥦', 4, 0),
}

def get(u):
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30) as r:
                return json.load(r)
        except Exception:
            time.sleep(2)
    raise SystemExit('No se pudo descargar ' + u)

def download():
    out = {}
    for t in get(API + '?lang=es&wh=' + WH)['results']:
        for c in t['categories']:
            for sc in get(API + str(c['id']) + '/?lang=es&wh=' + WH).get('categories', []):
                for p in sc.get('products', []):
                    out[p['id']] = p
            time.sleep(.3)
    return out

def fmt_of(p):
    pi = p['price_instructions']; pk = p.get('packaging') or ''
    sz, f = pi.get('unit_size'), pi.get('size_format') or ''
    if sz:
        s = ('%g' % sz).replace('.', ',')
        if f == 'kg' and sz < 1: s, f = '%d' % round(sz * 1000), 'g'
        if f == 'l' and sz < 1: s, f = '%d' % round(sz * 100), 'cl'
        return (pk + ' ' + s + ' ' + f).strip()
    return pk

def main():
    if len(sys.argv) > 1:
        raw = json.load(open(sys.argv[1]))
        prods = {x['mid']: x for x in raw} if isinstance(raw, list) else raw
        def row(mid):
            x = prods[mid]; return float(x['p']), (((x.get('pk') or '') + ' ' + (('%g' % x['size']).replace('.', ',') + ' ' + (x['fmt'] or '') if x.get('size') else '')).strip())
    else:
        prods = download()
        def row(mid):
            p = prods[mid]; return float(p['price_instructions']['unit_price']), fmt_of(p)
    cat = []
    for i in sorted(MAP):
        mid, n, e, iva, age = MAP[i]
        price, f = row(mid)
        d = {'id': i, 'n': n, 'f': f, 'p': round(price * 100), 'e': e, 'iva': iva, 'mid': mid}
        if age: d['age'] = True
        cat.append(d)
    today = datetime.date.today().isoformat()
    js = '/* Catálogo del juego: precios reales de Mercadona (tienda.mercadona.es, almacén ' + WH + ') del ' + today + '.\n   p en céntimos con IVA incluido; iva = tipo legal en %. Regenerar con mercadona_precios.py */\nwindow.CATALOGO=' + json.dumps(cat, ensure_ascii=False) + ';\n'
    open('productos.js', 'w').write(js)
    json.dump({'fuente': 'tienda.mercadona.es (' + WH + ') ' + today, 'verificado': True, 'productos': cat}, open('productos.json', 'w'), ensure_ascii=False, indent=1)
    print(len(cat), 'productos')

if __name__ == '__main__':
    main()
