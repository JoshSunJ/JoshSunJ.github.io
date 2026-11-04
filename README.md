# Joshua Sun — Portfolio

Joshua Sun’s responsive, monochrome portfolio, with selected projects in software engineering, machine learning, and applied mathematics.

Website: https://joshsunj.github.io

## Local preview

Run `python3 -m http.server 3000` from this directory, then open http://localhost:3000.

## Contents

- `index.html`: portfolio content, inline ASCII portrait, project links, and contact links.
- `styles.css`: monochrome design, responsive layout, and raised pressable controls.
- `script.js`: project disclosures, pointer effects, and the saved motion preference.
- `resume.pdf`: bundled résumé.
- `favicon.svg`: site icon.
- `paw-cursor.svg`: monochrome bear paw cursor for a mouse or trackpad.

## Publishing

GitHub Pages publishes the `main` branch from the repository root. No build step is required. The `.nojekyll` file keeps the site as plain static files.

## Design reference

The raised controls use a fixed base and a translating front face, inspired by Josh W. Comeau’s [3D button tutorial](https://www.joshwcomeau.com/animation/3d-button/), adapted to this portfolio’s monochrome design.

The frameless ASCII portrait responds to the mouse with a short character ripple, shares the motion toggle, and stays static for touch or reduced motion preferences. Its caption reads “me @ griffith observatory.”
