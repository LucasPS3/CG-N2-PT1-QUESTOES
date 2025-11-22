/**
 * Módulo de Geração de Curvas 2D
 * Implementa algoritmos De Casteljau (Bézier) e B-Spline
 */

export class Curve2D {
  constructor() {
    this.controlPoints = [];
    this.curveType = 'bezier'; // 'bezier' ou 'bspline'
    this.degree = 3;
    this.resolution = 100; // número de pontos de discretização
  }

  /**
   * Define os pontos de controle da curva
   */
  setControlPoints(points) {
    this.controlPoints = points.map(p => ({x: p.x, y: p.y}));
  }

  /**
   * Adiciona um ponto de controle
   */
  addControlPoint(x, y) {
    this.controlPoints.push({x, y});
  }

  /**
   * Remove um ponto de controle
   */
  removeControlPoint(index) {
    if (index >= 0 && index < this.controlPoints.length) {
      this.controlPoints.splice(index, 1);
    }
  }

  /**
   * Atualiza a posição de um ponto de controle
   */
  updateControlPoint(index, x, y) {
    if (index >= 0 && index < this.controlPoints.length) {
      this.controlPoints[index] = {x, y};
    }
  }

  /**
   * Algoritmo De Casteljau para curvas de Bézier
   */
  evaluateBezier(t) {
    if (this.controlPoints.length === 0) return null;
    if (this.controlPoints.length === 1) return {...this.controlPoints[0]};

    let points = [...this.controlPoints];
    
    // Aplicação recursiva do algoritmo De Casteljau
    while (points.length > 1) {
      const newPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        const x = (1 - t) * points[i].x + t * points[i + 1].x;
        const y = (1 - t) * points[i].y + t * points[i + 1].y;
        newPoints.push({x, y});
      }
      points = newPoints;
    }
    
    return points[0];
  }

  /**
   * Função base B-Spline (Cox-de Boor)
   */
  basisFunction(i, k, t, knots) {
    if (k === 0) {
      return (knots[i] <= t && t < knots[i + 1]) ? 1.0 : 0.0;
    }
    
    let left = 0.0;
    let right = 0.0;
    
    if (knots[i + k] !== knots[i]) {
      left = (t - knots[i]) / (knots[i + k] - knots[i]) * this.basisFunction(i, k - 1, t, knots);
    }
    
    if (knots[i + k + 1] !== knots[i + 1]) {
      right = (knots[i + k + 1] - t) / (knots[i + k + 1] - knots[i + 1]) * this.basisFunction(i + 1, k - 1, t, knots);
    }
    
    return left + right;
  }

  /**
   * Avaliação de B-Spline
   */
  evaluateBSpline(t) {
    if (this.controlPoints.length === 0) return null;
    if (this.controlPoints.length === 1) return {...this.controlPoints[0]};

    const n = this.controlPoints.length;
    const k = Math.min(this.degree, n - 1);
    
    // Geração de vetor de nós uniforme
    const m = n + k + 1;
    const knots = [];
    for (let i = 0; i < m; i++) {
      if (i <= k) knots[i] = 0;
      else if (i >= m - k - 1) knots[i] = 1;
      else knots[i] = (i - k) / (n - k);
    }
    
    // Ajustar t para estar no domínio válido
    const tMin = knots[k];
    const tMax = knots[n];
    const adjustedT = tMin + t * (tMax - tMin);
    
    let x = 0, y = 0;
    for (let i = 0; i < n; i++) {
      const basis = this.basisFunction(i, k, adjustedT, knots);
      x += this.controlPoints[i].x * basis;
      y += this.controlPoints[i].y * basis;
    }
    
    return {x, y};
  }

  /**
   * Gera os pontos discretizados da curva
   */
  generateCurve() {
    if (this.controlPoints.length === 0) return [];
    
    const points = [];
    const steps = this.resolution;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let point;
      
      if (this.curveType === 'bezier') {
        point = this.evaluateBezier(t);
      } else {
        point = this.evaluateBSpline(t);
      }
      
      if (point) {
        points.push(point);
      }
    }
    
    return points;
  }

  /**
   * Define o tipo de curva
   */
  setCurveType(type) {
    this.curveType = type;
  }

  /**
   * Define o grau da curva
   */
  setDegree(degree) {
    this.degree = Math.max(1, degree);
  }

  /**
   * Define a resolução da discretização
   */
  setResolution(resolution) {
    this.resolution = Math.max(10, resolution);
  }

  /**
   * Retorna informações sobre a curva
   */
  getInfo() {
    return {
      controlPoints: this.controlPoints.length,
      curveType: this.curveType,
      degree: this.degree,
      resolution: this.resolution
    };
  }
}