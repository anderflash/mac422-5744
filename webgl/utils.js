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
 * @file: pequena biblioteca JavaScript com funções para auxiliar nos
 *        exemplos em WebGL da sala de aula
 * 
 * Este código foi criado na aula prática de Introdução à Computação Gráfica,
 * no dia 05/04/2016, no Instituto de Matemática e Estatística, da Universi-
 * dade de São Paulo
 */


/**
 * @brief: Agendar a execução de uma função tão logo durante
 *         um redesenho da tela. 
 * API: requestAnimFrame(funcao). Execute-a dentro da propria 
 *      `funcao` e você fará animação na página
 *
 * @param funcao Função que será executada no próximo redesenho
 *               da tela.
 * Chamando 
 */
window.requestAnimFrame = (function(){
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         function(callback){
           window.setTimeout(callback, 1000/60);
         };
})();

/**
 * @brief: cria e compila um shader na GPU de um dos tipos (vértice ou
 *         fragmento) que execute um dado código.
 * 
 * O OpenGL/WebGL realiza as seguintes operações:
 * - Transforma os vértices 3D dos objetos em 2D (movendo objetos em
 *   relação ao mundo, o mundo em relação à câmera e projetando-o ao
 *   plano da imagem) => feito pelo shader de vértice 
 * - Digitaliza as primitivas: converte vértices e toda a face em frag-
 *   mentos, candidatos a pixels finais. Interpola as saídas do shader
 *   de vértice e envia para o shader de fragmento => feito internamente 
 *   pelo WebGL.
 * - Colorir o fragmento usando as informações interpoladas (varying) e 
 *   informações globais (uniforms) => feito pelo shader de fragmento
 * - Compor (se tiver alpha blending) ou escolher (Z-Buffer) os fragmentos
 *   e definir os pixels finais e a tela final.
 *   
 * Pelos shaders, temos controle sobre os passos 1 e 3 (o resto podemos 
 * modificar através de parâmetros, mas não modificamos o código). Dessa
 * forma, somos nós que devemos mostrar como transformar os vértices e 
 * como colori-los.
 *
 * @param gl   contexto WebGL criado previamente
 * @param type assuma gl como a variável do contexto WebGL. Então,
 *             passando `gl.VERTEX_SHADER`, você cria um shader de 
 *             vértice, e `gl.FRAGMENT_SHADER` para fragmento
 * @param code o código a ser executado na GPU. Lembrar que um shader
 *             de vértice no mínimo envia um gl_Position, enquanto que
 *             um shader de fragmento atribui um valor a gl_FragColor.
 */
function compileShader(gl, type, code){
  var shaderID = gl.createShader(type);
  gl.shaderSource(shaderID, code);
  gl.compileShader(shaderID);
  if(!gl.getShaderParameter(shaderID, gl.COMPILE_STATUS)){
    console.error(gl.getShaderInfoLog(shaderID));
  }
  return shaderID;
}

class Mesh{
  constructor(){
    this.vertices = [];
    this.normals  = [];
    this.colors   = [];
    this.position = [];
    this.orientation = [];
    this.modelMatrix = Array(16);
  }
  computeModelMatrix(){
    var m = this.modelMatrix;
    var p = this.position;
    var o = this.orientation;

    var cosX = Math.cos(o[0]);
    var cosY = Math.cos(o[1]);
    var cosZ = Math.cos(o[2]);

    var sinX = Math.sin(o[0]);
    var sinY = Math.sin(o[1]);
    var sinZ = Math.sin(o[2]);

    // Do m[0] ao m[11], estamos convertendo os ângulos de Euler para
    // uma matriz de Rotação
    m[0 ]  = cosY*cosZ;                   
    m[1 ]  = cosY * sinZ;
    m[2 ]  = -sinY;
    m[3 ]  = 1;

    m[4 ]  = sinX*sinY*cosZ - cosX*sinZ;  
    m[5 ]  = sinX*sinY*sinZ + cosX*cosZ;
    m[6 ]  = sinX*cosY;
    m[7 ]  = 1;

    m[8 ]  = cosX*sinY*cosZ + sinX*sinZ;
    m[9 ]  = cosX*sinY*sinZ - sinX*cosZ;
    m[10]  = cosX*cosY;
    m[11]  = 1;
    // A origem será a posição do objeto
    m[12]  = p[0]; m[13] = p[1]; m[14] = p[2] ; m[15] = 1;
  }
}
class Scene{
  constructor(){
    this.objects = [];
    this.materials = [];
  }
}

class Renderer{
  constructor(){
    this.program = null;
  }
  createShader(vertexFile, programFile){
      compileShader()
  }
}

class Camera{
  constructor(){
    this.right   = new Float32Array(3);
    this.forward = new Float32Array(3);
    this.up      = new Float32Array(3);
    this.origin  = new Float32Array(3);

    this.viewMatrix       = new Float32Array(16);
    this.projectionMatrix = new Float32Array(16);
  }
  resetViewMatrix(){
    var r = this.right, f = this.forward, u = this.up;
    r[0] = 1; r[1] = 0; r[2] = 0;
    f[0] = 0; f[1] = 1; f[2] = 0;
    u[0] = 0; u[1] = 0; u[2] = 1;

    updateViewMatrix();
  }
  updateViewMatrix(){
    var v = this.viewMatrix, o = this.origin;
    var r = this.right, f = this.forward, u = this.up;

    v[0 ] = r[0]; v[1 ] = r[1]; v[2 ] = r[2]; v[3 ] = 0;
    v[4 ] = f[0]; v[5 ] = f[1]; v[6 ] = f[2]; v[7 ] = 0;
    v[8 ] = u[0]; v[9 ] = u[1]; v[10] = u[2]; v[11] = 0;
    v[12] = o[0]; v[13] = o[1]; v[14] = o[2]; v[15] = 1;
  }
  moveRight(units){
    var o = this.origin, r = this.right;
    o[0] += r[0]*units;
    o[1] += r[1]*units;
    o[2] += r[2]*units;
  }
  moveLeft(units){
    this.moveRight(-units);
  }
  moveForward(units){
    var o = this.origin, f = this.forward;
    o[0] += f[0]*units;
    o[1] += f[1]*units;
    o[2] += f[2]*units;
  }
  moveBackwards(units){
    this.moveForward(-units);
  }
  
}
class PerspectiveCamera{
  constructor(){
    this.fov    = null;
    this.aspect = null;
    this.near   = null;
    this.far    = null;
  }
  makePerspective(fov, aspect, near, far){
    this.fov    = fov;
    this.aspect = aspect;
    this.near   = near;
    this.far    = far;

    var zoom     = 1;
    var new_fov  = radToDeg(2 * Math.atan(Math.tan(degToRad(fov) * 0.5)/zoom));
    var ymax     = near * Math.tan(degToRad(new_fov * 0.5));
    var ymin     = - ymax;
    var xmin     = ymin * aspect;
    var xmax     = ymax * aspect;
    return this.frustrum(xmin, xmax, ymin, ymax, near, far);
  }
  frustrum(left, right, bottom, top, near, far){
    var te = this.projectionMatrix;
    var x = 2 * near / ( right - left );
    var y = 2 * near / ( top - bottom );

    var a = ( right + left ) / ( right - left );
    var b = ( top + bottom ) / ( top - bottom );
    var c = - ( far + near ) / ( far - near );
    var d = - 2 * far * near / ( far - near );

    te[ 0 ] = x;  te[ 4 ] = 0;  te[ 8 ] = a;  te[ 12 ] = 0;
    te[ 1 ] = 0;  te[ 5 ] = y;  te[ 9 ] = b;  te[ 13 ] = 0;
    te[ 2 ] = 0;  te[ 6 ] = 0;  te[ 10 ] = c; te[ 14 ] = d;
    te[ 3 ] = 0;  te[ 7 ] = 0;  te[ 11 ] = - 1; te[ 15 ] = 0;
    return te;
  }
}
class OrthographicCamera{
  constructor(){
    this.left   = null;
    this.right  = null;
    this.bottom = null;
    this.top    = null;
    this.near   = null;
    this.far    = null;
  }
  makeOrthographic(left, right, bottom, top, near, far){

  }
}

class Light{
  constructor(){
    this.ambient_color = null;
    this.diffuse_color = null;
    this.specular_color= null;
    this.power         = null;
  }
}
class PointLight extends Light{
  constructor(){
    this.position      = null;
  }
}
class DirectionalLight extends Light{
  constructor(){
    this.direction     = null;
  }
}

/**
 * @brief: combina dois shaders e cria um programa a ser usado na GPU
 * 
 * Você tem poder de criar diversos efeitos dentro de um mesmo ambiente
 * através de diferentes programas. Dois programas podem compartilhar o 
 * mesmo shader de vértice (ou seja, a mesma transformação geométrica),
 * mudando apenas a forma com que colore o fragmento. Ou então dois 
 * programas podem diferir apenas no shader de vértice. Por exemplo, o
 * horizonte não muda de posição mesmo se o avatar caminhar para frente,
 * apenas rotaciona, mas tem o mesmo efeito visual das árvores, do chão... 
 * 
 * @param gl               contexto WebGL criado previamente
 * @param vertexShaderID   assumindo que o sistema já compilou o shader
 *                         de vértice, `compileProgram` recebe o id 
 * @param fragmentShaderID assumindo que o sistema já compilou o shader
 *                         de fragmento, `compileProgram` recebe o id 
 * @return identificador (int) de um programa compilado na GPU
 */
function compileProgram(gl, vertexShaderID, fragmentShaderID){
  var programID = gl.createProgram();
  gl.attachShader(programID, vertexShaderID);
  gl.attachShader(programID, fragmentShaderID);
  gl.linkProgram(programID);
  if(!gl.getProgramParameter(programID, gl.LINK_STATUS)){
    console.error(gl.getProgramInfoLog(programID));
  }
  return programID;
}

function degToRad(number){
  return number/180.0*Math.PI;
}
function radToDeg(number){
  return number/Math.PI*180.0;
}
function perspective(fov, aspect, near, far){
    var zoom = 1;
    var new_fov  = radToDeg(2 * Math.atan(Math.tan(degToRad(fov) * 0.5)/zoom));
    var ymax     = near * Math.tan(degToRad(new_fov * 0.5));
    var ymin     = - ymax;
    var xmin     = ymin * aspect;
    var xmax     = ymax * aspect;
    return frustrum(xmin, xmax, ymin, ymax, near, far);
  }
function frustrum(left, right, bottom, top, near, far){
    var te = Array(16);
    var x = 2 * near / ( right - left );
    var y = 2 * near / ( top - bottom );

    var a = ( right + left ) / ( right - left );
    var b = ( top + bottom ) / ( top - bottom );
    var c = - ( far + near ) / ( far - near );
    var d = - 2 * far * near / ( far - near );

    te[ 0 ] = x;  te[ 4 ] = 0;  te[ 8 ] = a;  te[ 12 ] = 0;
    te[ 1 ] = 0;  te[ 5 ] = y;  te[ 9 ] = b;  te[ 13 ] = 0;
    te[ 2 ] = 0;  te[ 6 ] = 0;  te[ 10 ] = c; te[ 14 ] = d;
    te[ 3 ] = 0;  te[ 7 ] = 0;  te[ 11 ] = - 1; te[ 15 ] = 0;
    return te;
  }

/**
 * @brief: gera uma matriz identidade 4x4 (uma lista de 16 números reais)
 * 
 * $$
 * I = \begin{bmatrix}
 *  1.0 & 0.0 & 0.0 & 0.0\\
 *  0.0 & 1.0 & 0.0 & 0.0\\
 *  0.0 & 0.0 & 1.0 & 0.0\\
 *  0.0 & 0.0 & 0.0 & 1.0
 * \end{bmatrix}
 * $$
 * 
 * Vale lembrar que como WebGL utiliza ordem column-major, então a 1ª linha
 * da lista na verdade é a 1ª coluna de $I$, a 2ª linha da lista é a 2ª coluna
 * de $I$, e assim sucessivamente.
 * 
 * @method     eye
 * @return     Array  uma lista de 16 números reais
 */
function eye(){
  return [1.0, 0.0, 0.0, 0.0,
          0.0, 1.0, 0.0, 0.0,
          0.0, 0.0, 1.0, 0.0,
          0.0, 0.0, 0.0, 1.0];
}

/**
 * @brief  Modifica uma matriz 4x4 para adicionar uma translação 3D
 *
 * @method translate
 * @param  Array  matrix       Uma lista de 16 elementos (4x4)
 * @param  Array  translation  Uma lista de 3 elementos
 */
function translate(matrix, translation){
  matrix[12] += translation[0];
  matrix[13] += translation[1];
  matrix[14] += translation[2];
}