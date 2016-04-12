class Loader{
  static fromFile(filename){
    var filenameParts = filename.split(".");
    var extension = filenameParts[filenameParts.length-1];
    switch(extension){
      case "obj": Loader.fromOBJ(filename); break;
  }
  static newMeshFromOBJ(filename){
    var base_path = filename.split('/').slice(0,-1).join('/');

    return get(filename).then(function(data){
      return Loader.parseOBJ(data,base_path);
    },function(error){
      console.error("Failed!", error);
    });
  }

  static newMaterialFromOBJ(filename){
    return get(filename).then(getMaterialsFromMTLText).catch(logError);
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
  static parseOBJ(data, base_path){
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

  /**
   * @brief Carrega um arquivo mtl, interpreta-o e retorna um Promise que
   *        trabalha com uma lista de materiais
   *
   * @method     readOBJMaterial
   * @param      {String}  filename  { Nome do arquivo de material }
   * @return     {Promise}  { objeto `Promise` que envia uma lista de materiais }
   */
  static readOBJMaterial(filename){
    return get(filename).then(parseOBJMaterial).catch(logError);
  }

  /**
   * @brief Recebe um string no formato OBJ MTL e cria uma lista de materiais
   *
   * @method     parseOBJMaterial
   * @param      {String}  data    { Código do material mtl }
   * @return     {Array}   { Lista de materiais }
   */
  static parseOBJMaterial(data){
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
}

