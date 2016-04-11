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
 * @brief conjunto de 16 números representando uma matrix 4x4
 *
 * @class
 */
 class Matrix4 extends Float32Array{
  constructor(){
    super(16);
    this.eye();
    this.changed = true;
  }
  eye(){
    this[0 ] = 1;this[1 ] = 0;this[2 ] = 0;this[3 ] = 0;
    this[4 ] = 0;this[5 ] = 1;this[6 ] = 0;this[7 ] = 0;
    this[8 ] = 0;this[9 ] = 0;this[10] = 1;this[11] = 0;
    this[12] = 0;this[13] = 0;this[14] = 0;this[15] = 1;
    this.changed = true;
  }
  translate(vector){
    this[12] += vector[0];
    this[13] += vector[1];
    this[14] += vector[2];
    this.changed = true;
  }
  rotate(angle, ax){
    var c = Math.cos(degToRad(angle));
    var cm = 1-c;
    var s = Math.sin(degToRad(angle));

    var r = new Matrix4();

    r[0 ] = c + ax[0]*ax[0]*cm;
    r[1 ] = ax[1]*ax[0]*cm + ax[2]*s;
    r[2 ] = ax[2]*ax[0]*cm - ax[1]*s;
    
    r[4 ] = ax[0]*ax[1]*cm - ax[2]*s;
    r[5 ] = c + ax[1]*ax[1]*cm;
    r[6 ] = ax[0]*ax[1]*cm + ax[2]*s;
    
    r[8 ] = ax[0]*ax[2]*cm + ax[1]*s;
    r[9 ] = ax[1]*ax[2]*cm - ax[0]*s;
    r[10] = c + ax[2]*ax[2]*cm;

    this.premultiply(r);
    this.changed = true;
  }
  scale(vector){
    this[0 ] *= vector[0];
    this[5 ] *= vector[1];
    this[10] *= vector[2];
    this.changed = true;
  }
  multiply(matrix){
    this[0] = this[0 ] * matrix[0 ] + this[4 ] * matrix[1 ] + 
              this[8 ] * matrix[2 ] + this[12] * matrix[3 ];
    this[1] = this[1 ] * matrix[0 ] + this[5 ] * matrix[1 ] + 
              this[9 ] * matrix[2 ] + this[13] * matrix[3 ];
    this[2] = this[2 ] * matrix[0 ] + this[6 ] * matrix[1 ] + 
              this[10] * matrix[2 ] + this[14] * matrix[3 ];
    this[3] = this[3 ] * matrix[0 ] + this[7 ] * matrix[1 ] + 
              this[11] * matrix[2 ] + this[15] * matrix[3 ];
    this[4] = this[0 ] * matrix[4 ] + this[4 ] * matrix[5 ] + 
              this[8 ] * matrix[6 ] + this[12] * matrix[7 ];
    this[5] = this[1 ] * matrix[4 ] + this[5 ] * matrix[5 ] + 
              this[9 ] * matrix[6 ] + this[13] * matrix[7 ];
    this[6] = this[2 ] * matrix[4 ] + this[6 ] * matrix[5 ] + 
              this[10] * matrix[6 ] + this[14] * matrix[7 ];
    this[7] = this[3 ] * matrix[4 ] + this[7 ] * matrix[5 ] + 
              this[11] * matrix[6 ] + this[15] * matrix[7 ];
    this[8] = this[0 ] * matrix[8 ] + this[4 ] * matrix[9 ] + 
              this[8 ] * matrix[10] + this[12] * matrix[11];
    this[9] = this[1 ] * matrix[8 ] + this[5 ] * matrix[9 ] + 
              this[9 ] * matrix[10] + this[13] * matrix[11];
    this[10]= this[2 ] * matrix[8 ] + this[6 ] * matrix[9 ] + 
              this[10] * matrix[10] + this[14] * matrix[11];
    this[11]= this[3 ] * matrix[8 ] + this[7 ] * matrix[9 ] + 
              this[11] * matrix[10] + this[15] * matrix[11];
    this[12]= this[0 ] * matrix[12] + this[4 ] * matrix[13] + 
              this[8 ] * matrix[14] + this[12] * matrix[15];
    this[13]= this[1 ] * matrix[12] + this[5 ] * matrix[13] + 
              this[9 ] * matrix[14] + this[13] * matrix[15];
    this[14]= this[2 ] * matrix[12] + this[6 ] * matrix[13] + 
              this[10] * matrix[14] + this[14] * matrix[15];
    this[15]= this[3 ] * matrix[12] + this[7 ] * matrix[13] + 
              this[11] * matrix[14] + this[15] * matrix[15];
    this.changed = true;
  }
  premultiply(matrix){
    this[0] = matrix[0 ] * this[0 ] + matrix[4 ] * this[1 ] + 
              matrix[8 ] * this[2 ] + matrix[12] * this[3 ]; 
    this[1] = matrix[1 ] * this[0 ] + matrix[5 ] * this[1 ] + 
              matrix[9 ] * this[2 ] + matrix[13] * this[3 ]; 
    this[2] = matrix[2 ] * this[0 ] + matrix[6 ] * this[1 ] + 
              matrix[10] * this[2 ] + matrix[14] * this[3 ]; 
    this[3] = matrix[3 ] * this[0 ] + matrix[7 ] * this[1 ] + 
              matrix[11] * this[2 ] + matrix[15] * this[3 ]; 
    this[4] = matrix[0 ] * this[4 ] + matrix[4 ] * this[5] + 
              matrix[8 ] * this[6 ] + matrix[12] * this[7]; 
    this[5] = matrix[1 ] * this[4 ] + matrix[5 ] * this[5] + 
              matrix[9 ] * this[6 ] + matrix[13] * this[7]; 
    this[6] = matrix[2 ] * this[4 ] + matrix[6 ] * this[5] + 
              matrix[10] * this[6 ] + matrix[14] * this[7]; 
    this[7] = matrix[3 ] * this[4 ] + matrix[7 ] * this[5] + 
              matrix[11] * this[6 ] + matrix[15] * this[7]; 
    this[8] = matrix[0 ] * this[8 ] + matrix[4 ] * this[9 ] + 
              matrix[8 ] * this[10] + matrix[12] * this[11]; 
    this[9] = matrix[1 ] * this[8 ] + matrix[5 ] * this[9 ] + 
              matrix[9 ] * this[10] + matrix[13] * this[11]; 
    this[10]= matrix[2 ] * this[8 ] + matrix[6 ] * this[9 ] + 
              matrix[10] * this[10] + matrix[14] * this[11]; 
    this[11]= matrix[3 ] * this[8 ] + matrix[7 ] * this[9 ] + 
              matrix[11] * this[10] + matrix[15] * this[11];
    this[12]= matrix[0 ] * this[12] + matrix[4 ] * this[13] + 
              matrix[8 ] * this[14] + matrix[12] * this[15]; 
    this[13]= matrix[1 ] * this[12] + matrix[5 ] * this[13] + 
              matrix[9 ] * this[14] + matrix[13] * this[15]; 
    this[14]= matrix[2 ] * this[12] + matrix[6 ] * this[13] + 
              matrix[10] * this[14] + matrix[14] * this[15]; 
    this[15]= matrix[3 ] * this[12] + matrix[7 ] * this[13] + 
              matrix[11] * this[14] + matrix[15] * this[15]; 
    this.changed = true;
  }
  inverse(){
    var inv = new Matrix4();
    var det;
    var i;
    var m = this;

    inv[0]  =  m[5]  * m[10] * m[15] - m[5]  * m[11] * m[14] - 
               m[9]  * m[6]  * m[15] + m[9]  * m[7]  * m[14] +
               m[13] * m[6]  * m[11] - m[13] * m[7]  * m[10];

    inv[4]  = -m[4]  * m[10] * m[15] + m[4]  * m[11] * m[14] + 
               m[8]  * m[6]  * m[15] - m[8]  * m[7]  * m[14] - 
               m[12] * m[6]  * m[11] + m[12] * m[7]  * m[10];

    inv[8]  =  m[4]  * m[9]  * m[15] - m[4]  * m[11] * m[13] - 
               m[8]  * m[5]  * m[15] + m[8]  * m[7]  * m[13] + 
               m[12] * m[5]  * m[11] - m[12] * m[7]  * m[9];

    inv[12] = -m[4]  * m[9] * m[14]  + m[4]  * m[10] * m[13] +
               m[8]  * m[5] * m[14]  - m[8]  * m[6] * m[13]  - 
               m[12] * m[5] * m[10]  + m[12] * m[6] * m[9];

    inv[1]  = -m[1]  * m[10] * m[15] + m[1]  * m[11] * m[14] + 
               m[9]  * m[2] * m[15]  - m[9]  * m[3] * m[14]  - 
               m[13] * m[2] * m[11]  + m[13] * m[3] * m[10];

    inv[5]  =  m[0]  * m[10] * m[15] - m[0]  * m[11] * m[14] - 
               m[8]  * m[2] * m[15]  + m[8]  * m[3] * m[14]  + 
               m[12] * m[2] * m[11]  - m[12] * m[3] * m[10];

    inv[9]  = -m[0]  * m[9] * m[15]  + m[0]  * m[11] * m[13] + 
               m[8]  * m[1] * m[15]  - m[8]  * m[3] * m[13]  - 
               m[12] * m[1] * m[11]  + m[12] * m[3] * m[9];

    inv[13] =  m[0]  * m[9] * m[14]  - m[0]  * m[10] * m[13] - 
               m[8]  * m[1] * m[14]  + m[8]  * m[2] * m[13]  + 
               m[12] * m[1] * m[10]  - m[12] * m[2] * m[9];

    inv[2]  =  m[1]  * m[6] * m[15]  - m[1]  * m[7] * m[14] - 
               m[5]  * m[2] * m[15]  + m[5]  * m[3] * m[14] + 
               m[13] * m[2] * m[7]   - m[13] * m[3] * m[6];

    inv[6]  = -m[0]  * m[6] * m[15]  + m[0]  * m[7] * m[14] + 
               m[4]  * m[2] * m[15]  - m[4]  * m[3] * m[14] - 
               m[12] * m[2] * m[7]   + m[12] * m[3] * m[6];

    inv[10] =  m[0]  * m[5] * m[15]  - m[0]  * m[7] * m[13] - 
               m[4]  * m[1] * m[15]  + m[4]  * m[3] * m[13] + 
               m[12] * m[1] * m[7]   - m[12] * m[3] * m[5];

    inv[14] = -m[0]  * m[5] * m[14]  + m[0]  * m[6] * m[13] + 
               m[4]  * m[1] * m[14]  - m[4]  * m[2] * m[13] - 
               m[12] * m[1] * m[6]   + m[12] * m[2] * m[5];

    inv[3]  = -m[1] * m[6] * m[11]   + m[1] * m[7] * m[10] + 
               m[5] * m[2] * m[11]   - m[5] * m[3] * m[10] - 
               m[9] * m[2] * m[7]    + m[9] * m[3] * m[6];

    inv[7]  =  m[0] * m[6] * m[11]   - m[0] * m[7] * m[10] - 
               m[4] * m[2] * m[11]   + m[4] * m[3] * m[10] + 
               m[8] * m[2] * m[7]    - m[8] * m[3] * m[6];

    inv[11] = -m[0] * m[5] * m[11]   + m[0] * m[7] * m[9]  + 
               m[4] * m[1] * m[11]   - m[4] * m[3] * m[9]  - 
               m[8] * m[1] * m[7]    + m[8] * m[3] * m[5];

    inv[15] =  m[0] * m[5] * m[10]   - m[0] * m[6] * m[9]  - 
               m[4] * m[1] * m[10]   + m[4] * m[2] * m[9]  + 
               m[8] * m[1] * m[6]    - m[8] * m[2] * m[5];

    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

    if (det === 0)
        return false;

    det = 1.0 / det;

    for (i = 0; i < 16; i++)
      this[i] = inv[i] * det;

    return true;
  }
  transpose(){
    var t;
    t = this[1 ]; this[1 ] = this[4 ]; this[4 ] = t;
    t = this[2 ]; this[2 ] = this[8 ]; this[8 ] = t;
    t = this[3 ]; this[3 ] = this[12]; this[12] = t;
    t = this[6 ]; this[6 ] = this[9 ]; this[9 ] = t;
    t = this[7 ]; this[7 ] = this[13]; this[13] = t;
    t = this[11]; this[11] = this[14]; this[14] = t;
  }

}