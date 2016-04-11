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
 * @file: AT3D WebGL API: Engine em JavaScript para Ambientes Virtuais em WebGL
 * 
 * Este código foi criado na aula prática de Introdução à Computação Gráfica,
 * no dia 05/04/2016 e no dia 08/04/2016, no Instituto de Matemática e Estatís-
 * tica, da Universidade de São Paulo
 */


/**
 * @brief Tipos de uniforms, usado como enumerador de variáveis
 * do shader
 *
 * @type       {Object}
 */
 var UniformType = {
  MATRIX_MODEL:      1,
  MATRIX_VIEW:       2,
  MATRIX_PROJECTION: 3,
  MATRIX_NORMAL:     4,
  LIGHT1_POS:        5,
  LIGHT1_AMBI:       6,
  LIGHT1_DIFF:       7,
  LIGHT1_SPEC:       8,
  LIGHT1_PWER:       9,
  CAMERA_POS:       10
};

/**
 * @brief Tipos de atributos, usado como enumeração de atributos
 * do shader
 *
 * @type       {<type>}
 */
var AttribType = {
  POSITION: 1,
  COLOR: 2,
  NORMAL: 3,
  UV: 4
};

/**
 * @brief Teclas. Usado na captura do teclado
 *
 * @type       {<type>}
 */
var KeyType = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39
}

 
/**
 * @brief Get a response assynchronously (JSON, XML, File...).
 * 
 * 
 * @method     get
 * @param      {<type>}  url     { description }
 * @return     {<type>}  { description_of_the_return_value }
 */
function get(url){
  return new Promise(function(resolve, reject){
    var req = new XMLHttpRequest();
    req.open('GET', url);
    req.onload = function(){
      if(req.status == 200){
        resolve(req.response);
      }else{
        reject(Error(req.statusText));
      }
    };
    req.onerror = function(){
      reject(Error("Network Error"));
    };
    req.send();
  });
}

/**
 * @brief Helper para exibir um dado erro
 *
 * @method     logError
 * @param      {Function}  error   { descrição do erro }
 */
function logError(error){
  console.error("Failed!", error);
}

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
 * { function_description }
 *
 * @method     degToRad
 * @param      {number}  number  { description }
 * @return     {number}  { description_of_the_return_value }
 */
function degToRad(number){
  return number/180.0*Math.PI;
}
function radToDeg(number){
  return number/Math.PI*180.0;
}