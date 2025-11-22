<template>
  <div class="viewer-3d">
    <div class="viewer-header">
      <h3>Visualizador 3D</h3>
      <div class="viewer-info">
        <span v-if="geometryInfo">
          {{ geometryInfo.vertices }} vértices | 
          {{ geometryInfo.faces }} faces | 
          {{ geometryInfo.axis }} axis
        </span>
        <span v-else>Nenhuma superfície gerada</span>
      </div>
    </div>
    
    <div 
      ref="container"
      class="viewer-container"
      :style="{ width: width + 'px', height: height + 'px' }"
    ></div>
    
    <div class="viewer-controls">
      <div class="control-group">
        <label>Modo de Visualização:</label>
        <select v-model="renderMode" @change="updateRenderMode">
          <option value="solid">Sólido</option>
          <option value="wireframe">Wireframe</option>
          <option value="smooth">Suavizado</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>Ângulo de Revolução:</label>
        <input 
          type="range" 
          v-model.number="revolutionAngle" 
          @input="updateRevolutionAngle"
          min="30" 
          max="360"
          step="10"
        />
        <span class="value">{{ revolutionAngle }}°</span>
      </div>
      
      <div class="control-group">
        <label>Subdivisões:</label>
        <input 
          type="range" 
          v-model.number="subdivisions" 
          @input="updateSubdivisions"
          min="8" 
          max="64"
          step="4"
        />
        <span class="value">{{ subdivisions }}</span>
      </div>
      
      <button @click="resetCamera" class="btn btn-secondary">
        Reset Câmera
      </button>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { markRaw } from 'vue';
import { Revolution3D } from '../modules/Revolution3D.js';

export default {
  name: 'Viewer3D',
  props: {
    width: { type: Number, default: 400 },
    height: { type: Number, default: 400 },
    curveData: { type: Object, default: null },
    axis: { type: String, default: 'y' }
  },
  emits: ['geometry-generated'],
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      revolution: new Revolution3D(),
      mesh: null,
      geometryInfo: null,
      renderMode: 'solid',
      revolutionAngle: 360,
      subdivisions: 32,
      
      // Controles de câmera
      mouseDown: false,
      mouseX: 0,
      mouseY: 0,
      cameraDistance: 200,
      cameraRotationX: 0,
      cameraRotationY: 0
    };
  },
  mounted() {
    this.initThreeJS();
    this.setupEventListeners();
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    initThreeJS() {
      // Cena
      this.scene = markRaw(new THREE.Scene());
      this.scene.background = new THREE.Color(0xf0f0f0);
      
      // Câmera
      this.camera = markRaw(new THREE.PerspectiveCamera(
        75,
        this.width / this.height,
        0.1,
        1000
      ));
      this.resetCamera();
      
      // Renderer
      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true }));
      this.renderer.setSize(this.width, this.height);
      // Disable shadow map by default to improve performance on slower machines
      this.renderer.shadowMap.enabled = false;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.$refs.container.appendChild(this.renderer.domElement);
      
      // Luzes
      this.setupLighting();
      
      // Grade de referência
      this.setupGrid();
      
      // Eixos de referência
      this.setupAxes();
      
      // Bind animate so `this` remains correct in the RAF loop and start rendering
      this.animate = this.animate.bind(this);
      // Use a flag to only render when needed to reduce CPU/GPU usage
      this.needsRender = true;
      this.animate();
    },
    
    setupLighting() {
      // Luz ambiente
      const ambientLight = markRaw(new THREE.AmbientLight(0x404040, 0.4));
      this.scene.add(ambientLight);
      
      // Luz direcional
      const directionalLight = markRaw(new THREE.DirectionalLight(0xffffff, 0.8));
      directionalLight.position.set(50, 50, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      this.scene.add(directionalLight);
      
      // Luz de preenchimento
      const fillLight = markRaw(new THREE.DirectionalLight(0xffffff, 0.3));
      fillLight.position.set(-50, -50, -50);
      this.scene.add(fillLight);
    },
    
    setupGrid() {
      const gridHelper = markRaw(new THREE.GridHelper(200, 20, 0x888888, 0xcccccc));
      this.scene.add(gridHelper);
    },
    
    setupAxes() {
      const axesHelper = markRaw(new THREE.AxesHelper(100));
      this.scene.add(axesHelper);
    },
    
    setupEventListeners() {
      const canvas = this.renderer.domElement;
      
      canvas.addEventListener('mousedown', this.onMouseDown);
      canvas.addEventListener('mousemove', this.onMouseMove);
      canvas.addEventListener('mouseup', this.onMouseUp);
      canvas.addEventListener('wheel', this.onWheel);
    },
    
    onMouseDown(event) {
      this.mouseDown = true;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    },
    
    onMouseMove(event) {
      if (!this.mouseDown) return;
      
      const deltaX = event.clientX - this.mouseX;
      const deltaY = event.clientY - this.mouseY;
      
      this.cameraRotationY += deltaX * 0.01;
      this.cameraRotationX += deltaY * 0.01;
      
      // Limitar rotação vertical
      this.cameraRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotationX));
      
      this.updateCameraPosition();
      
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    },
    
    onMouseUp() {
      this.mouseDown = false;
    },
    
    onWheel(event) {
      event.preventDefault();
      this.cameraDistance += event.deltaY * 0.1;
      this.cameraDistance = Math.max(50, Math.min(500, this.cameraDistance));
      this.updateCameraPosition();
    },
    
    updateCameraPosition() {
      this.camera.position.x = this.cameraDistance * Math.cos(this.cameraRotationX) * Math.sin(this.cameraRotationY);
      this.camera.position.y = this.cameraDistance * Math.sin(this.cameraRotationX);
      this.camera.position.z = this.cameraDistance * Math.cos(this.cameraRotationX) * Math.cos(this.cameraRotationY);
      
      this.camera.lookAt(0, 0, 0);
      this.needsRender = true;
    },
    
    resetCamera() {
      this.cameraDistance = 200;
      this.cameraRotationX = 0.3;
      this.cameraRotationY = 0.5;
      this.updateCameraPosition();
    },
    
    generateSurface() {
      if (!this.curveData) {
        console.warn('Dados de curva não disponíveis');
        return;
      }

      // If curve exists but has no points, remove current mesh and clear info
      if (!this.curveData.points || this.curveData.points.length === 0) {
        if (this.mesh) {
          this.scene.remove(this.mesh);
          if (this.mesh.geometry) this.mesh.geometry.dispose();
          if (this.mesh.material) this.mesh.material.dispose();
          this.mesh = null;
        }

        this.geometryInfo = null;
        this.needsRender = true;
        this.$emit('geometry-generated', {
          vertices: [],
          faces: [],
          normals: [],
          info: null
        });

        return;
      }
      
      // Remover malha anterior (dispose + clear reference)
      if (this.mesh) {
        this.scene.remove(this.mesh);
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
        // Avoid keeping a stale reference to a disposed mesh
        this.mesh = null;
      }
      
      // Configurar revolução
      this.revolution.setProfile(this.curveData.points);
      this.revolution.setAxis(this.axis);
      this.revolution.setMaxAngle(this.revolutionAngle);
      this.revolution.setSubdivisions(this.subdivisions);
      
      // Generate typed geometry (positions, indices, normals)
      const typed = this.revolution.getTypedGeometry();

      if (!typed || !typed.positions || typed.positions.length === 0) {
        console.warn('Nenhuma geometria foi gerada');
        return;
      }

      // Reuse existing BufferGeometry when possible to avoid constant GC
      let threeGeometry = this.mesh ? this.mesh.geometry : null;

      const needsRecreate = !threeGeometry ||
        !threeGeometry.attributes.position ||
        threeGeometry.attributes.position.count !== (typed.info.vertexCount);

      if (needsRecreate) {
        if (threeGeometry) {
          threeGeometry.dispose();
        }
        threeGeometry = new THREE.BufferGeometry();
        threeGeometry.setAttribute('position', new THREE.BufferAttribute(typed.positions, 3));
        threeGeometry.setIndex(new THREE.BufferAttribute(typed.indices, 1));
        if (typed.normals && typed.normals.length > 0) {
          threeGeometry.setAttribute('normal', new THREE.BufferAttribute(typed.normals, 3));
        } else {
          threeGeometry.computeVertexNormals();
        }
      } else {
        // Update existing attributes in-place
        threeGeometry.attributes.position.array.set(typed.positions);
        threeGeometry.attributes.position.needsUpdate = true;

        if (threeGeometry.index && threeGeometry.index.array.length === typed.indices.length) {
          threeGeometry.index.array.set(typed.indices);
          threeGeometry.index.needsUpdate = true;
        } else {
          threeGeometry.setIndex(new THREE.BufferAttribute(typed.indices, 1));
        }

        if (typed.normals && threeGeometry.attributes.normal && threeGeometry.attributes.normal.array.length === typed.normals.length) {
          threeGeometry.attributes.normal.array.set(typed.normals);
          threeGeometry.attributes.normal.needsUpdate = true;
        } else if (typed.normals) {
          threeGeometry.setAttribute('normal', new THREE.BufferAttribute(typed.normals, 3));
        } else {
          threeGeometry.computeVertexNormals();
        }
      }
      
      // Material baseado no modo de renderização
      let material;
      switch (this.renderMode) {
        case 'wireframe':
          material = new THREE.MeshBasicMaterial({
            color: 0x0066cc,
            wireframe: true,
            wireframeLinewidth: 1
          });
          break;
        case 'smooth':
          material = new THREE.MeshStandardMaterial({
            color: 0x0066cc,
            roughness: 0.4,
            metalness: 0.1
          });
          break;
        default: // solid
          material = new THREE.MeshPhongMaterial({
            color: 0x0066cc,
            shininess: 30
          });
      }
      
      // Create or update mesh
      if (!this.mesh) {
        this.mesh = markRaw(new THREE.Mesh(threeGeometry, material));
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
      } else {
        // update geometry and material
        this.mesh.geometry = threeGeometry;
        this.mesh.material.dispose();
        this.mesh.material = material;
      }
      
      // Atualizar informações
      this.geometryInfo = typed.info;
      this.needsRender = true;
      
      // Emitir evento com geometria gerada
      this.$emit('geometry-generated', {
        vertices: this.revolution.vertices,
        faces: this.revolution.faces,
        normals: this.revolution.normals,
        info: typed.info
      });
    },
    
    updateRenderMode() {
      if (this.mesh) {
        let material;
        switch (this.renderMode) {
          case 'wireframe':
            material = new THREE.MeshBasicMaterial({
              color: 0x0066cc,
              wireframe: true,
              wireframeLinewidth: 1
            });
            break;
          case 'smooth':
            material = new THREE.MeshStandardMaterial({
              color: 0x0066cc,
              roughness: 0.4,
              metalness: 0.1
            });
            break;
          default: // solid
            material = new THREE.MeshPhongMaterial({
              color: 0x0066cc,
              shininess: 30
            });
        }
        
        this.mesh.material.dispose();
        this.mesh.material = material;
        this.needsRender = true;
      }
    },
    
    updateRevolutionAngle() {
      this.generateSurface();
    },
    
    updateSubdivisions() {
      this.generateSurface();
    },
    
    animate() {
      requestAnimationFrame(this.animate);
      // Only render when something changed (camera, geometry, material)
      if (this.needsRender) {
        this.renderer.render(this.scene, this.camera);
        this.needsRender = false;
      }
    },
    
    cleanup() {
      if (this.renderer) {
        this.renderer.dispose();
        if (this.$refs.container && this.renderer.domElement) {
          this.$refs.container.removeChild(this.renderer.domElement);
        }
      }
    }
  },
  watch: {
    curveData(newVal) {
      if (newVal && newVal.points) {
        this.generateSurface();
      }
    },
    axis() {
      this.generateSurface();
    },
    width() {
      if (this.renderer && this.camera) {
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
      }
    },
    height() {
      if (this.renderer && this.camera) {
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
      }
    }
  }
};
</script>

<style scoped>
.viewer-3d {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: white;
}

.viewer-header {
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.viewer-info {
  font-size: 12px;
  color: #666;
}

.viewer-container {
  position: relative;
  overflow: hidden;
}

.viewer-controls {
  padding: 15px;
  background: #f9f9f9;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  align-items: center;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
}

.control-group select,
.control-group input[type="range"] {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 13px;
}

.control-group input[type="range"] {
  padding: 0;
  border: none;
  background: transparent;
}

.value {
  font-size: 11px;
  color: #666;
  text-align: center;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>