/**
 * Módulo de Revolução e Malha 3D
 * Gera superfícies de revolução a partir de perfis 2D
 */

export class Revolution3D {
  constructor() {
    this.profile2D = [];
    this.axis = 'y'; // 'x', 'y', 'z'
    this.maxAngle = 360; // ângulo máximo em graus
    this.subdivisions = 32; // número de subdivisões angulares
    this.vertices = [];
    this.faces = [];
    this.normals = [];
  }

  /**
   * Define o perfil 2D para revolução
   */
  setProfile(points) {
    this.profile2D = points.map(p => ({x: p.x, y: p.y}));
  }

  /**
   * Define o eixo de revolução
   */
  setAxis(axis) {
    this.axis = axis;
  }

  /**
   * Define o ângulo máximo de revolução
   */
  setMaxAngle(angle) {
    this.maxAngle = Math.max(0, Math.min(360, angle));
  }

  /**
   * Define o número de subdivisões angulares
   */
  setSubdivisions(subdivisions) {
    this.subdivisions = Math.max(8, Math.min(360, subdivisions));
  }

  /**
   * Converte coordenadas 2D para 3D baseado no eixo de revolução
   */
  profileTo3D(point2D, angle) {
    const x = point2D.x;
    const y = point2D.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    switch (this.axis) {
      case 'x':
        return {
          x: y,
          y: x * cos,
          z: x * sin
        };
      case 'y':
        return {
          x: x * cos,
          y: y,
          z: x * sin
        };
      case 'z':
        return {
          x: x * cos,
          y: x * sin,
          z: y
        };
      default:
        return {x: x * cos, y: y, z: x * sin};
    }
  }

  /**
   * Gera os vértices da superfície de revolução
   */
  generateVertices() {
    this.vertices = [];
    
    if (this.profile2D.length === 0) return;

    const angleStep = (this.maxAngle * Math.PI / 180) / this.subdivisions;
    
    for (let i = 0; i <= this.subdivisions; i++) {
      const angle = i * angleStep;
      
      for (let j = 0; j < this.profile2D.length; j++) {
        const vertex3D = this.profileTo3D(this.profile2D[j], angle);
        this.vertices.push(vertex3D);
      }
    }
  }

  /**
   * Gera as faces triangulares conectando os vértices
   */
  generateFaces() {
    this.faces = [];
    
    if (this.vertices.length === 0) return;

    const profileLength = this.profile2D.length;
    
    for (let i = 0; i < this.subdivisions; i++) {
      for (let j = 0; j < profileLength - 1; j++) {
        // Índices dos vértices do quadrilátero atual
        const v1 = i * profileLength + j;
        const v2 = i * profileLength + (j + 1);
        const v3 = ((i + 1) % (this.subdivisions + 1)) * profileLength + j;
        const v4 = ((i + 1) % (this.subdivisions + 1)) * profileLength + (j + 1);
        
        // Primeiro triângulo
        this.faces.push([v1, v2, v3]);
        
        // Segundo triângulo
        this.faces.push([v2, v4, v3]);
      }
    }
  }

  /**
   * Calcula normal de uma face triangular
   */
  calculateFaceNormal(face) {
    const v1 = this.vertices[face[0]];
    const v2 = this.vertices[face[1]];
    const v3 = this.vertices[face[2]];
    
    // Vetores das arestas
    const edge1 = {
      x: v2.x - v1.x,
      y: v2.y - v1.y,
      z: v2.z - v1.z
    };
    
    const edge2 = {
      x: v3.x - v1.x,
      y: v3.y - v1.y,
      z: v3.z - v1.z
    };
    
    // Produto vetorial
    const normal = {
      x: edge1.y * edge2.z - edge1.z * edge2.y,
      y: edge1.z * edge2.x - edge1.x * edge2.z,
      z: edge1.x * edge2.y - edge1.y * edge2.x
    };
    
    // Normalizar
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (length > 0) {
      normal.x /= length;
      normal.y /= length;
      normal.z /= length;
    }
    
    return normal;
  }

  /**
   * Calcula normais por vértice (média das faces adjacentes)
   */
  generateVertexNormals() {
    this.normals = new Array(this.vertices.length).fill(null).map(() => ({x: 0, y: 0, z: 0}));
    const counts = new Array(this.vertices.length).fill(0);
    
    // Para cada face, contribuir para as normais dos vértices
    this.faces.forEach(face => {
      const faceNormal = this.calculateFaceNormal(face);
      
      face.forEach(vertexIndex => {
        this.normals[vertexIndex].x += faceNormal.x;
        this.normals[vertexIndex].y += faceNormal.y;
        this.normals[vertexIndex].z += faceNormal.z;
        counts[vertexIndex]++;
      });
    });
    
    // Normalizar e calcular média
    this.normals.forEach((normal, index) => {
      if (counts[index] > 0) {
        normal.x /= counts[index];
        normal.y /= counts[index];
        normal.z /= counts[index];
        
        const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
        if (length > 0) {
          normal.x /= length;
          normal.y /= length;
          normal.z /= length;
        }
      }
    });
  }

  /**
   * Gera toda a geometria da superfície de revolução
   */
  generateSurface() {
    if (this.profile2D.length === 0) {
      console.warn('Perfil 2D não definido');
      return;
    }

    this.generateVertices();
    this.generateFaces();
    this.generateVertexNormals();
  }

  /**
   * Retorna a geometria gerada
   */
  getGeometry() {
    return {
      vertices: this.vertices,
      faces: this.faces,
      normals: this.normals,
      info: {
        vertexCount: this.vertices.length,
        faceCount: this.faces.length,
        axis: this.axis,
        maxAngle: this.maxAngle,
        subdivisions: this.subdivisions
      }
    };
  }

  /**
   * Limpa toda a geometria
   */
  clear() {
    this.vertices = [];
    this.faces = [];
    this.normals = [];
  }

  /**
   * Retorna informações sobre a superfície
   */
  getInfo() {
    return {
      profilePoints: this.profile2D.length,
      vertices: this.vertices.length,
      faces: this.faces.length,
      axis: this.axis,
      maxAngle: this.maxAngle,
      subdivisions: this.subdivisions
    };
  }
}