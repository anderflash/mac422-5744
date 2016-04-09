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

var speed = 0.5;             // Parâmetro para controlar a animação
var lastTime = 0;            // Quero usar a duração do frame para controlar a
                             // animação (evitando que a animação em um 
                             // computador potente seja diferente do que em
                             // um computador mais fraco). O lastTime guarda
                             // o momento (em milisegundos) do último frame
                             // desenhado.
var program = null;
var scene   = null;
var renderer= null;
var camera  = null;

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
  renderer = new Renderer();
  renderer.init("meucanvas");
  return renderer.createProgram("vertex.glsl","frag.glsl",["M","V","P","color"],["vertex_pos", "vertex_normal"]);
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
  scene  = new Scene(renderer.gl);
  camera = new Camera();
  return scene.createObjectByFile('../cube.obj');
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
  renderer.clear();
  renderer.render(scene, camera);
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
  requestAnimFrame(tick);
  desenharCena();
  animar();
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
    //translate(modelMatrix, [speed * duration, 0, 0]);
    //gl.uniformMatrix4fv(modelMatrixUniform, false, modelMatrix);
  }
  lastTime = now;
}
//-----------------------------------------------------------------------------
// Só vou construir o ambiente virtual quando toda a página HTML estiver 
// carregada (vai que o JavaScript seja executado antes do <canvas> ser 
// carregado!)
document.addEventListener("DOMContentLoaded", function(e){
  // Primeiro passo: canvas, contexto e shaders
  iniciarWebGL().
  // Segundo passo: posições, cores, buffers, matrizes e uniforms
  then(criarCena).
  // Terceiro passo: desenhar e já agendar o próximo redesenho
  then(tick);
});