<template>
  <div ref="container" class="spiral-flight-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const container = ref(null);
let renderer, scene, camera, controls, spiralCurve, spiralLine, alusMesh, animationId, trailLine, trailGeometry;

// Parameters
const phi = 1.61803398875; // Golden ratio
const cycles = 80; // Number of spiral cycles
const pointsPerCycle = 20;
const totalPoints = cycles * pointsPerCycle;
const maxRadius = 20;
const minRadius = 1;
const maxHeight = 30;
const plateauFraction = 0.1; // Fraction of path at plateau
const spiralPoints = [];

function generateFibonacciSpiral3D() {
  let theta = 0;
  let radius = minRadius;
  let height = 0;
  let heightStep = maxHeight / (totalPoints * (1 - plateauFraction) / 2);
  let plateauStart = totalPoints * (1 - plateauFraction) / 2;
  let plateauEnd = totalPoints * (1 + plateauFraction) / 2;

  for (let i = 0; i < totalPoints; i++) {
    // Golden angle increment
    theta += Math.PI * 2 / phi;
    radius *= phi ** (1 / pointsPerCycle);
    if (i < plateauStart) {
      height += heightStep;
    } else if (i > plateauEnd) {
      height -= heightStep;
    }
    // 3D helical spiral
    const x = radius * Math.cos(theta);
    const y = height;
    const z = radius * Math.sin(theta);
    spiralPoints.push(new THREE.Vector3(x, y, z));
  }
}

generateFibonacciSpiral3D();

// Create a CatmullRomCurve3 for C² continuity
spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
spiralCurve.curveType = 'catmullrom';
spiralCurve.closed = false;

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101020);

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000);
  camera.position.set(0, maxHeight / 2, maxRadius * 2);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  container.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;


  // Spiral curve geometry (trajetória completa)
  const curveGeometry = new THREE.BufferGeometry().setFromPoints(spiralCurve.getPoints(totalPoints * 5));
  const curveMaterial = new THREE.LineBasicMaterial({ color: 0xffd700, opacity: 0.2, transparent: true });
  spiralLine = new THREE.Line(curveGeometry, curveMaterial);
  scene.add(spiralLine);

  // Trail (trajetória percorrida) com gradiente de cor
  trailGeometry = new THREE.BufferGeometry();
  // Inicialmente, cor neutra, mas será atualizado a cada frame
  const trailMaterial = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 8 });
  trailLine = new THREE.Line(trailGeometry, trailMaterial);
  scene.add(trailLine);

  // Alus (moving point)
  const alusGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const alusMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });
  alusMesh = new THREE.Mesh(alusGeometry, alusMaterial);
  scene.add(alusMesh);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);
}

// Arc-length parameterization for constant velocity
const arcLengthDivisions = totalPoints * 10;
const arcLengths = [];
let totalArcLength = 0;
function computeArcLengths() {
  let prev = spiralCurve.getPoint(0);
  arcLengths.push(0);
  for (let i = 1; i <= arcLengthDivisions; i++) {
    const t = i / arcLengthDivisions;
    const pt = spiralCurve.getPoint(t);
    totalArcLength += pt.distanceTo(prev);
    arcLengths.push(totalArcLength);
    prev = pt;
  }
}
computeArcLengths();

function getTforArcLength(s) {
  // Binary search for t such that arcLengths[t*arcLengthDivisions] ≈ s
  let low = 0, high = arcLengthDivisions;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (arcLengths[mid] < s) low = mid + 1;
    else high = mid;
  }
  return Math.min(1, low / arcLengthDivisions);
}


let elapsed = 0;
const velocity = totalArcLength / 20; // Complete in 20 seconds

function animate() {
  animationId = requestAnimationFrame(animate);
  controls.update();
  elapsed += 0.016; // ~60fps
  let s = (elapsed * velocity) % totalArcLength;
  let t = getTforArcLength(s);
  const pos = spiralCurve.getPoint(t);
  alusMesh.position.copy(pos);


  // Atualiza a trilha (do início até a posição atual) com gradiente de cor
  const numTrailPoints = Math.max(2, Math.floor(t * arcLengthDivisions));
  const trailPoints = spiralCurve.getPoints(numTrailPoints);
  trailGeometry.setFromPoints(trailPoints);

  // Gradiente de cor ao longo do rastro (ex: do azul ao magenta)
  const colors = [];
  for (let i = 0; i < trailPoints.length; i++) {
    // Interpolação de cor: azul (0,1,1) para magenta (1,0,1)
    const f = i / (trailPoints.length - 1);
    const r = f;
    const g = 1 - f;
    const b = 1;
    colors.push(r, g, b);
  }
  trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  renderer.render(scene, camera);
}

onMounted(() => {
  createScene();
  animate();
  window.addEventListener('resize', onWindowResize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  renderer.dispose();
  window.removeEventListener('resize', onWindowResize);
});

function onWindowResize() {
  if (!container.value) return;
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}
</script>

<style scoped>
.spiral-flight-container {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}
</style>
