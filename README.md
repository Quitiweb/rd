# Ruiz & Davies — Web

Sitio informativo de **Ruiz & Davies** (consultoría, desarrollo web y marketing).
Web estática y bilingüe (ES/EN) generada con [Eleventy](https://www.11ty.dev/).

## Desarrollo

```bash
npm install
npm run serve   # servidor local con recarga en http://localhost:8080
npm run build   # genera el sitio en _site/
```

## Estructura

```
src/
├─ _data/
│  ├─ site.json       # nombre, URL, idiomas, contacto
│  ├─ i18n.json       # TODOS los textos, en ES y EN
│  ├─ langmeta.json   # rutas y locale por idioma
│  └─ projects.json   # los "Trabajos" (portfolio)
├─ _includes/
│  ├─ layouts/base.njk
│  └─ partials/        # header, footer
├─ assets/            # css, js, imágenes
├─ index.njk          # home (se genera en ES y EN por paginación)
├─ 404.njk
├─ sitemap.njk
└─ robots.txt
```

## Tareas comunes

**Añadir un trabajo nuevo:** edita `src/_data/projects.json` y añade un objeto.
Cada proyecto tiene `category` y `summary` en `es` y `en`.

**Cambiar textos:** todo vive en `src/_data/i18n.json` (claves `es` y `en`).

**Cambiar datos de contacto / dominio:** `src/_data/site.json` y `src/CNAME`.

## Pendiente (placeholders a confirmar)

- Email de contacto, teléfono/WhatsApp y dominio final en `site.json` y `CNAME`.
- Descripciones reales de cada proyecto en `projects.json`.
- Logo/identidad definitiva (ahora hay un marcador "R&D" + favicon SVG).
