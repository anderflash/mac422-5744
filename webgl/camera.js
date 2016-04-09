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
 * @brief Classe representando uma câmera.
 * 
 * Uma câmera é responsável por manipular a matriz de visualização (viewMatrix)
 * e uma matriz de        
 */
class Camera{
  constructor(gl){
    this.gl                 = gl;
    this.right              = null;
    this.up                 = null;
    this.front              = null;
    this.origin             = null;
    this.viewMatrix         = eye();
    this.projectionMatrix   = eye();
    this.reset();
  }
  reset(){
    this.resetOrientation();
    this.resetPosition();
  }
  resetOrientation(){
    this.right              = [ 1, 0, 0];
    this.up                 = [ 0, 1, 0];
    this.front              = [ 0, 0,-1];
  }
  resetPosition(){
    this.origin             = [ 0, 0, 0];
  }
  upload(){

  }
  roll(units){

  }
  yaw(units){

  }
  pitch(units){

  }
  forward(units){

  }
  backwards(units){

  }
  lookAt(target, up){

  }
  setOrigin(position){
    this.origin = position;
  }
  perspective(fov, aspect, near, far){
    var zoom = 1;
    var new_fov  = radToDeg(2 * Math.atan(Math.tan(degToRad(fov) * 0.5)/zoom));
    var ymax     = near * Math.tan(degToRad(new_fov * 0.5));
    var ymin     = - ymax;
    var xmin     = ymin * aspect;
    var xmax     = ymax * aspect;
    this.frustrum(xmin, xmax, ymin, ymax, near, far);
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
  }
  orthographic(left, right, top, bottom, near, far){
    var te = this.projectionMatrix;
    var w = 1.0 / ( right - left );
    var h = 1.0 / ( top - bottom );
    var p = 1.0 / ( far - near );

    var x = ( right + left ) * w;
    var y = ( top + bottom ) * h;
    var z = ( far + near ) * p;

    te[ 0 ] = 2 * w;  te[ 4 ] = 0;  te[ 8 ] = 0;  te[ 12 ] = - x;
    te[ 1 ] = 0;  te[ 5 ] = 2 * h;  te[ 9 ] = 0;  te[ 13 ] = - y;
    te[ 2 ] = 0;  te[ 6 ] = 0;  te[ 10 ] = - 2 * p; te[ 14 ] = - z;
    te[ 3 ] = 0;  te[ 7 ] = 0;  te[ 11 ] = 0; te[ 15 ] = 1;

  }
  updateViewMatrix(){
    var r = this.right;
    var u = this.up;
    var f = this.forward;
    this.viewMatrix = [r[0],r[1],r[2],
                       u[0],u[1],u[2],
                       f[0],f[1],f[2]];
  }
}