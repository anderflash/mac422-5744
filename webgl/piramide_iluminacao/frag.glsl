precision mediump float;

uniform vec3 light_pos;
uniform vec3 camera_pos;
varying vec3 normal;
varying vec3 vertex_pos_transformed;
varying vec3 light_pos_t;
//varying vec3 color;
void main(){
  vec3 normal_normed    = normalize(normal);
  vec3 light_pos_normed = normalize(vertex_pos_transformed-light_pos_t);

  float cosTheta = dot(normal_normed, light_pos_normed);

  cosTheta = max(min(cosTheta, 1.0),0.0);

  gl_FragColor = vec4(vec3(1.0,0.0,0.0)*cosTheta, 1.0);
}