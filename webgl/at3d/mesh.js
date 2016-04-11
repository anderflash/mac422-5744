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
 * @brief Representando um objeto, seus vértices e faces.
 *
 * @class
 */
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