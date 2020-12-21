export const vert = `
precision highp float;

varying vec2 v_uv;
varying vec3 v_position;

void main() {

    v_position = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const frag = `

precision highp float;

uniform vec2 u_resolution;
uniform float u_ratio;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_matcap;

varying vec3 v_position;

vec2 getmatcap(vec3 eye, vec3 normal) {
  vec3 reflected = reflect(eye, normal);
  float m = 2.8284271247461903 * sqrt( reflected.z+1.0 );
  return reflected.xy / m + 0.5;
}

float sdSphere( vec3 p, float s ) {
  return length(p)-s;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  
  return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
              oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
              oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
              0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float sdf( vec3 p ) {
  vec3 p1 = rotate(p, vec3(1.), u_time);
  float box = smin(sdBox(p1, vec3(.3)), sdSphere(p1, 0.4), .3);
  float sphere = sdSphere(p - vec3(u_mouse * vec2(2., 1.), 0.), 0.2);
  return smin(box, sphere, 0.5);
}

vec3 calcNormal( vec3 p ) // for function f(p)
{
    const float h = 0.0001; // replace by an appropriate value
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*sdf( p + k.xyy*h ) + 
                      k.yyx*sdf( p + k.yyx*h ) + 
                      k.yxy*sdf( p + k.yxy*h ) + 
                      k.xxx*sdf( p + k.xxx*h ) );
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;

  vec2 newUV = uv - vec2(.5, 0.);

  float dist = length(newUV - vec2(.5));
  vec3 bg = mix(vec3(0.2), vec3(0.), dist);

  vec3 ray = normalize(vec3( (uv - vec2(1., .5)), -1.));
  vec3 camPos = vec3(0., 0., 2.);

  vec3 rayPos = camPos;
  float t = 0.;

  float tMax = 5.;

  for (int i=0;i<256;i++) {
    vec3 pos = camPos + t*ray;
    float h = sdf(pos);
    if (h<.0001 || t>tMax) break;
    t+=h;
  }

  vec3 color = bg;

  if (t<tMax) {
    vec3 pos = camPos + t*ray;
    vec3 normal = calcNormal(pos);
    color = normal;
    float diff = dot(vec3(1.), normal);
    vec2 matcapUV = getmatcap(ray, normal);
    color = vec3(diff);
    color = texture2D(u_matcap, matcapUV).rgb;
    float fresnel = pow(1. + dot(ray, normal), 1.);

    // color = vec3(fresnel);
    color = mix(color, bg, fresnel);
  }

  gl_FragColor = vec4(color, 1.);   
}
`;
