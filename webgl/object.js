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
    this.name     = null;
    this._changed  = false;
  }
  set changed(value){
    this._changed = value;
  }
  get changed(){return this._changed;}
}

/**
 * @brief Classe para representar um objeto 3D WebGL
 */
class Mesh3D extends Object3D{
  constructor(){
    super();
    this._vertices           = [];
    this._normals            = [];
    this._texcoords          = [];
    this._indices            = [];
    this._material           = null;
  }

  // Acessores e mutatores
  set vertices (list) { this._vertices  = list; this._changed = true;}
  set normals  (list) { this._normals   = list; this._changed = true;}
  set texcoords(list) { this._texcoords = list; this._changed = true;}
  set indices  (list) { this._indices   = list; this._changed = true;}
  
  get vertices (){return this._vertices;  }
  get normals  (){return this._normals;   }
  get texcoords(){return this._texcoords; }
  get indices  (){return this._indices;   }
  
  /**
   * Converter tupla de 3 índices em índice único
   *
   * @method     pack_indices
   */
  pack_indices(){
    var indices2    = [];
    var vertices2   = [];
    var normals2    = [];
    var texcoords2  = [];
    var object      = {};
    var vertex_str;
    var index = 0;
    for(let face of this.indices){
      for(let vertex of face){
        vertex_str = vertex.join('/');
        if(object.hasOwnProperty(vertex_str)){
          indices2.push(object[vertex_str]);
        }else{
          object[vertex_str] = index;
          indices2.push(index);
          if(!isNaN(vertex[0])) vertices2.push (this.vertices[vertex[0]]);
          if(!isNaN(vertex[1])) normals2.push  (this.normals[vertex[1]]);
          if(!isNaN(vertex[2])) texcoords2.push(this.texcoords[vertex[2]]);
          index++;
        }
      }
    }
    this.vertices  = vertices2;
    this.normals   = normals2;
    this.texcoords = texcoords2;
    this.indices2  = indices2;

    this.changed   = true;
    this.dispatchEvent(new Event("changed"));
  }

}

/**
 * Coleção de objetos (que podem ser containers), criando uma árvore,
 * um grafo de cena
 *
 * @class
 */
class Container3D extends Object3D{
  constructor(){
    super();
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
    this.changed = true;
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
  var container    = new Container3D();
  var materials  = null;
  var cur_object = null;
  var lines      = data.split('\n');
  var materialPromise = null;
  var face;

  // Processar cada linha
  for(let line of lines){
    var tokens = line.split(' ');
    
    // Carregar os materiais
    if(tokens[0] == "mtllib"){
      materialPromise = getMaterialsFromMTLFile([base_path,tokens[1]].join('/'));
      break;
    }
  }

  return materialPromise.then(function(mat){
    for(let line of lines){
      var tokens = line.split(' ');
      switch(tokens[0]){
        case "o":  // Novo objeto/
          cur_object      = new Mesh3D();
          cur_object.name = tokens[1];
          container.addObject(cur_object);
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
          face = tokens.slice(1).map(item => item.split('/'))
                    .map(item => item.map(element => parseFloat(element)));
          cur_object.indices.push(face);
        break;
        case "s":  // Sombra
        break;
        case "usemtl": // Material
          cur_object.material = getMaterialByName(mat, tokens[1]);
        break;
      }
    }

    for(let object of container.objects)
      object.pack_indices();

    return [mat,container];
  });
}
