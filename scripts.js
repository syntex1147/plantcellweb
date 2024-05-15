import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-3, 10, -10);
dirLight.castShadow = true;
scene.add(dirLight);

// GLTF model loading
const loader = new GLTFLoader();
loader.load('animal_cell1/scene.gltf', function(gltf) {
    scene.add(gltf.scene);
    camera.position.set(-200, 150, 200);
    gltf.scene.position.y += 50;
    document.getElementById('loadingOverlay').style.display = 'none';
    animate();
}, undefined, function(error) {
    console.error('An error happened:', error);
    document.getElementById('loadingOverlay').textContent = 'Failed to load model.';
});

// Dots setup
const dotGeometry = new THREE.SphereGeometry(7, 32, 32);
const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x183EFA });
const dots = [];
const positions = [
    { x: -240, y: 52, z: -20, label: 'Cell Membrane' },
    { x: -190, y: 52, z: -15, label: 'Lysosomes' },
    { x: -90, y: 54, z: 120, label: 'Mitochondria' },
    { x: -5, y: 80, z: -15, label: 'Nucleus' },
];


function createTextSprite(text, dot) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 144;  // Sufficient width to accommodate larger text
    canvas.height = 144;  // Sufficient height to accommodate larger text

    context.fillStyle = '#000';  // Text color
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '100px Arial';  // Large font size for clarity
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });

    // Adjust sprite scaling here to make the numbers 2.5x bigger
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(15, 15, 1);  // Original scale * 2.5
    sprite.position.set(dot.position.x, dot.position.y, dot.position.z + 1); // Position slightly in front of the dot to prevent z-fighting

    return sprite;
}


positions.forEach((pos, index) => {
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(pos.x, pos.y, pos.z);
    dot.userData.label = pos.label;
    scene.add(dot);
    dots.push(dot);

    const sprite = createTextSprite(index + 1, dot);
    scene.add(sprite);  // Add sprite directly to the scene, not as a child
});

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onMouseClick);
function onMouseClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(dots, true); // Include descendants

    for (let intersect of intersects) {
        const obj = intersect.object;
        if (obj.userData.label) {
            showLabel(obj.userData.label, intersect.point);
            return;
        }
    }
}

function showLabel(text, position) {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.textContent = text;  // Display the label text
    label.style.padding = '10px';
    label.style.color = 'white';
    label.style.backgroundColor = 'black';
    label.style.border = '1px solid white';
    label.style.zIndex = '1000';

    const closeButton = document.createElement('span');
    closeButton.textContent = 'X';
    closeButton.style.float = 'right';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = 'white';
    closeButton.style.marginLeft = '5px';
    closeButton.onclick = function() {
        document.body.removeChild(label);
    };
    label.appendChild(closeButton);

    const canvasBounds = renderer.domElement.getBoundingClientRect();
    const labelPos = toScreenPosition(position, camera);
    label.style.left = `${canvasBounds.left + labelPos.x}px`;
    label.style.top = `${canvasBounds.top + labelPos.y}px`;

    document.body.appendChild(label);
}


function toScreenPosition(position, camera) {
    const vector = new THREE.Vector3(position.x, position.y, position.z);
    vector.project(camera);
    return {
        x: (vector.x + 1) / 2 * window.innerWidth,
        y: -(vector.y - 1) / 2 * window.innerHeight
    };
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

