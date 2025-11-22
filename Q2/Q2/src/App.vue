<template>
  <div class="app">
    <header class="app-header">
      <h1>Sistema de Modelagem Geométrica</h1>
      <p>Criação de Superfícies de Revolução 3D</p>
    </header>
    
    <main class="app-main">
      <div class="workspace">
        <!-- Painel Esquerdo - Editor 2D -->
        <div class="panel panel-left">
          <CurveEditor
            :width="leftPanelWidth"
            :height="editorHeight"
            @curve-updated="onCurveUpdated"
            @axis-changed="onAxisChanged"
          />
        </div>
        
        <!-- Painel Direito - Visualizador 3D -->
        <div class="panel panel-right">
          <Viewer3D
            :width="rightPanelWidth"
            :height="editorHeight"
            :curve-data="curveData"
            :axis="revolutionAxis"
            @geometry-generated="onGeometryGenerated"
          />
        </div>
      </div>
      
      <!-- Controles e Exportação -->
      <div class="controls-panel">
        <div class="control-section">
          <h3>Controles Gerais</h3>
          
          <div class="control-grid">
            <button 
              @click="generateSurface" 
              class="btn btn-primary"
              :disabled="!curveData || !curveData.points || curveData.points.length === 0"
            >
              Gerar Superfície
            </button>
            
            <button @click="clearAll" class="btn btn-secondary">
              Limpar Tudo
            </button>
          </div>
        </div>
        
        <div class="control-section">
          <h3>Exportação</h3>
          
          <div class="control-grid">
            <button 
              @click="exportOBJ" 
              class="btn btn-export"
              :disabled="!hasGeometry"
            >
              Exportar OBJ
            </button>
            
            <button 
              @click="exportSTL" 
              class="btn btn-export"
              :disabled="!hasGeometry"
            >
              Exportar STL
            </button>
            
            <button 
              @click="exportJSON" 
              class="btn btn-export"
              :disabled="!hasGeometry"
            >
              Exportar JSON
            </button>
          </div>
        </div>
        
        <div class="control-section">
          <h3>Informações da Geometria</h3>
          
          <div class="info-grid" v-if="geometryInfo">
            <div class="info-item">
              <label>Vértices:</label>
              <span>{{ geometryInfo.vertexCount }}</span>
            </div>
            
            <div class="info-item">
              <label>Faces:</label>
              <span>{{ geometryInfo.faceCount }}</span>
            </div>
            
            <div class="info-item">
              <label>Eixo:</label>
              <span>{{ geometryInfo.axis.toUpperCase() }}</span>
            </div>
            
            <div class="info-item">
              <label>Ângulo:</label>
              <span>{{ geometryInfo.maxAngle }}°</span>
            </div>
            
            <div class="info-item">
              <label>Subdivisões:</label>
              <span>{{ geometryInfo.subdivisions }}</span>
            </div>
          </div>
          
          <div v-else class="no-geometry">
            Nenhuma geometria gerada
          </div>
        </div>
      </div>
    </main>
    
    <!-- Status Bar -->
    <footer class="status-bar">
      <div class="status-item">
        <strong>Curva:</strong> 
        {{ curveData ? `${curveData.info.controlPoints} pontos, ${curveData.info.curveType}, grau ${curveData.info.degree}` : 'Nenhuma' }}
      </div>
      
      <div class="status-item" v-if="geometryInfo">
        <strong>Superfície:</strong> 
        {{ geometryInfo.vertexCount }} vértices, {{ geometryInfo.faceCount }} faces
      </div>
    </footer>
  </div>
</template>

<script>
import CurveEditor from './components/CurveEditor.vue';
import Viewer3D from './components/Viewer3D.vue';
import { GeometryExporter } from './modules/GeometryExporter.js';

export default {
  name: 'App',
  components: {
    CurveEditor,
    Viewer3D
  },
  data() {
    return {
      curveData: null,
      revolutionAxis: 'y',
      geometryData: null,
      geometryInfo: null,
      exporter: new GeometryExporter(),
      
      // Layout dimensions
      leftPanelWidth: 500,
      rightPanelWidth: 500,
      editorHeight: 500
    };
  },
  computed: {
    hasGeometry() {
      return this.geometryData && this.geometryData.vertices && this.geometryData.vertices.length > 0;
    }
  },
  mounted() {
    this.setupLayout();
    window.addEventListener('resize', this.setupLayout);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.setupLayout);
  },
  methods: {
    setupLayout() {
      const workspace = document.querySelector('.workspace');
      if (workspace) {
        const rect = workspace.getBoundingClientRect();
        const availableWidth = rect.width - 40; // padding
        
        this.leftPanelWidth = Math.floor(availableWidth / 2) - 10;
        this.rightPanelWidth = Math.floor(availableWidth / 2) - 10;
      }
    },
    
    onCurveUpdated(data) {
      this.curveData = data;
      console.log('Curva atualizada:', data.info);
    },
    
    onAxisChanged(axis) {
      this.revolutionAxis = axis;
      console.log('Eixo de revolução alterado para:', axis);
    },
    
    onGeometryGenerated(geometry) {
      this.geometryData = geometry;
      this.geometryInfo = geometry.info;
      
      // Configurar exportador
      this.exporter.setGeometry(
        geometry.vertices,
        geometry.faces,
        geometry.normals
      );
      
      console.log('Geometria gerada:', geometry.info);
    },
    
    generateSurface() {
      // Trigger manual surface generation if needed
      console.log('Regenerando superfície...');
    },
    
    clearAll() {
      this.curveData = null;
      this.geometryData = null;
      this.geometryInfo = null;
      console.log('Tudo limpo');
    },
    
    exportOBJ() {
      if (!this.hasGeometry) {
        alert('Nenhuma geometria disponível para exportação');
        return;
      }
      
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        this.exporter.downloadOBJ(`superficie-${timestamp}.obj`);
        console.log('Arquivo OBJ exportado');
      } catch (error) {
        console.error('Erro ao exportar OBJ:', error);
        alert('Erro ao exportar arquivo OBJ');
      }
    },
    
    exportSTL() {
      if (!this.hasGeometry) {
        alert('Nenhuma geometria disponível para exportação');
        return;
      }
      
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        this.exporter.downloadSTL(`superficie-${timestamp}.stl`);
        console.log('Arquivo STL exportado');
      } catch (error) {
        console.error('Erro ao exportar STL:', error);
        alert('Erro ao exportar arquivo STL');
      }
    },
    
    exportJSON() {
      if (!this.hasGeometry) {
        alert('Nenhuma geometria disponível para exportação');
        return;
      }
      
      try {
        const parameters = {
          curveType: this.curveData?.info?.curveType || 'unknown',
          degree: this.curveData?.info?.degree || 3,
          axis: this.revolutionAxis,
          maxAngle: this.geometryInfo?.maxAngle || 360,
          subdivisions: this.geometryInfo?.subdivisions || 32,
          resolution: this.curveData?.info?.resolution || 100
        };
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        this.exporter.downloadJSON(`superficie-${timestamp}.json`, parameters);
        console.log('Arquivo JSON exportado');
      } catch (error) {
        console.error('Erro ao exportar JSON:', error);
        alert('Erro ao exportar arquivo JSON');
      }
    }
  }
};
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.app-header h1 {
  margin: 0 0 8px 0;
  font-size: 2.5em;
  font-weight: 300;
}

.app-header p {
  margin: 0;
  font-size: 1.1em;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
}

.panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  overflow: hidden;
}

.controls-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.control-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
  font-size: 1.2em;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.info-item span {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.no-geometry {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn-export {
  background: #28a745;
  color: white;
}

.btn-export:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.status-bar {
  background: #343a40;
  color: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 13px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  
  .controls-panel {
    grid-template-columns: 1fr;
  }
  
  .status-bar {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .app-main {
    padding: 10px;
  }
  
  .control-grid {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
