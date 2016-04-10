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

var pyramid, pyramid2;

var speed = 0.5;             // Parâmetro para controlar a animação
var lastTime = 0;            // Quero usar a duração do frame para controlar a
                             // animação (evitando que a animação em um 
                             // computador potente seja diferente do que em
                             // um computador mais fraco). O lastTime guarda
                             // o momento (em milisegundos) do último frame
                             // desenhado.

var scene;
var camera;
var renderer;
var keys = {};

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
  renderer.getContext("meucanvas");

  // Informando quem é quem nos shaders
  renderer.uniforms  [UniformType.MATRIX_MODEL]      = "M";
  renderer.uniforms  [UniformType.MATRIX_VIEW]       = "V";
  renderer.uniforms  [UniformType.MATRIX_PROJECTION] = "P";
  renderer.uniforms  [UniformType.LIGHT1_POS]        = "light_pos";
  renderer.uniforms  [UniformType.LIGHT1_AMBI]       = "light_ambi";
  renderer.uniforms  [UniformType.LIGHT1_DIFF]       = "light_diff";
  renderer.uniforms  [UniformType.LIGHT1_SPEC]       = "light_spec";
  renderer.uniforms  [UniformType.LIGHT1_PWER]       = "light_pwer";
  renderer.uniforms  [UniformType.CAMERA_POS]        = "camera_pos";
  // N = transpose(inverse(M*V))
  // Vetores normais não são influenciados pela translação
  renderer.uniforms  [UniformType.MATRIX_NORMAL]     = "N";

  renderer.attributes[AttribType.POSITION]           = "vertex_pos";
  renderer.attributes[AttribType.NORMAL]             = "vertex_normal";
  renderer.background = [0.0, 0.0, 0.4, 1.0];
  return renderer.createProgram("vertex.glsl","frag.glsl");

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
  // Criando um novo mesh, uma piramide
  pyramid       = new Mesh();
  pyramid.name      = "pyramid";
  pyramid.vertices  = [
    -0.5, 0.0,  0.5,
     0.5, 0.0,  0.5,
     0.5, 0.0, -0.5,
    -0.5, 0.0, -0.5,
     0.0, 1.0,  0
  ];
  pyramid.normals   = [
    -1.0, 0.0,  1.0,
     1.0, 0.0,  1.0,
     1.0, 0.0, -1.0,
    -1.0, 0.0, -1.0,
     0.0, 1.0,  0.0
  ];
  pyramid.indices   = [
    0,1,4,
    1,2,4,
    2,3,4,
    3,0,4,
    0,1,3,
    1,2,3
  ];
  pyramid.changed   = true;

  // Criando uma segunda piramide
  pyramid2      = new Mesh();
  pyramid2.name     = "pyramid2";
  pyramid2.vertices = pyramid.vertices.slice(0);
  pyramid2.normals  = pyramid.normals.slice(0);
  pyramid2.indices  = pyramid.indices.slice(0);
  pyramid2.changed  = true;
  
  pyramid.translate([-1,0,0]);
  pyramid2.translate([1,0,0]);

  // Criando uma camera
  camera = new PerspectiveCamera();
  camera.resetViewMatrix();
  camera.lookAt([0.0, 1.0, 5.0],
                [0.0, 0.0, 0.0],
                [0.0, 1.0, 0.0]);

  camera.makePerspective(45.0, renderer.aspect, 0.1, 100.0);

  light = new PointLight();
  light.position       = [1.0, 1.0,-5.0];
  light.ambient_color  = [1.0, 1.0, 1.0];
  light.diffuse_color  = [1.0, 1.0, 1.0];
  light.specular_color = [1.0, 1.0, 1.0];
  light.power          = 100.0;

  scene = new Scene();
  scene.addObject(pyramid);
  scene.addObject(pyramid2);
  scene.addLight(light);

  document.addEventListener("keydown", function(event){
    keys[event.keyCode] = true;
    console.log(event.keyCode);
    event.preventDefault();
  });
  document.addEventListener("keyup", function(event){
    keys[event.keyCode] = false;
    event.preventDefault();
  });
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
    
    camera.changed = true;
    if(keys[KeyType.UP]) 
      camera.moveForward(5*duration);
    if(keys[KeyType.DOWN]) 
      camera.moveBackwards(5*duration);
    if(keys[KeyType.LEFT]) 
      camera.yaw(60*duration);
    if(keys[KeyType.RIGHT]) 
      camera.yaw(-60*duration);
    camera.updateViewMatrix();

    pyramid2.rotate(90*duration, [0,1,0]);
    pyramid2.translate([0,speed*duration,0]);
    pyramid2.scale([1+speed*duration, 1, 1]);
  }
  lastTime = now;
}
//-----------------------------------------------------------------------------
// Só vou construir o ambiente virtual quando toda a página HTML estiver 
// carregada (vai que o JavaScript seja executado antes do <canvas> ser 
// carregado!)
document.addEventListener("DOMContentLoaded", function(e){
  // Primeiro passo: canvas, contexto e shaders
  iniciarWebGL().then(function(){
    // Segundo passo: posições, cores, buffers, matrizes e uniforms
    criarCena();
    // Terceiro passo: desenhar e já agendar o próximo redesenho
    tick();
  });
});