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

class Object3D{
  constructor(){
    this.name = null;
  }
}

/**
 * @brief Classe para representar um objeto 3D WebGL
 */
class Mesh3D extends Object3D{
  constructor(){
    this.vertices           = [];
    this.normals            = [];
    this.texcoords          = [];
    this.indices            = [];
    this.material           = null;
  }
  pack_indices(){
    
  }
}

class Container3D extends Object3D{
  constructor(){
    this.objects = [];
  }
  addObject(object){
    this.objects.push(object);
  }
  getObjectByName(name){
    for(let object of this.objects){
      if (object.name === name) return object;
      if (object instanceof Container3D){
        let object_found = object.getObjectByName(name);
        if(object_found) return object_found;
      }
    }
    return null;
  }
  indexOf(object){
    return this.objects.indexOf(object);
  }
  removeObject(object){
    this.objects.removeChild(object);
  }
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
