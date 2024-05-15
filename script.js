import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls for better camera manipulation
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White, brighter light
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Load GLTF model and handle setup after load
const loader = new GLTFLoader();
loader.load('plantcell/scene.gltf', function(gltf) {
    scene.add(gltf.scene);
    camera.position.set(70, 50, 170); // Adjust camera as needed
    
    addSprites(); // Add sprites after the model is loaded to ensure correct placement
    
    animate(); // Start animation loop after everything is loaded

    // Hide the loading overlay
    document.getElementById('loadingOverlay').style.display = 'none';
}, undefined, function(error) {
    console.error('An error happened:', error);
});

// Function to add dots and sprites
const dotGeometry = new THREE.SphereGeometry(6, 32, 32);
const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const dots = [];

function addSprites() {
    const positions = [
    { x: 10, y: 2, z: -25, label: 'Vacuole' },
    { x: 125, y: 2, z: -15, label: 'Golgi Apparatus' },
    { x: 5, y: -22, z: 115, label: 'Smooth ER' },
    { x: 15, y: -20, z: 85, label: 'Rough ER' },
    { x: 45, y: -2, z: 53, label: 'Nucleus' },
    { x: 55, y: -20, z: 60, label: 'Nucleolus' },
    { x: 145, y: -10, z: 53, label: 'Mitochondria' },
    { x: 70, y: -20, z: -105, label: 'Cytoplasm' },
    { x: -40, y: -5, z: -125, label: 'Chloroplast' },
    { x: -25, y: -25, z: 130, label: 'Cell Wall' },
        // More positions can be added here...
    ];

    positions.forEach((pos, index) => {
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.set(pos.x, pos.y, pos.z);
        dot.userData.label = pos.label;
        scene.add(dot);
        dots.push(dot);

        const textSprite = createTextSprite(String(index + 1));
        textSprite.position.copy(dot.position); // Position sprite directly on the dot
        scene.add(textSprite);
    });
}

// Function to create text sprite
function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const size = 81;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent background
    context.font = 'Bold 110px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'black';
    context.fillText(text, size / 2, size / 2);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(5, 5, 1); // Adjust sprite scale as needed
    return sprite;
}

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', function(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1) for raycasting.
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray. Only test for intersection against the dots array.
    const intersects = raycaster.intersectObjects(dots);

    if (intersects.length > 0) {
        // Call the function to show labels
        showLabel(intersects[0].object.userData.label, intersects[0].object.position);
    }
});

function showLabel(text, position) {
    // Create label container
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.padding = '10px';
    label.style.color = 'white';
    label.style.backgroundColor = 'black';
    label.style.border = '1px solid white';
    label.style.zIndex = '1000';
    label.style.display = 'flex';
    label.style.alignItems = 'center';

    // Create text node
    const labelText = document.createElement('span');
    labelText.textContent = text;
    label.appendChild(labelText);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.marginLeft = '10px';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '1em';

    // Add close functionality
    closeButton.onclick = function() {
        document.body.removeChild(label);
    };
    label.appendChild(closeButton);

    // Calculate and set position
    const canvasBounds = renderer.domElement.getBoundingClientRect();
    const labelPos = toScreenPosition(position, camera);
    label.style.left = `${canvasBounds.left + labelPos.x}px`;
    label.style.top = `${canvasBounds.top + labelPos.y}px`;

    // Append to the document body
    document.body.appendChild(label);
}

function toScreenPosition(position, camera) {
    const vector = new THREE.Vector3();
    vector.copy(position);
    vector.project(camera);

    return {
        x: (vector.x + 1) / 2 * window.innerWidth,
        y: -(vector.y - 1) / 2 * window.innerHeight
    };
}


// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

renderer.setClearColor(0x000000); // Set the background color to black
renderer.clear();
