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
 * @brief classe que renderiza a cena usando uma câmera
 */
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
    this.color = new Float32Array(4);
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
    this.color = color;
    this.gl.clearColor.apply(this.gl,color);
  }
  get background(){
    return this.color;
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