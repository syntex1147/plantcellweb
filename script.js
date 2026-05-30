import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { OrbitControls } from 'OrbitControls';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaeb8be);
scene.fog = new THREE.Fog(0xaeb8be, 420, 980);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.78;
controls.minDistance = 150;
controls.maxDistance = 720;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
setCameraPose();
controls.addEventListener('start', () => {
    controls.autoRotate = false;
});
controls.update();

function setCameraPose() {
    const narrow = window.innerWidth < 760;
    camera.position.set(
        narrow ? 210 : 142,
        narrow ? 135 : 88,
        narrow ? 575 : 360
    );
    controls.target.set(48, -5, 8);
}

scene.add(new THREE.HemisphereLight(0xffffff, 0x5d6870, 2.25));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
keyLight.position.set(-100, 160, 170);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xddeeff, 1.2);
rimLight.position.set(180, 30, -120);
scene.add(rimLight);

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingBar = document.getElementById('loadingBar');
const loadingPercent = document.getElementById('loadingPercent');
const loadingStatus = document.getElementById('loadingStatus');
const loadingStartedAt = performance.now();
let displayedProgress = 0;

const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = () => updateLoadingProgress(4);
loadingManager.onProgress = (url, loaded, total) => {
    const progress = total > 0 ? (loaded / total) * 96 : displayedProgress + 8;
    updateLoadingProgress(progress);
    if (loadingStatus) {
        loadingStatus.textContent = url.includes('textures') ? 'Sequencing textures' : 'Culturing specimen';
    }
};
loadingManager.onLoad = () => updateLoadingProgress(100);
loadingManager.onError = () => setLoadingFailed();

const loader = new GLTFLoader(loadingManager);
loader.load('plantcell/scene.gltf', (gltf) => {
    const model = gltf.scene;
    tuneModel(model);
    scene.add(model);
    hideLoadingOverlay();
    animate();
}, (event) => {
    if (event.total > 0) {
        updateLoadingProgress((event.loaded / event.total) * 82);
    }
}, () => {
    setLoadingFailed();
});

function tuneModel(model) {
    model.traverse((object) => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
            if (!material) return;
            if ('roughness' in material) material.roughness = Math.max(material.roughness ?? 0.72, 0.72);
            if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0.05, 0.08);
            if ('envMapIntensity' in material) material.envMapIntensity = 0.72;
            if (material.emissive) material.emissiveIntensity = 0.1;
            material.needsUpdate = true;
        });
    });
}

function hideLoadingOverlay() {
    updateLoadingProgress(100);
    if (loadingStatus) loadingStatus.textContent = 'Specimen online';
    if (loadingOverlay) {
        const remainingDisplay = Math.max(0, 950 - (performance.now() - loadingStartedAt));
        window.setTimeout(() => {
            loadingOverlay.classList.add('is-complete');
            window.setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 520);
        }, remainingDisplay);
    }
}

function updateLoadingProgress(value) {
    displayedProgress = Math.max(displayedProgress, Math.min(100, Math.round(value)));
    if (loadingBar) loadingBar.style.width = `${displayedProgress}%`;
    if (loadingPercent) loadingPercent.textContent = `${displayedProgress}%`;
}

function setLoadingFailed() {
    if (!loadingOverlay) return;
    loadingOverlay.classList.add('is-error');
    if (loadingStatus) loadingStatus.textContent = 'Specimen offline';
    if (loadingPercent) loadingPercent.textContent = 'ERR';
}

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
];

const dotGeometry = new THREE.SphereGeometry(5.8, 32, 32);
const dotMaterial = new THREE.MeshBasicMaterial({
    color: 0xf7fbfb,
    depthTest: false,
    depthWrite: false
});
const dots = [];

positions.forEach((position, index) => {
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(position.x, position.y, position.z);
    dot.userData.label = position.label;
    scene.add(dot);
    dots.push(dot);

    const sprite = createTextSprite(String(index + 1));
    sprite.position.copy(dot.position);
    scene.add(sprite);
});

function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(247, 251, 251, 0.92)';
    context.beginPath();
    context.arc(size / 2, size / 2, 48, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(16, 21, 22, 0.28)';
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = '#101516';
    context.font = '900 62px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, size / 2, size / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(14, 14, 1);
    return sprite;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('click', onCanvasClick);

function onCanvasClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(dots);
    if (intersects.length > 0) {
        showLabel(intersects[0].object.userData.label, intersects[0].object.position);
    }
}

function showLabel(text, position) {
    document.querySelectorAll('.model-label').forEach((label) => label.remove());

    const label = document.createElement('div');
    label.className = 'model-label';

    const labelText = document.createElement('span');
    labelText.textContent = text;
    label.appendChild(labelText);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close label');
    closeButton.textContent = 'x';
    closeButton.onclick = () => label.remove();
    label.appendChild(closeButton);

    const labelPos = toScreenPosition(position);
    label.style.left = `${Math.min(window.innerWidth - 18, Math.max(18, labelPos.x))}px`;
    label.style.top = `${Math.min(window.innerHeight - 18, Math.max(18, labelPos.y))}px`;

    document.body.appendChild(label);
}

function toScreenPosition(position) {
    const vector = position.clone();
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (controls.autoRotate) {
        setCameraPose();
        controls.update();
    }
});
