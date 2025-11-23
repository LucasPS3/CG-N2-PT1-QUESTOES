# Visualização de vôo 3D

Este projeto é uma visualização 3D de um voo em espiral baseado na sequência de Fibonacci, utilizando Vue 3 e Three.js.

## Funcionalidades

- Renderização de uma espiral 3D com base na sequência de Fibonacci.
- Animação de um ponto móvel (alus) ao longo da espiral.
- Trilhas animadas com gradiente de cor para representar o caminho percorrido.
- Controle de câmera interativo com `OrbitControls`.

## Tecnologias Utilizadas

- **Vue 3**: Framework JavaScript para construção de interfaces de usuário.
- **Three.js**: Biblioteca para renderização 3D.
- **Vite**: Ferramenta de build rápida para desenvolvimento web.

## Estrutura do Projeto

- `src/components/SpiralFlight3D.vue`: Componente principal que implementa a visualização 3D.
- `src/App.vue`: Componente raiz que utiliza o `SpiralFlight3D`.
- `vite.config.js`: Configuração do Vite para o projeto.
- `index.html`: Arquivo HTML principal.
- `src/style.css`: Estilos globais do projeto.