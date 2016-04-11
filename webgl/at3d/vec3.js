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
 * Conjunto de 3 números representando um vetor/ponto
 *
 * @class
 */
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