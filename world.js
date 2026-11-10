(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'world-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) { document.body.classList.add('world-fallback'); return; }

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main(){ v_uv=a_position*.5+.5; gl_Position=vec4(a_position,0.,1.); }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform float u_time;
    uniform float u_scroll;
    uniform float u_dark;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    void main(){
      vec2 px=v_uv*u_resolution;
      vec2 uv=(px-.5*u_resolution)/min(u_resolution.x,u_resolution.y);
      float progress=smoothstep(0.,1.,u_scroll);
      float time=u_time;
      vec2 center=vec2(.32+progress*.24+sin(progress*3.14159)*.06,.015+sin(progress*6.283+time*.16)*.045);
      vec2 q=uv-center-(u_pointer-.5)*.035;
      float dist=length(q);
      float angle=atan(q.y,q.x);
      float breathing=sin(time*.42+progress*4.)*.025;
      float warp=.075*sin(angle*2.2-time*.38+progress*4.)+.045*cos(angle*3.7+time*.27)+.022*sin(angle*6.-time*.2);
      float radius=.28+progress*1.25+breathing;
      float edgeRadius=radius+warp;
      float signedEdge=dist-edgeRadius;
      float body=1.-smoothstep(-.025,.045,signedEdge);
      float rim=exp(-(signedEdge/.052)*(signedEdge/.052));
      float halo=exp(-abs(signedEdge)*8.);
      float innerDistance=(signedEdge+.11)/.07;
      float innerRim=exp(-innerDistance*innerDistance);
      float light=clamp(.5+.5*dot(normalize(vec2(-.55,.82)),normalize(q+vec2(.001))),0.,1.);
      float flow=.5+.5*sin(angle*3.-time*.38+progress*5.);
      vec3 deep=mix(vec3(.47,.52,.78),vec3(.004,.025,.18),u_dark);
      vec3 cobalt=mix(vec3(.49,.56,.84),vec3(.008,.12,.62),u_dark);
      vec3 azure=mix(vec3(.57,.74,.98),vec3(.015,.38,.98),u_dark);
      vec3 cyan=mix(vec3(.45,.78,.96),vec3(.12,.78,1.),u_dark);
      vec3 color=deep*(body*.7)+mix(cobalt,azure,flow*.56+.18)*(body*.7+light*.2*body);
      color+=azure*rim*(.72+light*.45)+cyan*innerRim*.48;
      color+=vec3(.018,.11,.52)*halo*(.08+.12*progress);
      float streaks=0.;
      for(int i=0;i<3;i++){
        float fi=float(i)-1.;
        float x=center.x+fi*.22+sin(time*.28+fi)*.025;
        float line=exp(-abs(uv.x-x)*mix(190.,260.,hash(vec2(fi,2.))));
        float above=smoothstep(center.y+edgeRadius*.72,center.y+edgeRadius*.72+.42,uv.y);
        float below=smoothstep(center.y-edgeRadius*.72-.4,center.y-edgeRadius*.72,uv.y);
        streaks+=line*(above+below)*(.018+.04*hash(vec2(fi,5.)));
      }
      color+=mix(vec3(.5,.66,.95),vec3(.02,.2,.95),u_dark)*streaks;
      float particle=step(.996,hash(floor(px/vec2(47.,43.))))*(.35+.65*sin(time+hash(px)*6.28));
      color+=mix(vec3(.52,.68,.98),vec3(.16,.47,1.),u_dark)*particle*(1.-body*.8);
      float alpha=body*(.35+.22*light)+rim*.78+innerRim*.27+halo*(.06+.08*progress)+streaks+particle*.5;
      gl_FragColor=vec4(color,clamp(alpha,0.,.98));
    }
  `;
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error('World shader error:', gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null; }
    return shader;
  }
  const vertex=compile(gl.VERTEX_SHADER,vertexSource),fragment=compile(gl.FRAGMENT_SHADER,fragmentSource);
  if(!vertex||!fragment){document.body.classList.add('world-fallback');canvas.remove();return;}
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.error('World program error:',gl.getProgramInfoLog(program));document.body.classList.add('world-fallback');canvas.remove();return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms={resolution:gl.getUniformLocation(program,'u_resolution'),pointer:gl.getUniformLocation(program,'u_pointer'),time:gl.getUniformLocation(program,'u_time'),scroll:gl.getUniformLocation(program,'u_scroll'),dark:gl.getUniformLocation(program,'u_dark')};
  let baseScroll=0;try{baseScroll=Number(sessionStorage.getItem('harrison-portal-progress'))||0;}catch{}
  let pointer=[.5,.5],scroll=baseScroll,targetScroll=baseScroll,dark=document.documentElement.dataset.theme==='dark'?1:0,visible=true,last=0,frame=0,dpr=1;
  const resize=()=>{dpr=Math.min(devicePixelRatio||1,innerWidth<680?.8:.68,1180/innerWidth);canvas.width=Math.max(1,Math.floor(innerWidth*dpr));canvas.height=Math.max(1,Math.floor(innerHeight*dpr));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);};
  const updateScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;const pageProgress=max>0?scrollY/max:0;targetScroll=Math.min(1,baseScroll+pageProgress*.42);};
  addEventListener('resize',resize,{passive:true});addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('beforeunload',()=>{try{sessionStorage.setItem('harrison-portal-progress',String(scroll));}catch{}});
  addEventListener('pointermove',event=>{pointer=[event.clientX/innerWidth,1-event.clientY/innerHeight];},{passive:true});
  addEventListener('portfolio-theme-change',event=>{dark=event.detail.theme==='dark'?1:0;});
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible&&!reduceMotion)frame=requestAnimationFrame(render);else if(!visible&&frame)cancelAnimationFrame(frame);});
  function render(now){if(!visible)return;if(!reduceMotion&&now-last<28){frame=requestAnimationFrame(render);return;}last=now;scroll+=reduceMotion?0:(targetScroll-scroll)*.12;gl.uniform1f(uniforms.time,reduceMotion?0:now*.001);gl.uniform2f(uniforms.pointer,pointer[0],pointer[1]);gl.uniform1f(uniforms.scroll,scroll);gl.uniform1f(uniforms.dark,dark);gl.drawArrays(gl.TRIANGLES,0,6);if(!reduceMotion)frame=requestAnimationFrame(render);}
  resize();updateScroll();render(0);
})();
