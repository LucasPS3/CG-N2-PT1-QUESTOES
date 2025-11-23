# Sistema de Modelagem Geométrica - Superfícies de Revolução 3D

Um sistema web interativo completo para criação de superfícies de revolução 3D a partir de perfis 2D definidos por curvas matemáticas. Desenvolvido como uma ferramenta educacional e profissional para compreender e aplicar conceitos de curvas paramétricas e superfícies de revolução.

## Características Principais

### Módulo de Geração de Curva 2D
- **Algoritmo De Casteljau** para curvas de Bézier com avaliação recursiva
- **Interpolação B-Spline** com matriz de base e nós uniformes/não-uniformes
- Grau configurável e discretização ajustável
- Editor visual interativo com pontos de controle manipuláveis

### Módulo de Revolução e Malha 3D
- Rotação de perfil 2D em torno de eixos X, Y ou Z configuráveis
- Ângulo e discretização ajustáveis (30°-360°, 8-64 subdivisões)
- Geração automática de vértices, faces triangulares e normais
- Cálculo de normais por vértice para iluminação suave

### Módulo de Renderização e Interação
- Renderização WebGL com Three.js
- Controles de câmera intuitivos (rotação com mouse, zoom com scroll)
- Alternância entre modos: wireframe, sólido e suavizado
- Visualização em tempo real das alterações

## 🚀 Como Usar

### Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Construir para produção
npm run build
```

### Interface do Usuário

#### Painel Esquerdo - Editor 2D
1. **Pontos de Controle**: Duplo-clique para adicionar novos pontos
2. **Edição**: Arraste pontos existentes para modificar a curva
3. **Configurações**:
   - Tipo de curva: Bézier ou B-Spline
   - Grau da curva (1-10)
   - Resolução de discretização (10-200)
   - Eixo de revolução (X, Y, Z)

#### Painel Direito - Visualizador 3D
1. **Controles de Câmera**:
   - Arrastar: Rotacionar câmera
   - Scroll: Zoom in/out
   - Botão "Reset Câmera": Voltar à posição inicial
2. **Modos de Visualização**:
   - Sólido: Material Phong com iluminação
   - Wireframe: Estrutura de linhas
   - Suavizado: Material Standard com reflexões
3. **Parâmetros de Revolução**:
   - Ângulo: 30°-360°
   - Subdivisões: 8-64

#### Controles Gerais
- **Gerar Superfície**: Regenera a geometria 3D
- **Limpar Tudo**: Remove toda geometria
- **Exportação**: OBJ, STL, JSON com dados completos

### Exportação de Arquivos

#### Formato OBJ
```
# Contém vértices, normais e faces
v 1.000000 2.000000 3.000000
vn 0.577350 0.577350 0.577350
f 1//1 2//2 3//3
```

#### Formato STL (ASCII)
```
solid RevolutionSurface
  facet normal 0.000000 0.000000 1.000000
    outer loop
      vertex 1.000000 2.000000 3.000000
      vertex 4.000000 5.000000 6.000000
      vertex 7.000000 8.000000 9.000000
    endloop
  endfacet
endsolid RevolutionSurface
```

#### Formato JSON
```json
{
  "metadata": {
    "format": "Revolution Surface Geometry",
    "timestamp": "2024-11-21T10:30:00Z",
    "vertexCount": 1000,
    "faceCount": 1800
  },
  "parameters": {
    "curveType": "bezier",
    "degree": 3,
    "axis": "y",
    "maxAngle": 360,
    "subdivisions": 32
  },
  "geometry": {
    "vertices": [[x, y, z], ...],
    "faces": [[v1, v2, v3], ...],
    "normals": [[nx, ny, nz], ...]
  }
}
```

## Arquitetura do Sistema

### Estrutura de Módulos

```
src/
├── modules/
│   ├── Curve2D.js          # Algoritmos De Casteljau e B-Spline
│   ├── Revolution3D.js     # Geração de superfícies de revolução
│   └── GeometryExporter.js # Exportação OBJ/STL/JSON
├── components/
│   ├── CurveEditor.vue     # Interface para edição 2D
│   └── Viewer3D.vue        # Renderização 3D com Three.js
└── App.vue                 # Aplicação principal
```

### Fluxo de Dados

1. **Entrada**: Usuário define pontos de controle no editor 2D
2. **Processamento**: Algoritmos geram curva discretizada
3. **Revolução**: Perfil 2D é rotacionado para criar geometria 3D
4. **Renderização**: Three.js exibe superfície com materiais/luzes
5. **Exportação**: Dados salvos em formatos padrão da indústria

## 🎓 Conceitos Matemáticos Implementados

### Curvas de Bézier - Algoritmo De Casteljau
- Avaliação recursiva estável numericamente
- Construção geométrica intuitiva
- Grau arbitrário com pontos de controle

### B-Splines - Funções de Base Cox-de Boor
- Continuidade paramétrica controlada
- Influência local dos pontos de controle
- Vetor de nós uniforme/não-uniforme

### Superfícies de Revolução
- Transformações 3D baseadas em rotações
- Geração de malhas triangulares
- Cálculo de normais para iluminação

## Tecnologias Utilizadas

- **Vue.js 3**: Framework reativo para interface
- **Three.js**: Renderização WebGL e manipulação 3D
- **Vite**: Build tool moderno e rápido
- **JavaScript ES6+**: Módulos nativos e sintaxe moderna

## Casos de Uso Educacionais

### Para Estudantes
- Visualização interativa de conceitos de geometria computacional
- Experimentação com parâmetros de curvas e superfícies
- Compreensão prática de algoritmos matemáticos

### Para Professores
- Demonstração dinâmica de teoremas geométricos
- Ferramenta para aulas de computação gráfica
- Exercícios práticos de modelagem matemática

### Para Profissionais
- Prototipagem rápida de formas orgânicas
- Exportação para pipelines CAD/CAM
- Validação de algoritmos de superfícies

## Controles Detalhados

### Editor 2D
- **Duplo-clique**: Adicionar ponto de controle
- **Arrastar ponto**: Editar posição
- **Clique direito**: Remover ponto (planejado)

### Visualizador 3D
- **Mouse**: Rotacionar câmera
- **Scroll**: Zoom
- **Shift+Scroll**: Pan (planejado)
- **R**: Reset câmera (planejado)

## Informações Técnicas

### Performance
- Otimização para curvas até 200 pontos
- Superfícies até 10.000 vértices renderizadas em tempo real
- Uso eficiente de WebGL para geometrias complexas

### Compatibilidade
- Navegadores modernos com suporte a WebGL 2.0
- Responsivo para dispositivos desktop e tablet
- Exportação compatível com software CAD padrão

## Contribuições

Este projeto foi desenvolvido como solução educacional completa. Futuras melhorias podem incluir:

- Suporte a curvas NURBS
- Importação de curvas de arquivos SVG
- Animações de revolução temporal
- Texturas procedurais para materiais
- Ferramentas de medição geométrica

---

**Desenvolvido para demonstrar a aplicação prática de conceitos matemáticos em computação gráfica e modelagem geométrica.**
