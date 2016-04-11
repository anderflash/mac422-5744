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

var AttribType = {
  POSITION: 1,
  COLOR: 2,
  NORMAL: 3,
  UV: 4
};
var KeyType = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39
}

class Object3D{
  constructor(){
    this.name = null;
    this.modelMatrix = new Matrix4();
    this.normalMatrix = new Matrix4();
  }
  resetMatrix(){
    this.modelMatrix.eye();
  }
  translate(vector){
    this.modelMatrix.translate(vector);
  }
  rotate(angle, axis){
    this.modelMatrix.rotate(angle,axis);
  }
  scale(vector){
    this.modelMatrix.scale(vector);
  }
  calculateNormalMatrix(viewMatrix){
    this.normalMatrix.set(viewMatrix);
    this.normalMatrix.premultiply(this.modelMatrix);
    this.normalMatrix.inverse();
    this.normalMatrix.transpose();
  }
}

class Mesh extends Object3D{
  constructor(){
    super();
    this.vertices = [];
    this.normals  = [];
    this.colors   = [];
    this.position = [];
    this.orientation = [];
    this.changed = false;
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
class Container3D extends Object3D{
  constructor(){
    super();
    this.objects = [];
  }
  addObject(object){
    this.objects.push(object);
  }
}
class Scene extends Container3D{
  constructor(){
    super();
    this.materials = [];
    this.lights = [];
  }
  addLight(light){
    this.lights.push(light);
  }
}

class ShaderProgram{
  constructor(){
    this.vertexShaderID = null;
    this.fragmentShaderID = null;
    this.id = null;
  }
}

class Renderer{
  constructor(){
    this.programs    = [];
    this.cur_program = null;
    this.canvas      = null;
    this.gl          = null;
    this.aspect      = null;
    this.uniforms    = {};
    this.attributes  = {};
    this.vertexBuffers = {};
    this.normalBuffers = {};
    this.indicesBuffers = {};
  }
  getContext(canvasname){
    // Obter o canvas
    this.canvas = document.getElementById(canvasname);
    if(!this.canvas){
      console.error("Canvas não obtido");
    }

    // Criar o contexto WebGL
    this.gl = this.canvas.getContext("webgl")|| this.canvas.getContext("experimental-webgl");
    this.aspect = this.canvas.clientWidth/this.canvas.clientHeight;
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);

  }
  createProgram(vertexFile, fragFile){
    var renderer   = this;
    this.cur_program = new ShaderProgram();
    var p = renderer.cur_program;

    // Compilar o vertex
    var vertexPromise = get(vertexFile)
      .then(function(code){
        p.vertexShaderID = compileShader(renderer.gl,renderer.gl.VERTEX_SHADER,code);
      });

    // Compilar o fragment
    var fragPromise = get(fragFile)
      .then(function(code){
        p.fragmentShaderID = compileShader(renderer.gl,renderer.gl.FRAGMENT_SHADER,code);
      });

    return Promise.all([vertexPromise, fragPromise]).then(function(){
      var v = renderer.cur_program.vertexShaderID;
      var f = renderer.cur_program.fragmentShaderID;
      renderer.cur_program.id = compileProgram(renderer.gl,v,f);
      renderer.programs.push(renderer.cur_program);
    });
  }
  set background(color){
    this.gl.clearColor.apply(this.gl,color);
  }
  clear(){
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }
  upload(object){
    var gl = this.gl;
    if(object instanceof Mesh){
      if(!this.vertexBuffers.hasOwnProperty(object.name))
        this.vertexBuffers[object.name] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffers[object.name]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices),gl.STATIC_DRAW);

      if(!this.normalBuffers.hasOwnProperty(object.name))
        this.normalBuffers[object.name] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffers[object.name]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.normals),gl.STATIC_DRAW);

      if(!this.indicesBuffers.hasOwnProperty(object.name))
        this.indicesBuffers[object.name] = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffers[object.name]);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices),gl.STATIC_DRAW);

      object.changed = false;
    }else if(object instanceof Camera){
      var v = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.MATRIX_VIEW]);
      var p = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.MATRIX_PROJECTION]);
      gl.uniformMatrix4fv(v, false, object.viewMatrix);
      gl.uniformMatrix4fv(p, false, object.projectionMatrix);
    }else if(object instanceof PointLight){
      var lp = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.LIGHT1_POS]);
      var la = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.LIGHT1_AMBI]);
      var ld = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.LIGHT1_DIFF]);
      var ls = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.LIGHT1_SPEC]);
      var lw = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.LIGHT1_PWER]);
      gl.uniform3fv(lp, object.position);
      gl.uniform3fv(la, object.ambient_color);
      gl.uniform3fv(ld, object.diffuse_color);
      gl.uniform3fv(ls, object.specular_color);
      gl.uniform1f(lw, object.power);
    }
  }

  render(scene, camera){
    var gl      = this.gl;
    var pAttr   = gl.getAttribLocation(this.cur_program.id,
                                       this.attributes[AttribType.POSITION]);
    var nAttr   = gl.getAttribLocation(this.cur_program.id,
                                       this.attributes[AttribType.NORMAL]);

    gl.useProgram(this.cur_program.id);

    // Enviando câmera
    if(camera.changed){
      this.upload(camera);
    }
    var c = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.CAMERA_POS]);
    gl.uniform3fv(c, camera.origin);

    // Enviando as luzes
    for(let light of scene.lights){
      this.upload(light);
    }

    for(let object of scene.objects){
      if(object instanceof Mesh){
        if(object.changed)
          this.upload(object);        
        var m = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.MATRIX_MODEL]);
        gl.uniformMatrix4fv(m, false, object.modelMatrix);
        object.modelMatrix.changed = false;
        
        object.calculateNormalMatrix(camera.viewMatrix);
        var n = gl.getUniformLocation(this.cur_program.id, this.uniforms[UniformType.MATRIX_NORMAL]);
        gl.uniformMatrix4fv(n, false, object.normalMatrix);

        var vBuffer = this.vertexBuffers [object.name];
        var nBuffer = this.normalBuffers [object.name];
        var iBuffer = this.indicesBuffers[object.name];

        // Ativando os atributos
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.enableVertexAttribArray(pAttr);
        gl.vertexAttribPointer(pAttr, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.enableVertexAttribArray(nAttr);
        gl.vertexAttribPointer(nAttr, 3, gl.FLOAT, false, 0, 0);

        // Desenhando
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(pAttr);
        gl.disableVertexAttribArray(nAttr);
      }else if(object instanceof Container3D){
        this.render(object, camera);
      }
    }
    gl.useProgram(null);
  }
}

class Vec3 extends Float32Array{
  constructor(data){
    super(3);
    if(data){
      this[0] = data[0];
      this[1] = data[1];
      this[2] = data[2];
    }
    else{
      this[0] = 0;
      this[1] = 0;
      this[2] = 0;
    }
  }
  toX(){
    this[0] = 1;
    this[1] = 0;
    this[2] = 0;
  }
  toY(){
    this[0] = 0;
    this[1] = 1;
    this[2] = 0;
  }
  toZ(){
    this[0] = 0;
    this[1] = 0;
    this[2] = 1;
  }
  set value(data){
    this[0] = data[0];
    this[1] = data[1];
    this[2] = data[2];
  }
  dot(other){
    return this[0] * other[0] +
           this[1] * other[1] +
           this[2] * other[2] ;
  }
  cross(other){
    return new Vec3([
      this[1] * other[2] - this[2] * other[1],
      this[2] * other[0] - this[0] * other[2],
      this[0] * other[1] - this[1] * other[0]
    ]);
  }
  normalize(){
    var magnitude = this.magnitude();
    this[0] /= magnitude;
    this[1] /= magnitude;
    this[2] /= magnitude;
  }
  magnitude(){
    return Math.sqrt(this[0]*this[0] + this[1]*this[1] + this[2]*this[2]);
  }
  add(vector){
    this[0] += vector[0];
    this[1] += vector[1];
    this[2] += vector[2];
  }
  subtract(vector){
    this[0] -= vector[0];
    this[1] -= vector[1];
    this[2] -= vector[2];
  }
  multiply(vector){
    this[0] *= vector[0];
    this[1] *= vector[1];
    this[2] *= vector[2];
  }
}
class Matrix4 extends Float32Array{
  constructor(){
    super(16);
    this.eye();
    this.changed = true;
  }
  eye(){
    this[0 ] = 1;this[1 ] = 0;this[2 ] = 0;this[3 ] = 0;
    this[4 ] = 0;this[5 ] = 1;this[6 ] = 0;this[7 ] = 0;
    this[8 ] = 0;this[9 ] = 0;this[10] = 1;this[11] = 0;
    this[12] = 0;this[13] = 0;this[14] = 0;this[15] = 1;
    this.changed = true;
  }
  translate(vector){
    this[12] += vector[0];
    this[13] += vector[1];
    this[14] += vector[2];
    this.changed = true;
  }
  rotate(angle, ax){
    var c = Math.cos(degToRad(angle));
    var cm = 1-c;
    var s = Math.sin(degToRad(angle));

    var r = new Matrix4();

    r[0 ] = c + ax[0]*ax[0]*cm;
    r[1 ] = ax[1]*ax[0]*cm + ax[2]*s;
    r[2 ] = ax[2]*ax[0]*cm - ax[1]*s;
    
    r[4 ] = ax[0]*ax[1]*cm - ax[2]*s;
    r[5 ] = c + ax[1]*ax[1]*cm;
    r[6 ] = ax[0]*ax[1]*cm + ax[2]*s;
    
    r[8 ] = ax[0]*ax[2]*cm + ax[1]*s;
    r[9 ] = ax[1]*ax[2]*cm - ax[0]*s;
    r[10] = c + ax[2]*ax[2]*cm;

    this.premultiply(r);
    this.changed = true;
  }
  scale(vector){
    this[0 ] *= vector[0];
    this[5 ] *= vector[1];
    this[10] *= vector[2];
    this.changed = true;
  }
  multiply(matrix){
    this[0] = this[0 ] * matrix[0] +
              this[4 ] * matrix[1] +
              this[8 ] * matrix[2] +
              this[12] * matrix[3];
    this[1] = this[1 ] * matrix[0] +
              this[5 ] * matrix[1] +
              this[9 ] * matrix[2] +
              this[13] * matrix[3];
    this[2] = this[2 ] * matrix[0] +
              this[6 ] * matrix[1] +
              this[10] * matrix[2] +
              this[14] * matrix[3];
    this[3] = this[3 ] * matrix[0] +
              this[7 ] * matrix[1] +
              this[11] * matrix[2] +
              this[15] * matrix[3];

    this[4] = this[0 ] * matrix[4] +
              this[4 ] * matrix[5] +
              this[8 ] * matrix[6] +
              this[12] * matrix[7];
    this[5] = this[1 ] * matrix[4] +
              this[5 ] * matrix[5] +
              this[9 ] * matrix[6] +
              this[13] * matrix[7];
    this[6] = this[2 ] * matrix[4] +
              this[6 ] * matrix[5] +
              this[10] * matrix[6] +
              this[14] * matrix[7];
    this[7] = this[3 ] * matrix[4] +
              this[7 ] * matrix[5] +
              this[11] * matrix[6] +
              this[15] * matrix[7];

    this[8] = this[0 ] * matrix[8 ] +
              this[4 ] * matrix[9 ] +
              this[8 ] * matrix[10] +
              this[12] * matrix[11];
    this[9] = this[1 ] * matrix[8 ] +
              this[5 ] * matrix[9 ] +
              this[9 ] * matrix[10] +
              this[13] * matrix[11];
    this[10]= this[2 ] * matrix[8 ] +
              this[6 ] * matrix[9 ] +
              this[10] * matrix[10] +
              this[14] * matrix[11];
    this[11]= this[3 ] * matrix[8 ] +
              this[7 ] * matrix[9 ] +
              this[11] * matrix[10] +
              this[15] * matrix[11];

    this[12]= this[0 ] * matrix[12] +
              this[4 ] * matrix[13] +
              this[8 ] * matrix[14] +
              this[12] * matrix[15];
    this[13]= this[1 ] * matrix[12] +
              this[5 ] * matrix[13] +
              this[9 ] * matrix[14] +
              this[13] * matrix[15];
    this[14]= this[2 ] * matrix[12] +
              this[6 ] * matrix[13] +
              this[10] * matrix[14] +
              this[14] * matrix[15];
    this[15]= this[3 ] * matrix[12] +
              this[7 ] * matrix[13] +
              this[11] * matrix[14] +
              this[15] * matrix[15];
    this.changed = true;
  }
  premultiply(matrix){
    this[0] = matrix[0 ] * this[0] +
              matrix[4 ] * this[1] +
              matrix[8 ] * this[2] +
              matrix[12] * this[3];
    this[1] = matrix[1 ] * this[0] +
              matrix[5 ] * this[1] +
              matrix[9 ] * this[2] +
              matrix[13] * this[3];
    this[2] = matrix[2 ] * this[0] +
              matrix[6 ] * this[1] +
              matrix[10] * this[2] +
              matrix[14] * this[3];
    this[3] = matrix[3 ] * this[0] +
              matrix[7 ] * this[1] +
              matrix[11] * this[2] +
              matrix[15] * this[3];

    this[4] = matrix[0 ] * this[4] +
              matrix[4 ] * this[5] +
              matrix[8 ] * this[6] +
              matrix[12] * this[7];
    this[5] = matrix[1 ] * this[4] +
              matrix[5 ] * this[5] +
              matrix[9 ] * this[6] +
              matrix[13] * this[7];
    this[6] = matrix[2 ] * this[4] +
              matrix[6 ] * this[5] +
              matrix[10] * this[6] +
              matrix[14] * this[7];
    this[7] = matrix[3 ] * this[4] +
              matrix[7 ] * this[5] +
              matrix[11] * this[6] +
              matrix[15] * this[7];

    this[8] = matrix[0 ] * this[8 ] +
              matrix[4 ] * this[9 ] +
              matrix[8 ] * this[10] +
              matrix[12] * this[11];
    this[9] = matrix[1 ] * this[8 ] +
              matrix[5 ] * this[9 ] +
              matrix[9 ] * this[10] +
              matrix[13] * this[11];
    this[10]= matrix[2 ] * this[8 ] +
              matrix[6 ] * this[9 ] +
              matrix[10] * this[10] +
              matrix[14] * this[11];
    this[11]= matrix[3 ] * this[8 ] +
              matrix[7 ] * this[9 ] +
              matrix[11] * this[10] +
              matrix[15] * this[11];

    this[12]= matrix[0 ] * this[12] +
              matrix[4 ] * this[13] +
              matrix[8 ] * this[14] +
              matrix[12] * this[15];
    this[13]= matrix[1 ] * this[12] +
              matrix[5 ] * this[13] +
              matrix[9 ] * this[14] +
              matrix[13] * this[15];
    this[14]= matrix[2 ] * this[12] +
              matrix[6 ] * this[13] +
              matrix[10] * this[14] +
              matrix[14] * this[15];
    this[15]= matrix[3 ] * this[12] +
              matrix[7 ] * this[13] +
              matrix[11] * this[14] +
              matrix[15] * this[15];
    this.changed = true;
  }
  inverse(){
    var inv = new Matrix4();
    var det;
    var i;
    var m = this;

    inv[0] = m[5]  * m[10] * m[15] - 
             m[5]  * m[11] * m[14] - 
             m[9]  * m[6]  * m[15] + 
             m[9]  * m[7]  * m[14] +
             m[13] * m[6]  * m[11] - 
             m[13] * m[7]  * m[10];

    inv[4] = -m[4]  * m[10] * m[15] + 
              m[4]  * m[11] * m[14] + 
              m[8]  * m[6]  * m[15] - 
              m[8]  * m[7]  * m[14] - 
              m[12] * m[6]  * m[11] + 
              m[12] * m[7]  * m[10];

    inv[8] = m[4]  * m[9] * m[15] - 
             m[4]  * m[11] * m[13] - 
             m[8]  * m[5] * m[15] + 
             m[8]  * m[7] * m[13] + 
             m[12] * m[5] * m[11] - 
             m[12] * m[7] * m[9];

    inv[12] = -m[4]  * m[9] * m[14] + 
               m[4]  * m[10] * m[13] +
               m[8]  * m[5] * m[14] - 
               m[8]  * m[6] * m[13] - 
               m[12] * m[5] * m[10] + 
               m[12] * m[6] * m[9];

    inv[1] = -m[1]  * m[10] * m[15] + 
              m[1]  * m[11] * m[14] + 
              m[9]  * m[2] * m[15] - 
              m[9]  * m[3] * m[14] - 
              m[13] * m[2] * m[11] + 
              m[13] * m[3] * m[10];

    inv[5] = m[0]  * m[10] * m[15] - 
             m[0]  * m[11] * m[14] - 
             m[8]  * m[2] * m[15] + 
             m[8]  * m[3] * m[14] + 
             m[12] * m[2] * m[11] - 
             m[12] * m[3] * m[10];

    inv[9] = -m[0]  * m[9] * m[15] + 
              m[0]  * m[11] * m[13] + 
              m[8]  * m[1] * m[15] - 
              m[8]  * m[3] * m[13] - 
              m[12] * m[1] * m[11] + 
              m[12] * m[3] * m[9];

    inv[13] = m[0]  * m[9] * m[14] - 
              m[0]  * m[10] * m[13] - 
              m[8]  * m[1] * m[14] + 
              m[8]  * m[2] * m[13] + 
              m[12] * m[1] * m[10] - 
              m[12] * m[2] * m[9];

    inv[2] = m[1]  * m[6] * m[15] - 
             m[1]  * m[7] * m[14] - 
             m[5]  * m[2] * m[15] + 
             m[5]  * m[3] * m[14] + 
             m[13] * m[2] * m[7] - 
             m[13] * m[3] * m[6];

    inv[6] = -m[0]  * m[6] * m[15] + 
              m[0]  * m[7] * m[14] + 
              m[4]  * m[2] * m[15] - 
              m[4]  * m[3] * m[14] - 
              m[12] * m[2] * m[7] + 
              m[12] * m[3] * m[6];

    inv[10] = m[0]  * m[5] * m[15] - 
              m[0]  * m[7] * m[13] - 
              m[4]  * m[1] * m[15] + 
              m[4]  * m[3] * m[13] + 
              m[12] * m[1] * m[7] - 
              m[12] * m[3] * m[5];

    inv[14] = -m[0]  * m[5] * m[14] + 
               m[0]  * m[6] * m[13] + 
               m[4]  * m[1] * m[14] - 
               m[4]  * m[2] * m[13] - 
               m[12] * m[1] * m[6] + 
               m[12] * m[2] * m[5];

    inv[3] = -m[1] * m[6] * m[11] + 
              m[1] * m[7] * m[10] + 
              m[5] * m[2] * m[11] - 
              m[5] * m[3] * m[10] - 
              m[9] * m[2] * m[7] + 
              m[9] * m[3] * m[6];

    inv[7] = m[0] * m[6] * m[11] - 
             m[0] * m[7] * m[10] - 
             m[4] * m[2] * m[11] + 
             m[4] * m[3] * m[10] + 
             m[8] * m[2] * m[7] - 
             m[8] * m[3] * m[6];

    inv[11] = -m[0] * m[5] * m[11] + 
               m[0] * m[7] * m[9] + 
               m[4] * m[1] * m[11] - 
               m[4] * m[3] * m[9] - 
               m[8] * m[1] * m[7] + 
               m[8] * m[3] * m[5];

    inv[15] = m[0] * m[5] * m[10] - 
              m[0] * m[6] * m[9] - 
              m[4] * m[1] * m[10] + 
              m[4] * m[2] * m[9] + 
              m[8] * m[1] * m[6] - 
              m[8] * m[2] * m[5];

    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

    if (det == 0)
        return false;

    det = 1.0 / det;

    for (i = 0; i < 16; i++)
      this[i] = inv[i] * det;

    return true;
  }
  transpose(){
    var t;
    t = this[1 ]; this[1 ] = this[4 ]; this[4 ] = t;
    t = this[2 ]; this[2 ] = this[8 ]; this[8 ] = t;
    t = this[3 ]; this[3 ] = this[12]; this[12] = t;
    t = this[6 ]; this[6 ] = this[9 ]; this[9 ] = t;
    t = this[7 ]; this[7 ] = this[13]; this[13] = t;
    t = this[11]; this[11] = this[14]; this[14] = t;
  }

}

class Camera{
  constructor(){
    this.right   = new Vec3([ 1, 0, 0]);
    this.forward = new Vec3([ 0, 0,-1]);
    this.up      = new Vec3([ 0, 1, 0]);
    this.origin  = new Vec3([ 0, 0, 0]);

    this.viewMatrix       = new Float32Array(16);
    this.projectionMatrix = new Float32Array(16);

    this.changed = true;
  }
  resetViewMatrix(){
    var r = this.right, f = this.forward, u = this.up;
    r[0] = 1; r[1] = 0; r[2] =  0;
    u[0] = 0; u[1] = 1; u[2] =  0;
    f[0] = 0; f[1] = 0; f[2] = -1;

    this.updateViewMatrix();
  }
  updateViewMatrix(){
    var v = this.viewMatrix, o = this.origin;
    var r = this.right, f = this.forward, u = this.up;

    v[0 ] = r[0]; v[1 ] = u[0]; v[2 ] =-f[0]; v[3 ] = 0;
    v[4 ] = r[1]; v[5 ] = u[1]; v[6 ] =-f[1]; v[7 ] = 0;
    v[8 ] = r[2]; v[9 ] = u[2]; v[10] =-f[2]; v[11] = 0;
    v[12] =-r.dot(o); 
    v[13] =-u.dot(o); 
    v[14] = f.dot(o);
    v[15] = 1;

    this.changed = true;
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
  yaw(units){
    var r = this.right, f = this.forward;
    // Rotação sobre o eixo up
    var cosU = Math.cos(degToRad(units));
    var sinU = Math.sin(degToRad(units));

    // O yaw rotaciona o right e forward
    var new_right = [r[0]*cosU + f[0]*sinU,
                     r[1]*cosU + f[1]*sinU,
                     r[2]*cosU + f[2]*sinU];
    f[0] = f[0]*cosU - r[0]*sinU;
    f[0] = f[0]*cosU - r[0]*sinU;
    f[0] = f[0]*cosU - r[0]*sinU;

    r[0] = new_right[0];
    r[1] = new_right[1];
    r[2] = new_right[2];
    console.log(r);
  }
  pitch(units){
    var f = this.forward, u = this.up;
    // Rotação sobre o eixo right
    var cosR = Math.cos(degToRad(units));
    var sinR = Math.sin(degToRad(units));

    var new_f = [f[0]*cosR + u[0]*sinR,
                 f[1]*cosR + u[1]*sinR,
                 f[2]*cosR + u[2]*sinR];
    u[0] = u[0]*cosR - f[0]*sinR;
    u[1] = u[1]*cosR - f[1]*sinR;
    u[2] = u[2]*cosR - f[2]*sinR;

    f[0] = new_f[0];
    f[1] = new_f[1];
    f[2] = new_f[2];
  }
  roll(units){
    var r = this.right, u = this.up;
    // Rotação sobre o eixo right
    var cosF = Math.cos(degToRad(units));
    var sinF = Math.sin(degToRad(units));

    var new_r = [r[0]*cosF + u[0]*sinF,
                 r[1]*cosF + u[1]*sinF,
                 r[2]*cosF + u[2]*sinF];
    u[0] = u[0]*cosF - r[0]*sinF;
    u[1] = u[1]*cosF - r[1]*sinF;
    u[2] = u[2]*cosF - r[2]*sinF;

    r[0] = new_r[0];
    r[1] = new_r[1];
    r[2] = new_r[2];
  }
  lookAt(position, to, up){
    var f = this.forward;
    var o = this.origin;
    var u = this.up;
    var r = this.right;

    o.value = position;

    f[0] = to[0] - o[0];
    f[1] = to[1] - o[1];
    f[2] = to[2] - o[2];

    f.normalize();
    u.value = up;
    r.value = f.cross(u);
    u.value = r.cross(f);
    r.normalize();
    u.normalize();

    this.updateViewMatrix();
  }
  
}
class PerspectiveCamera extends Camera{
  constructor(){
    super();
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
class OrthographicCamera extends Camera{
  constructor(){
    super();
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
    super();
    this.position      = null;
  }
}
class DirectionalLight extends Light{
  constructor(){
    super();
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