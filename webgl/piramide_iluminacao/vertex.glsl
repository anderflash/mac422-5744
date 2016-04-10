precision mediump float;
  
attribute vec3 vertex_pos;
attribute vec3 vertex_normal;

//varying vec3 color;

uniform mat4 P;
uniform mat4 V;
uniform mat4 M;
uniform mat4 N;

uniform vec3 light_pos;

uniform vec3 camera_pos;

varying vec3 vertex_pos_transformed;
varying vec3 normal;
varying vec3 light_pos_t;

void main(){
  vec4 vertex = V * M * vec4(vertex_pos, 1.0);
  gl_Position            = P * vertex;
  normal                 = (N * vec4(vertex_normal,0.0)).xyz;
  light_pos_t            = (V * M * vec4(light_pos,  1.0)).xyz;
  vertex_pos_transformed = vertex.xyz;
}