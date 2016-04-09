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
 * @brief Classe para representar um material
 */
class Material{
  constructor(){
    this.name               = null;
    this.shininess          = 0;
    this.refraction_index   = 0;
    this.transparency       = 0;
    this.illumination_model = 0;
  }
  copy(material){
    this.name               = material.name;
    this.shininess          = material.shininess;
    this.refraction_index   = material.refraction_index;
    this.transparency       = material.transparency;
    this.illumination_model = material.illumination_model;
  }
}
/**
 * @brief Material para sólidos de apenas uma cor
 *
 * @class
 */
class ColorMaterial extends Material{
  constructor(){
    super();
    this.ambient            = null;
    this.diffuse            = null;
    this.specular           = null;
    this.emissive           = null;    
  }
  copy(material){
    super.copy(material);
    if(material instanceof ColorMaterial){
      this.ambient  = material.ambient;
      this.diffuse  = material.diffuse;
      this.specular = material.specular;
      this.emissive = material.emissive;
    }
  }
}

/**
 * @brief Material para sólidos texturizados
 *
 * @class
 */
class ImageMaterial extends Material{
  constructor(){
    super();
    this.ambient_map        = null;
    this.diffuse_map        = null;
    this.normal_map         = null;
    this.specular_map       = null;
    this.specular_power_map = null;
    this.alpha_map          = null;
    this.bump_map           = null;
    this.disp_map           = null;
    this.stencil_map        = null;
    this.reflection_map     = null;
  }
  copy(material){
    super.copy(material);
  }
}

/**
 * @brief Material para sólidos exibirem vídeos
 *
 * @class
 */
class VideoMaterial extends Material{
  constructor(){
    this.videofilename      = null;
  }
}

/**
 * @brief criar uma lista de materiais a partir de um código OBJ MTL
 *
 * @method     getMaterialsFromMTL
 * @param      {String}  data { código em texto do arquivo mtl }
 * @return     {Array}   { lista de materiais }
 */
function getMaterialsFromMTLText(data){
  var materials    = [];
  var cur_material = null;
  var lines        = data.split('\n');

  function materialFromColorToTexture(){
    if(cur_material instanceof ColorMaterial){
      var old_material = materials.pop();
      cur_material = new ImageMaterial();
      cur_material.copy(old_material);
      materials.push(cur_material);
      delete old_material;
    }
  }

  for(let line of lines){
    var tokens = line.trim().split(' ');
    switch(tokens[0]){
      case "newmtl":
        cur_material = new ColorMaterial();
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

      // Estes são para Material de textura.
      // Neste caso, o material precisa ser convertido para 
      // ImageMaterial
      case "map_Ka":
        materialFromColorToTexture();
        cur_material.ambient_map = tokens[1];
        break;
      case "map_Ks":
        materialFromColorToTexture();
        cur_material.specular_map = tokens[1];
        break;
      case "map_Kd":
        materialFromColorToTexture();
        cur_material.diffuse_map = tokens[1];
        break;
      case "map_bump":
        materialFromColorToTexture();
        cur_material.bump_map = tokens[1];
        break;
      case "map_Ns":
        materialFromColorToTexture();
        cur_material.specular_power_map = tokens[1];
        break;
    }
  }
  return materials;
}

/**
 * Get the materials from mtl file.
 *
 * @method     getMaterialsFromMTLFile
 * @param      {<type>}  filename  { description }
 * @return     {<type>}  { description_of_the_return_value }
 */
function getMaterialsFromMTLFile(filename){
  return get(filename).then(getMaterialsFromMTLText).catch(logError);
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
