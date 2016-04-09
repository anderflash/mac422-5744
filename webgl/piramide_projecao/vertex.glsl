precision mediump float;
    
attribute vec3 vertex_pos;
attribute vec3 vertex_normal;

uniform mat4 P;
uniform mat4 V;
uniform mat4 M;

varying vec3 normal;

void main(){
  gl_Position = P * V * M * vec4(vertex_pos, 1.0);
  normal   = vertex_normal;
}