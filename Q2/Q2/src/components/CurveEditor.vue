<template>
  <div class="curve-editor">
    <div class="editor-header">
      <h3>Editor de Curva 2D</h3>
      <div class="curve-info">
        {{ curveInfo.controlPoints }} pontos | {{ curveInfo.curveType }} | Grau: {{ curveInfo.degree }}
      </div>
    </div>
    
    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @dblclick="handleDoubleClick"
      class="curve-canvas"
    ></canvas>
    
    <div class="editor-controls">
      <div class="control-group">
        <label>Tipo de Curva:</label>
        <select v-model="curveType" @change="updateCurveType">
          <option value="bezier">Bézier</option>
          <option value="bspline">B-Spline</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>Grau:</label>
        <input 
          type="number" 
          v-model.number="degree" 
          @change="updateDegree"
          min="1" 
          max="10"
        />
      </div>
      
      <div class="control-group">
        <label>Resolução:</label>
        <input 
          type="number" 
          v-model.number="resolution" 
          @change="updateResolution"
          min="10" 
          max="200"
        />
      </div>
      
      <div class="control-group">
        <label>Eixo de Revolução:</label>
        <select v-model="revolutionAxis" @change="updateRevolutionAxis">
          <option value="x">X</option>
          <option value="y">Y</option>
          <option value="z">Z</option>
        </select>
      </div>
      
      <button @click="clearCurve" class="btn btn-secondary">
        Limpar
      </button>
    </div>
  </div>
</template>

<script>
import { Curve2D } from '../modules/Curve2D.js';

export default {
  name: 'CurveEditor',
  props: {
    width: { type: Number, default: 400 },
    height: { type: Number, default: 400 }
  },
  emits: ['curve-updated', 'axis-changed'],
  data() {
    return {
      curve: new Curve2D(),
      curveType: 'bezier',
      degree: 3,
      resolution: 100,
      revolutionAxis: 'y',
      canvasWidth: 400,
      canvasHeight: 400,
      draggedPointIndex: -1,
      isDragging: false,
      gridSize: 20,
      scale: 1,
      offset: { x: 0, y: 0 }
      ,
      emitScheduled: false
    };
  },
  computed: {
    curveInfo() {
      return this.curve.getInfo();
    }
  },
  mounted() {
    this.canvasWidth = this.width;
    this.canvasHeight = this.height;
    this.offset.x = this.canvasWidth / 2;
    this.offset.y = this.canvasHeight / 2;
    this.setupDefaultCurve();
    this.draw();
  },
  methods: {
    setupDefaultCurve() {
      // Adicionar alguns pontos padrão para demonstração
      const defaultPoints = [
        { x: -50, y: -100 },
        { x: -30, y: -50 },
        { x: 50, y: 50 },
        { x: 80, y: 100 }
      ];
      
      defaultPoints.forEach(point => {
        this.curve.addControlPoint(point.x, point.y);
      });
      
      this.curve.setCurveType(this.curveType);
      this.curve.setDegree(this.degree);
      this.curve.setResolution(this.resolution);
      
      // Emit initial curve immediately so Viewer3D receives initial data
      this.emitCurveUpdate();
    },
    
    worldToScreen(x, y) {
      return {
        x: x + this.offset.x,
        y: -y + this.offset.y
      };
    },
    
    screenToWorld(x, y) {
      return {
        x: x - this.offset.x,
        y: -(y - this.offset.y)
      };
    },
    
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      this.drawGrid(ctx);
      this.drawAxes(ctx);
      this.drawRevolutionAxis(ctx);
      this.drawCurve(ctx);
      this.drawControlPoints(ctx);
    },
    
    drawGrid(ctx) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      
      // Linhas verticais
      for (let x = 0; x <= this.canvasWidth; x += this.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasHeight);
        ctx.stroke();
      }
      
      // Linhas horizontais
      for (let y = 0; y <= this.canvasHeight; y += this.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasWidth, y);
        ctx.stroke();
      }
    },
    
    drawAxes(ctx) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      // Eixo X
      ctx.beginPath();
      ctx.moveTo(0, this.offset.y);
      ctx.lineTo(this.canvasWidth, this.offset.y);
      ctx.stroke();
      
      // Eixo Y
      ctx.beginPath();
      ctx.moveTo(this.offset.x, 0);
      ctx.lineTo(this.offset.x, this.canvasHeight);
      ctx.stroke();
    },
    
    drawRevolutionAxis(ctx) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (this.revolutionAxis === 'y') {
        // Eixo Y (vertical)
        ctx.beginPath();
        ctx.moveTo(this.offset.x, 0);
        ctx.lineTo(this.offset.x, this.canvasHeight);
        ctx.stroke();
      } else if (this.revolutionAxis === 'x') {
        // Eixo X (horizontal)
        ctx.beginPath();
        ctx.moveTo(0, this.offset.y);
        ctx.lineTo(this.canvasWidth, this.offset.y);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    },
    
    drawCurve(ctx) {
      const curvePoints = this.curve.generateCurve();
      if (curvePoints.length < 2) return;
      
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const firstPoint = this.worldToScreen(curvePoints[0].x, curvePoints[0].y);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < curvePoints.length; i++) {
        const point = this.worldToScreen(curvePoints[i].x, curvePoints[i].y);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
    },
    
    drawControlPoints(ctx) {
      const points = this.curve.controlPoints;
      
      // Linhas conectando pontos de controle
      if (points.length > 1) {
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        
        const firstPoint = this.worldToScreen(points[0].x, points[0].y);
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < points.length; i++) {
          const point = this.worldToScreen(points[i].x, points[i].y);
          ctx.lineTo(point.x, point.y);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Pontos de controle
      points.forEach((point, index) => {
        const screenPoint = this.worldToScreen(point.x, point.y);
        
        ctx.fillStyle = index === this.draggedPointIndex ? '#ff4444' : '#0066cc';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Índice do ponto (mostrar como 1-based para o usuário)
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), screenPoint.x, screenPoint.y - 10);
      });
    },
    
    handleMouseDown(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Verificar se clicou em um ponto de controle
      const worldPos = this.screenToWorld(x, y);
      this.draggedPointIndex = this.findNearestControlPoint(worldPos.x, worldPos.y);
      
      if (this.draggedPointIndex >= 0) {
        this.isDragging = true;
      }
    },
    
    handleMouseMove(event) {
      if (!this.isDragging || this.draggedPointIndex < 0) return;
      
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const worldPos = this.screenToWorld(x, y);
      
      this.curve.updateControlPoint(this.draggedPointIndex, worldPos.x, worldPos.y);
      this.draw();
      // Throttle updates to reduce frequency of heavy recomputation in Viewer3D
      this.scheduleEmitCurveUpdate();
    },
    
    handleMouseUp() {
      this.isDragging = false;
      this.draggedPointIndex = -1;
    },
    
    handleDoubleClick(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const worldPos = this.screenToWorld(x, y);
      
      this.curve.addControlPoint(worldPos.x, worldPos.y);
      this.draw();
      // New point: emit immediately
      this.emitCurveUpdate();
    },
    
    findNearestControlPoint(x, y) {
      const threshold = 15; // pixels
      let nearest = -1;
      let minDistance = threshold;
      
      this.curve.controlPoints.forEach((point, index) => {
        const screenPoint = this.worldToScreen(point.x, point.y);
        const worldMouse = this.worldToScreen(x, y);
        const distance = Math.sqrt(
          Math.pow(screenPoint.x - worldMouse.x, 2) + 
          Math.pow(screenPoint.y - worldMouse.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearest = index;
        }
      });
      
      return nearest;
    },
    
    updateCurveType() {
      this.curve.setCurveType(this.curveType);
      this.draw();
      this.scheduleEmitCurveUpdate();
    },
    
    updateDegree() {
      this.curve.setDegree(this.degree);
      this.draw();
      this.scheduleEmitCurveUpdate();
    },
    
    updateResolution() {
      this.curve.setResolution(this.resolution);
      this.draw();
      this.scheduleEmitCurveUpdate();
    },
    
    updateRevolutionAxis() {
      this.draw();
      this.$emit('axis-changed', this.revolutionAxis);
    },
    
    clearCurve() {
      this.curve.setControlPoints([]);
      this.draw();
      this.emitCurveUpdate();
    },
    
    emitCurveUpdate() {
      const curvePoints = this.curve.generateCurve();
      this.$emit('curve-updated', {
        points: curvePoints,
        info: this.curve.getInfo()
      });
    },

    // Throttle updates to once per animation frame while dragging
    scheduleEmitCurveUpdate() {
      if (this.emitScheduled) return;
      this.emitScheduled = true;
      requestAnimationFrame(() => {
        this.emitCurveUpdate();
        this.emitScheduled = false;
      });
    }
  },
  watch: {
    width() {
      this.canvasWidth = this.width;
      this.$nextTick(() => this.draw());
    },
    height() {
      this.canvasHeight = this.height;
      this.$nextTick(() => this.draw());
    }
  }
};
</script>

<style scoped>
.curve-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: white;
}

.editor-header {
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.curve-info {
  font-size: 12px;
  color: #666;
}

.curve-canvas {
  display: block;
  cursor: crosshair;
  border-bottom: 1px solid #ddd;
}

.curve-canvas:hover {
  background-color: #fafafa;
}

.editor-controls {
  padding: 15px;
  background: #f9f9f9;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
.control-group input {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 13px;
}

.control-group select:focus,
.control-group input:focus {
  outline: none;
  border-color: #0066cc;
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