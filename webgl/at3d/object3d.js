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
 * @brief classe abstrata para o container e o mesh
 * 
 * @class
 */
class Object3D{
  constructor(){
    this.name = null;
    this.modelMatrix = new Matrix4();
    this.normalMatrix = new Matrix4();
  }
  resetMatrix(){
    this.modelMatrix.eye();
  }
  translate(vector){
    this.modelMatrix.translate(vector);
  }
  rotate(angle, axis){
    this.modelMatrix.rotate(angle,axis);
  }
  scale(vector){
    this.modelMatrix.scale(vector);
  }
  calculateNormalMatrix(viewMatrix){
    this.normalMatrix.set(viewMatrix);
    this.normalMatrix.premultiply(this.modelMatrix);
    this.normalMatrix.inverse();
    this.normalMatrix.transpose();
  }
}