/**
 * Módulo de Exportação de Geometria
 * Exporta dados geométricos em formatos OBJ, STL e JSON
 */

export class GeometryExporter {
  constructor() {
    this.geometry = null;
  }

  /**
   * Define a geometria a ser exportada
   */
  setGeometry(vertices, faces, normals = []) {
    this.geometry = {
      vertices: vertices || [],
      faces: faces || [],
      normals: normals || []
    };
  }

  /**
   * Exporta para formato OBJ
   */
  exportOBJ() {
    if (!this.geometry || this.geometry.vertices.length === 0) {
      throw new Error('Nenhuma geometria definida para exportação');
    }

    let objContent = '# Arquivo OBJ gerado pelo Sistema de Modelagem Geométrica\n';
    objContent += '# Superfície de Revolução 3D\n\n';

    // Exportar vértices
    objContent += '# Vértices\n';
    this.geometry.vertices.forEach(vertex => {
      objContent += `v ${vertex.x.toFixed(6)} ${vertex.y.toFixed(6)} ${vertex.z.toFixed(6)}\n`;
    });

    // Exportar normais
    if (this.geometry.normals.length > 0) {
      objContent += '\n# Normais de vértices\n';
      this.geometry.normals.forEach(normal => {
        objContent += `vn ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
      });
    }

    // Exportar faces
    objContent += '\n# Faces\n';
    this.geometry.faces.forEach(face => {
      if (this.geometry.normals.length > 0) {
        // Com normais: f v1//vn1 v2//vn2 v3//vn3
        objContent += `f ${face[0] + 1}//${face[0] + 1} ${face[1] + 1}//${face[1] + 1} ${face[2] + 1}//${face[2] + 1}\n`;
      } else {
        // Sem normais: f v1 v2 v3
        objContent += `f ${face[0] + 1} ${face[1] + 1} ${face[2] + 1}\n`;
      }
    });

    return objContent;
  }

  /**
   * Exporta para formato STL (ASCII)
   */
  exportSTL() {
    if (!this.geometry || this.geometry.vertices.length === 0) {
      throw new Error('Nenhuma geometria definida para exportação');
    }

    let stlContent = 'solid RevolutionSurface\n';

    this.geometry.faces.forEach((face, index) => {
      const v1 = this.geometry.vertices[face[0]];
      const v2 = this.geometry.vertices[face[1]];
      const v3 = this.geometry.vertices[face[2]];

      // Calcular normal da face
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
      
      const normal = {
        x: edge1.y * edge2.z - edge1.z * edge2.y,
        y: edge1.z * edge2.x - edge1.x * edge2.z,
        z: edge1.x * edge2.y - edge1.y * edge2.x
      };
      
      const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
      if (length > 0) {
        normal.x /= length;
        normal.y /= length;
        normal.z /= length;
      }

      stlContent += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
      stlContent += '    outer loop\n';
      stlContent += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
      stlContent += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
      stlContent += `      vertex ${v3.x.toFixed(6)} ${v3.y.toFixed(6)} ${v3.z.toFixed(6)}\n`;
      stlContent += '    endloop\n';
      stlContent += '  endfacet\n';
    });

    stlContent += 'endsolid RevolutionSurface\n';

    return stlContent;
  }

  /**
   * Exporta para formato JSON
   */
  exportJSON(parameters = {}) {
    if (!this.geometry || this.geometry.vertices.length === 0) {
      throw new Error('Nenhuma geometria definida para exportação');
    }

    const jsonData = {
      metadata: {
        format: 'Revolution Surface Geometry',
        version: '1.0',
        generator: 'Sistema de Modelagem Geométrica',
        timestamp: new Date().toISOString(),
        vertexCount: this.geometry.vertices.length,
        faceCount: this.geometry.faces.length,
        normalCount: this.geometry.normals.length
      },
      parameters: {
        curveType: parameters.curveType || 'unknown',
        degree: parameters.degree || 3,
        axis: parameters.axis || 'y',
        maxAngle: parameters.maxAngle || 360,
        subdivisions: parameters.subdivisions || 32,
        resolution: parameters.resolution || 100,
        ...parameters
      },
      geometry: {
        vertices: this.geometry.vertices.map(v => [
          parseFloat(v.x.toFixed(6)),
          parseFloat(v.y.toFixed(6)),
          parseFloat(v.z.toFixed(6))
        ]),
        faces: this.geometry.faces.map(f => [f[0], f[1], f[2]]),
        normals: this.geometry.normals.map(n => [
          parseFloat(n.x.toFixed(6)),
          parseFloat(n.y.toFixed(6)),
          parseFloat(n.z.toFixed(6))
        ])
      }
    };

    return JSON.stringify(jsonData, null, 2);
  }

  /**
   * Salva o arquivo no navegador (download)
   */
  static downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Exporta e faz download do arquivo OBJ
   */
  downloadOBJ(filename = 'surface.obj') {
    const content = this.exportOBJ();
    GeometryExporter.downloadFile(content, filename, 'model/obj');
  }

  /**
   * Exporta e faz download do arquivo STL
   */
  downloadSTL(filename = 'surface.stl') {
    const content = this.exportSTL();
    GeometryExporter.downloadFile(content, filename, 'application/vnd.ms-pki.stl');
  }

  /**
   * Exporta e faz download do arquivo JSON
   */
  downloadJSON(filename = 'surface.json', parameters = {}) {
    const content = this.exportJSON(parameters);
    GeometryExporter.downloadFile(content, filename, 'application/json');
  }

  /**
   * Retorna informações sobre a geometria carregada
   */
  getGeometryInfo() {
    if (!this.geometry) {
      return null;
    }

    return {
      vertices: this.geometry.vertices.length,
      faces: this.geometry.faces.length,
      normals: this.geometry.normals.length,
      hasNormals: this.geometry.normals.length > 0
    };
  }
}