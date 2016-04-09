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

/**
 * @brief Envia uma lista para o buffer
 *
 * @method     fillBuffer
 * @param      {Array}     list        { os dados }
 * @param      {int}       bufferType  { tipo de buffer (ARRAY, ELEMENT_ARRAY...) }
 * @param      {Int}       bufferId    { id retornado por `createBuffer` }
 * @param      {Function}  TypeArray   { Uint16Array, Float32Array... }
 */
function fillBuffer(gl, list, bufferType, bufferId, TypeArray){
  if(list.length > 0){
    var flatten = [].concat.apply([], list);
    gl.bindBuffer(bufferType, bufferId);
    gl.bufferData(bufferType, new TypeArray(flatten), gl.STATIC_DRAW);    
  }
}

/**
 * Return a material from a list by name
 *
 * @method     getMaterialByName
 * @param      {Array}    materials  { Lista de materiais }
 * @param      {String}   name       { Nome do material a ser procurado }
 * @return     {Material} { Um material com o nome enviado }
 */
function getMaterialByName(materials, name){
  for(let material of materials)
    if(material.name == name) return material;
}

/**
 * @brief Converter graus para radianos
 *
 * @method     degToRad
 * @param      {number}  number  { description }
 * @return     {number}  { description_of_the_return_value }
 */
function degToRad(number){
  return number/180.0*Math.PI;
}
/**
 * @brief Converter radianos para graus
 *
 * @method     radToDeg
 * @param      {number}  number  { description }
 * @return     {number}  { description_of_the_return_value }
 */
function radToDeg(number){
  return number/Math.PI*180.0;
}


/**
 * @brief Classe para representar um objeto 3D WebGL
 */
class Object3D{
  constructor(){
    this.vertices           = [];
    this.normals            = [];
    this.texcoords          = [];
    this.indices            = [];
    this.name               = null;
    this.material           = null;
  }
  pack_indices(){
    
  }
}

/**
 * @brief Classe para representar um material
 */
class Material{
  constructor(){
    this.ambient            = null;
    this.diffuse            = null;
    this.specular           = null;
    this.emissive           = null;
    this.name               = null;
    this.shininess          = 0;
    this.refraction_index   = 0;
    this.transparency       = 0;
    this.illumination_model = 0;
  }
}

/**
 * @brief Classe que associa um buffer ao material
 */
class MaterialBuffer{
  constructor(material){
    this.material           = material;
  }
}

/**
 * @brief Classe que guarda os buffers da GPU para um dado objeto
 */
class Object3DBuffer{
  constructor(gl){
    this.gl                 = gl;
    this.object             = null;
    this.posBufferID        = -1;
    this.normalBufferID     = -1;
    this.texcoordBufferID   = -1;
    this.indicesBufferID    = -1;
  }
  upload(object){
    this.object             = object;
    this.posBufferID        = this.gl.createBuffer();
    this.normalBufferID     = this.gl.createBuffer();
    this.texcoordBufferID   = this.gl.createBuffer();
    this.indicesBufferID    = this.gl.createBuffer();

    fillBuffer(this.gl, this.object.vertices,  this.gl.ARRAY_BUFFER,         this.posBufferID,      Float32Array);
    fillBuffer(this.gl, this.object.normals,   this.gl.ARRAY_BUFFER,         this.normalBufferID,   Float32Array);
    fillBuffer(this.gl, this.object.texcoords, this.gl.ARRAY_BUFFER,         this.texcoordBufferID, Float32Array);
    fillBuffer(this.gl, this.object.indices,   this.gl.ELEMENT_ARRAY_BUFFER, this.indicesBufferID,  Uint16Array);
  }
}

/**
 * @brief Classe com informações sobre um programa
 */
class ShaderProgram{
  constructor(gl){
    this.gl                 = gl;
    this.vertexShaderID     = -1;
    this.fragmentShaderID   = -1;
    this.id                 = -1;
    this.uniforms           = {};
    this.attributes         = {};
  }
  use(){
    this.gl.useProgram(this.id);
  }
  release(){
    this.gl.useProgram(0);
  }
  /**
   * Carregar vertex e fragment shaders
   *
   * @method     loadShaders
   * @param      {<type>}  vertexFile    { description }
   * @param      {<type>}  fragmentFile  { description }
   */
  loadShaders(vertexFile, fragmentFile){
    var program = this;
    var vertexPromise   = get(vertexFile).then(function(data){
      program.vertexShaderID = compileShader(program.gl, program.gl.VERTEX_SHADER, data);
    });
    var fragmentPromise = get(fragmentFile).then(function(data){
      program.fragmentShaderID = compileShader(program.gl, program.gl.FRAGMENT_SHADER, data);
    });
    return Promise.all([vertexPromise, fragmentPromise]);
  }
  compile(){
    this.id = this.gl.createProgram();
    this.gl.attachShader(this.id, this.vertexShaderID);
    this.gl.attachShader(this.id, this.fragmentShaderID);
    this.gl.linkProgram(this.id);
    if(!this.gl.getProgramParameter(this.id, this.gl.LINK_STATUS)){
      console.error(this.gl.getProgramInfoLog(this.id));
    }
    return this.id;
  }
  getUniforms(names){
    for(let name of names)
      this.uniforms[name] = this.gl.getUniformLocation(this.id, name);
  }
  getAttributes(names){
    for(let name of names)
      this.attributes[name] = this.gl.getAttribLocation(this.id, name);
  }
}







/**
 * @brief Classe que associa uma cena, o canvas, o contexto, a camera e o programa
 */
class Renderer{
  constructor(){
    this.canvas  = null;
    this.program = null;
    this.scene   = null;
    this.camera  = null;
    this.gl      = null;
  }

  init(canvasname){
    this.canvas = document.getElementById(canvasname);
    if(!this.canvas){
      console.error("Canvas não obtido");
    }
    // Criar o contexto WebGL
    this.gl = this.canvas.getContext("webgl")|| this.canvas.getContext("experimental-webgl");
    if(this.gl == null){
      console.error("Contexto não obtido"); 
    }
  }
  createProgram(vertexFile, fragFile, uniformsList, attributesList){
    var renderer = this;
    // Compilar um programa de shader
    renderer.program = new ShaderProgram(this.gl);
    return renderer.program.loadShaders(vertexFile,fragFile).then(function(){
      renderer.program.compile();
      renderer.program.getUniforms(uniformsList);
      renderer.program.getAttributes(attributesList);
    });
  }
  clear(){
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /**
   * Renderizar uma cena por uma camera
   *
   * @method     render
   * @param      {Scene}   scene  { Um conjunto de objetos }
   * @param      {Camera}  camera { Camera para view e projection matrix }
   */
  render(scene, camera){
    if(scene != null)
      this.scene   = scene;
    if(camera != null)
      this.camera  = camera;


    this.program.use();

    // Upload camera data
    this.gl.uniformMatrix4fv(this.program.uniforms["V"], false, this.camera.viewMatrix);
    this.gl.uniformMatrix4fv(this.program.uniforms["P"], false, this.camera.projectionMatrix);

    this.gl.enableVertexAttribArray(this.program.attributes["vertex_pos"]);
    this.gl.enableVertexAttribArray(this.program.attributes["vertex_normal"]);
    this.gl.vertexAttribPointer(this.program.attributes["vertex_pos"],3,this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribPointer(this.program.attributes["vertex_normal"],2,this.gl.FLOAT, false, 0, 0);

    color = [1,2,3];

    for(let object of this.scene.objects){
      this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.indicesBufferID);
      this.gl.drawElements(this.gl.TRIANGLES, object.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    this.gl.disableVertexAttribArray(this.program.attributes["vertex_pos"]);
    this.gl.disableVertexAttribArray(this.program.attributes["vertex_normal"]);
    
    this.program.release();
  }

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
 * @brief Recebe um string no formato OBJ MTL e cria uma lista de materiais
 *
 * @method     parseOBJMaterial
 * @param      {String}  data    { Código do material mtl }
 * @return     {Array}   { Lista de materiais }
 */
function parseOBJMaterial(data){
  var materials    = [];
  var cur_material = null;
  var lines        = data.split('\n');

  for(let line of lines){
    var tokens = line.split(' ');
    switch(tokens[0]){
      case "newmtl":
        cur_material = new Material();
        cur_material.name = tokens[1];
        materials.push(cur_material);
        break;
      case "Ns": 
        cur_material.shininess = parseFloat(tokens[1]);
        break;
      case "Ka": 
        cur_material.ambient   = tokens.slice(1).map(parseFloat);
        break;
      case "Kd": 
        cur_material.diffuse   = tokens.slice(1).map(parseFloat);
        break;
      case "Ks":
        cur_material.specular  = tokens.slice(1).map(parseFloat);
        break;
      case "Ke": 
        cur_material.emissive  = tokens.slice(1).map(parseFloat);
        break;
      case "Ni":
        cur_material.refraction_index = parseFloat(tokens[1]);
        break;
      case "d" : 
        cur_material.transparency = parseFloat(tokens[1]);
        break;
      case "illum": 
        cur_material.illumination_model = parseInt(tokens[1]);
        break;
    }
  }
  return materials;
}

/**
 * @brief Carrega um arquivo mtl, interpreta-o e retorna um Promise que
 *        trabalha com uma lista de materiais
 *
 * @method     readOBJMaterial
 * @param      {String}  filename  { Nome do arquivo de material }
 * @return     {Promise}  { objeto `Promise` que envia uma lista de materiais }
 */
function readOBJMaterial(filename){
  return get(filename).then(parseOBJMaterial).catch(logError);
}

/**
 * @brief Interpreta um código WaveFront OBJ.
 *
 * @method     parseOBJ
 * @param      {String}  data       { description }
 * @param      {String}  base_path  { caminho a ser concatenado ao arquivo 
 *                                    do material }
 * @return     {Promise}  { objeto `Promise` que envia uma lista (de materiais
 *                          e de objetos) }
 */
function parseOBJ(data, base_path){
  var objects    = [];
  var materials  = null;
  var cur_object = null;
  var lines      = data.split('\n');
  var materialPromise = null;

  // Processar cada linha
  for(let line of lines){
    var tokens = line.split(' ');
    
    // Carregar os materiais
    if(tokens[0] == "mtllib"){
      materialPromise = readOBJMaterial([base_path,tokens[1]].join('/'));
      break;
    }
  }

  return materialPromise.then(function(mat){
    for(let line of lines){
      var tokens = line.split(' ');
      switch(tokens[0]){
        case "o":  // Novo objeto/
          cur_object      = new Object3D();
          cur_object.name = tokens[1];
          objects.push(cur_object);
          break;
        case "v":  // Novo vértice
          cur_object.vertices.push(tokens.slice(1).map(parseFloat));
          break;
        case "vn": // Normal
          cur_object.normals.push(tokens.slice(1).map(parseFloat));
        break;
        case "vt": // Coordenada de textura
          cur_object.texcoords.push(tokens.slice(1).map(parseFloat));
        break;
        case "f":  // Face
        break;
        case "s":  // Sombra
        break;
        case "usemtl": // Material
          cur_object.material = getMaterialByName(mat, tokens[1]);
        break;
      }
    }

    for(let object of objects)
      object.pack_indices();

    return [mat,objects];
  });
}

/**
 * @brief Ler um objeto Wavefront OBJ, interpretá-lo e carregar os objetos
 *
 * @method     readOBJ
 * @param      {String}   filename  { description }
 * @return     {Promise}  { objeto Promise que entrega uma lista de objetos
 *                          e materiais }
 */
function readOBJ(filename){
  var base_path = filename.split('/').slice(0,-1).join('/');

  return get(filename).then(function(data){
    return parseOBJ(data,base_path);
  },function(error){
    console.error("Failed!", error);
  });
}

