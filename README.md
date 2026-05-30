# plantcellweb

Interactive 3D viewer for a plant cell and an animal cell, built with [Three.js](https://threejs.org/). You can rotate, pan, and zoom the model, and the page includes a numbered key of the labeled organelles.

I made this as a way to look at cell structures without being stuck with flat textbook diagrams.

## Models

- **Plant cell** — vacuole, Golgi apparatus, smooth and rough ER, nucleus, nucleolus, mitochondria, cytoplasm, chloroplast, cell wall
- **Animal cell** — cell membrane, lysosomes, mitochondria, nucleus

Models are loaded from `.gltf` files in `plantcell/`, `animal_cell/`, and `animal_cell1/`. Textures live in each model's `textures/` folder. Licenses for the models are included next to each one in `license.txt`.

## Running it

No build step. Because the page uses ES modules and loads local `.gltf` files, you need to serve it over HTTP rather than opening the file directly:

```
python3 -m http.server
```

Then open `http://localhost:8000/index.html` for the plant cell or `index2.html` for the animal cell.

## Tech

- Three.js (loaded from a CDN via importmap)
- GLTFLoader for the models
- OrbitControls for camera interaction
