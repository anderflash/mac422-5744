/**
 ** This file is part of the MAC422/5744 project.
 ** Copyright 2016 Anderson Tavares <acmt@ime.usp.br>.
 **
 ** This program is free software: you can redistribute it and/or modify
 ** it under the terms of the GNU General Public License as published by
 ** the Free Software Foundation, either version 3 of the License, or
 ** (at your option) any later version.
 **
 ** This program is distributed in the hope that it will be useful,
 ** but WITHOUT ANY WARRANTY; without even the implied warranty of
 ** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 ** GNU General Public License for more details.
 **
 ** You should have received a copy of the GNU General Public License
 ** along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

/**
 * @file: código de exemplo WebGL de criação do canvas com animação
 * 
 * Neste exemplo, um triângulo é exibido na tela sendo animado com translação.
 * 
 * Este código foi criado na aula prática de Introdução à Computação Gráfica,
 * no dia 05/04/2016, no Instituto de Matemática e Estatística, da Universi-
 * dade de São Paulo
 */

var canvas;                  // referência ao <canvas> do HTML
var gl;                      // contexto WebGL (estado do sistema e funções)

var vertexShaderSrc;         // Código do nosso shader de vértice
var fragmentShaderSrc;       // Código do nosso shader de fragmento
var vertexShaderID;          // Ao compilar o código, o WebGL retorna o ID
var fragmentShaderID;        // Ao compilar o código, o WebGL retorna o ID
var programShaderID;         // Combina vertex e frag shaders. Cada programa
                             // oferece um efeito específico. Um ambiente pode
                             // gerar efeitos diferentes trocando os programas
                             // no momento certo

var modelMatrix;             // Lista de 16 elementos (4x4) para posicionar e
                             // orientar nosso objeto ao mundo (cada objeto
                             // terá um modelMatrix diferente) 
var viewMatrix;              // Lista de 16 elementos (4x4) para posicionar e 
                             // orientar nosso mundo à camera (parâmetros 
                             // extrínsecos). Cada câmera terá um viewMatrix
                             // diferente.
var projectionMatrix;        // Achatar o mundo todo no plano da imagem (seja 
                             // por perspectiva, por ortográfica, paraperspec-
                             // tiva...). Parâmetros intrínsecos da câmera.


var modelMatrixUniform;      // As listas supracitadas estão na CPU. O shader
var viewMatrixUniform;       // utiliza as uniforms (buffer de dados comparti-
                             // lhados ao vértices) da GPU. Precisamos enviar
var projectionMatrixUniform; // as matrizes para esses uniforms.


var trianglePos;             // Lista de dados do atributo "posição" do objeto
var triangleCol;             // Lista de dados do atributo "cor" do objeto

var trianglePosBuffer;       // Igual às matrizes: o vertexShader utiliza o que
                             // estiver na GPU. Este será o ID do buffer da GPU
                             // que usaremos para enviar a lista de posições de
                             // vértices do obj.
var triangleColBuffer;       // ID do buffer para as cores dos vértices do obj.

var vertexPosAttrib;         // Referência ao atributo de posição no shader 
                             // (vamos usar isso para associá-la ao buffer de
                             // posições)
var vertexColAttrib;         // Referência ao atributo de cor no shader (vamos
                             // usar isso para associá-la ao buffer de cores)

var speed = 0.5;             // Parâmetro para controlar a animação
var lastTime = 0;            // Quero usar a duração do frame para controlar a
                             // animação (evitando que a animação em um 
                             // computador potente seja diferente do que em
                             // um computador mais fraco). O lastTime guarda
                             // o momento (em milisegundos) do último frame
                             // desenhado.

/**
 * @brief: Primeiro passo. Obter o canvas e criar o contexto WebGL  
 * 
 * - Obter o canvas
 * - Criar o contexto WebGL (estado interno do ambiente e conjunto de funções) 
 * - Compilar os shaders
 * - Compilar o programa
 * - Obter as referências aos atributos e uniforms do programa para preencher
 *
 * @method     iniciarWebGL
 */
function iniciarWebGL(){
  // Obter o canvas
  canvas = document.getElementById("meucanvas");
  if(!canvas){
    console.error("Canvas não obtido");
  }

  // Criar o contexto WebGL
  gl = canvas.getContext("webgl")|| canvas.getContext("experimental-webgl");
  
  // Compilar os shaders
  vertexShaderSrc = `

    precision mediump float;
    
    attribute vec3 vertex_pos;
    attribute vec3 vertex_col;

    varying vec3 color;

    uniform mat4 P;
    uniform mat4 V;
    uniform mat4 M;

    void main(){
      gl_Position = P * V * M * vec4(vertex_pos, 1.0);
      color = vertex_col;

    }

  `;
  fragmentShaderSrc = `
    precision mediump float;
    varying vec3 color;
    void main(){
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Criando os shaders e os programas
  vertexShaderID = compileShader(gl,gl.VERTEX_SHADER, vertexShaderSrc);
  fragmentShaderID = compileShader(gl,gl.FRAGMENT_SHADER, fragmentShaderSrc);
  programShaderID = compileProgram(gl,vertexShaderID, fragmentShaderID);
  gl.useProgram(programShaderID);

  // Obtendo as referências nos shaders
  modelMatrixUniform = gl.getUniformLocation(programShaderID, "M");
  viewMatrixUniform = gl.getUniformLocation(programShaderID, "V");
  projectionMatrixUniform = gl.getUniformLocation(programShaderID, "P");
  vertexPosAttrib = gl.getAttribLocation(programShaderID,"vertex_pos");
  vertexColAttrib = gl.getAttribLocation(programShaderID,"vertex_col");

  // Informar ao WebGL que iremos utilizar os atributos
  gl.enableVertexAttribArray(vertexPosAttrib);
  gl.enableVertexAttribArray(vertexColAttrib);
}

/**
 * @brief: Segundo passo. Criar nosso ambiente virtual
 * 
 * - Preencher os atributos (ex: posição e cor) do nosso objeto na CPU
 * - Criar os espaços de memória na GPU
 * - Enviar as listas da CPU para os buffers da GPU
 * - Informar o tamanho do atributo para cada vértice
 * - Preencher as matrizes na CPU
 * - Enviar as matrizes para a GPU
 *
 * @method     criarCena
 */
function criarCena(){
  // Preencher os atributos (ex: posição e cor) do nosso objeto na CPU
  trianglePos = [
    -1.0, 0.0, 0.0,
     1.0, 0.0, 0.0,
     0.0, 1.0, 0.0
  ];

  triangleCol = [
     1.0, 0.0, 0.0,
     0.0, 1.0, 0.0,
     0.0, 0.0, 1.0
  ];
  gl.clearColor(0, 0, 0.5, 1);

  // POSIÇÃO: Criar os espaços de memória na GPU
  trianglePosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, trianglePosBuffer);

  // POSIÇÃO: Enviar as listas da CPU para os buffers da GPU
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trianglePos), gl.STATIC_DRAW);

  // POSIÇÃO: Informar o tamanho do atributo para cada vértice
  gl.vertexAttribPointer(vertexPosAttrib, 3, gl.FLOAT, false, 0, 0);

  // COR: Criar os espaços de memória na GPU
  triangleColBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleColBuffer);

  // COR: Enviar as listas da CPU para os buffers da GPU
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleCol), gl.STATIC_DRAW);

  // COR: Informar o tamanho do atributo para cada vértice
  gl.vertexAttribPointer(vertexColAttrib, 3, gl.FLOAT, false, 0, 0);

  // Preencher as matrizes na CPU
  modelMatrix = eye();
  translate(modelMatrix, [0.2, 0.0, 0.0]);
  viewMatrix = eye();
  projectionMatrix = eye();

  // Enviar as matrizes para a GPU
  gl.uniformMatrix4fv(modelMatrixUniform, false, modelMatrix);
  gl.uniformMatrix4fv(viewMatrixUniform, false, viewMatrix);
  gl.uniformMatrix4fv(projectionMatrixUniform, false, projectionMatrix);
}

/**
 * @brief: Terceiro passo. Com tudo pronto, agora vamos desenhar
 * 
 * - Limpar a tela
 * - Desenhar as primitivas e informar o número de vértices
 *
 * @method     desenharCena
 */
function desenharCena(){
  // Limpar a tela e as profundidades
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Desenhar os objetos informando o vértice inicial e o número
  // de vértices
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/**
 * @brief: Modificação do terceiro passo. Ao invés de desenhar diretamente,
 * vou agendar recursivamente a atualização do desenho.
 * 
 * Aproveito para atualizar dados da animação (ex: posição atual, ângulo,
 * velocidade...)
 *
 * @method     tick
 */
function tick(){
  // Usar o programa
  gl.useProgram(programShaderID);

  requestAnimFrame(tick);
  desenharCena();
  animar();

  // Boas práticas: resetar o estado
  gl.useProgram(null);
}

/**
 * @brief: Atualização dos dados da animação. 
 * 
 * Se o HTML durar 3 segundos para carregar, então o primeiro frame terá 3000
 * na variável `duration`, fazendo o objeto ir até o bandex do central, sumindo
 * da tela. Por isso só animo do segundo frame em diante (quando lastTime não
 * for o valor inicial)
 *
 * @method     animar
 */
function animar(){
  var now = new Date().getTime();
  if(lastTime != 0){
    var duration = (now - lastTime)/1000.0;
    translate(modelMatrix, [speed * duration, 0, 0]);
    gl.uniformMatrix4fv(modelMatrixUniform, false, modelMatrix);
  }
  lastTime = now;
}
//-----------------------------------------------------------------------------
// Só vou construir o ambiente virtual quando toda a página HTML estiver 
// carregada (vai que o JavaScript seja executado antes do <canvas> ser 
// carregado!)
document.addEventListener("DOMContentLoaded", function(e){
  // Primeiro passo: canvas, contexto e shaders
  iniciarWebGL();
  // Segundo passo: posições, cores, buffers, matrizes e uniforms
  criarCena();
  // Terceiro passo: desenhar e já agendar o próximo redesenho
  tick();
});