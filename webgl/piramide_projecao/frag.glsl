precision mediump float;

uniform vec3 color;

varying vec3 normal;

void main(){
  gl_FragColor = vec4(color, 1.0);
}