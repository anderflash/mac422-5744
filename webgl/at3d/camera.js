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
 * @brief Classe abstrata representando uma câmera.
 * 
 * Uma câmera é responsável por manipular a matriz de visualização (viewMatrix)
 * e uma matriz de projeção (que será preenchica pelas suas respectivas 
 * subclasses) 
 */
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