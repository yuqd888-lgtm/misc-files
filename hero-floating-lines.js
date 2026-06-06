(() => {
  const canvas = document.querySelector("[data-floating-lines]");
  const hero = document.querySelector("[data-parallax-root]");
  if (!canvas || !hero) return;

  const settings = {
    lineCount: 8,
    lineDistance: 8,
    bendRadius: 8,
    bendStrength: -2,
    animationSpeed: 1,
    colors: ["#e945f5", "#6f6f6f", "#6a6a6a"]
  };

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    powerPreference: "high-performance"
  });
  if (!gl) {
    hero.classList.add("floating-lines-fallback");
    return;
  }

  const vertexSource = `
    attribute vec2 position;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 iMouse;
    uniform float bendInfluence;
    uniform vec2 parallaxOffset;
    uniform vec3 lineGradient[3];

    const int LINE_COUNT = 8;
    const float LINE_DISTANCE = 0.08;
    const float BEND_RADIUS = 8.0;
    const float BEND_STRENGTH = -2.0;
    const float ANIMATION_SPEED = 1.0;

    mat2 rotate2d(float angle) {
      return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
    }

    vec3 gradientColor(float t) {
      if (t < 0.5) {
        return mix(lineGradient[0], lineGradient[1], t * 2.0);
      }
      return mix(lineGradient[1], lineGradient[2], (t - 0.5) * 2.0);
    }

    float wave(
      vec2 uv,
      float offset,
      vec2 screenUv,
      vec2 mouseUv
    ) {
      float time = iTime * ANIMATION_SPEED;
      float amplitude = sin(offset + time * 0.2) * 0.3;
      float y = sin(uv.x + offset + time * 0.1) * amplitude;
      vec2 delta = screenUv - mouseUv;
      float influence = exp(-dot(delta, delta) * BEND_RADIUS);
      y += (mouseUv.y - screenUv.y) * influence * BEND_STRENGTH * bendInfluence;
      float lineDistance = uv.y - y;
      return 0.0175 / max(abs(lineDistance) + 0.01, 0.001) + 0.01;
    }

    void addWave(
      inout vec3 color,
      vec2 baseUv,
      vec2 mouseUv,
      vec3 wavePosition,
      float offsetStart,
      float offsetStep,
      float intensity,
      bool flipX
    ) {
      for (int i = 0; i < LINE_COUNT; i++) {
        float fi = float(i);
        float t = fi / float(LINE_COUNT - 1);
        vec2 uv = baseUv * rotate2d(
          wavePosition.z * log(length(baseUv) + 1.0)
        );
        if (flipX) uv.x *= -1.0;
        color += gradientColor(t) * wave(
          uv + vec2(LINE_DISTANCE * fi + wavePosition.x, wavePosition.y),
          offsetStart + offsetStep * fi,
          baseUv,
          mouseUv
        ) * intensity;
      }
    }

    void main() {
      vec2 baseUv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
      baseUv.y *= -1.0;
      baseUv += parallaxOffset;

      vec2 mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
      mouseUv.y *= -1.0;

      vec3 color = vec3(0.0);
      addWave(
        color,
        baseUv,
        mouseUv,
        vec3(2.0, -0.7, 0.4),
        1.5,
        0.2,
        0.2,
        false
      );
      addWave(
        color,
        baseUv,
        mouseUv,
        vec3(5.0, 0.0, 0.2),
        2.0,
        0.15,
        1.0,
        false
      );
      addWave(
        color,
        baseUv,
        mouseUv,
        vec3(10.0, 0.5, -0.4),
        1.0,
        0.2,
        0.1,
        true
      );

      color = pow(color, vec3(0.82));
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || "Unable to compile Floating Lines shader.");
    }
    return shader;
  }

  let program;
  try {
    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Unable to link Floating Lines.");
    }
  } catch (error) {
    hero.classList.add("floating-lines-fallback");
    console.warn("Floating Lines disabled:", error);
    return;
  }

  const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.useProgram(program);

  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    time: gl.getUniformLocation(program, "iTime"),
    resolution: gl.getUniformLocation(program, "iResolution"),
    mouse: gl.getUniformLocation(program, "iMouse"),
    bendInfluence: gl.getUniformLocation(program, "bendInfluence"),
    parallaxOffset: gl.getUniformLocation(program, "parallaxOffset"),
    gradient: gl.getUniformLocation(program, "lineGradient")
  };

  function colorToRgb(hex) {
    const value = Number.parseInt(hex.slice(1), 16);
    return [
      ((value >> 16) & 255) / 255,
      ((value >> 8) & 255) / 255,
      (value & 255) / 255
    ];
  }

  const gradient = new Float32Array(settings.colors.flatMap(colorToRgb));
  gl.uniform3fv(uniforms.gradient, gradient);

  const isEdge = /\bEdg\//.test(navigator.userAgent);
  const isMobile = window.matchMedia("(max-width: 680px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const maxFps = reducedMotion ? 1 : (isEdge || isMobile ? 30 : 60);
  const frameGap = 1000 / maxFps;
  const mouseTarget = { x: -1000, y: -1000 };
  const mouseCurrent = { x: -1000, y: -1000 };
  const parallaxTarget = { x: 0, y: 0 };
  const parallaxCurrent = { x: 0, y: 0 };
  const start = performance.now();
  let pointerTarget = 0;
  let pointerInfluence = 0;
  let visible = true;
  let frame = 0;
  let lastFrame = 0;

  function resize() {
    const bounds = hero.getBoundingClientRect();
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      isEdge || isMobile ? 1 : 1.45
    );
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function handlePointerMove(event) {
    const bounds = hero.getBoundingClientRect();
    const ratioX = canvas.width / Math.max(1, bounds.width);
    const ratioY = canvas.height / Math.max(1, bounds.height);
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    mouseTarget.x = localX * ratioX;
    mouseTarget.y = (bounds.height - localY) * ratioY;
    pointerTarget = 1;
    parallaxTarget.x = ((localX / bounds.width) - 0.5) * 0.18;
    parallaxTarget.y = (0.5 - (localY / bounds.height)) * 0.18;
  }

  function handlePointerLeave() {
    pointerTarget = 0;
    parallaxTarget.x = 0;
    parallaxTarget.y = 0;
  }

  function render(timestamp) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (timestamp - lastFrame < frameGap) {
      frame = requestAnimationFrame(render);
      return;
    }
    lastFrame = timestamp;

    const damping = reducedMotion ? 1 : 0.055;
    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * damping;
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * damping;
    pointerInfluence += (pointerTarget - pointerInfluence) * damping;
    parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * damping;
    parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * damping;

    gl.uniform1f(
      uniforms.time,
      reducedMotion ? 0.8 : ((timestamp - start) / 1000) * settings.animationSpeed
    );
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.mouse, mouseCurrent.x, mouseCurrent.y);
    gl.uniform1f(uniforms.bendInfluence, pointerInfluence);
    gl.uniform2f(
      uniforms.parallaxOffset,
      parallaxCurrent.x,
      parallaxCurrent.y
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (!reducedMotion) frame = requestAnimationFrame(render);
  }

  function schedule() {
    if (!frame && visible && !document.hidden) {
      frame = requestAnimationFrame(render);
    }
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { threshold: 0.02 }
  );

  const resizeObserver = new ResizeObserver(() => {
    resize();
    schedule();
  });

  hero.addEventListener("pointermove", handlePointerMove, { passive: true });
  hero.addEventListener("pointerleave", handlePointerLeave);
  document.addEventListener("visibilitychange", schedule);
  observer.observe(hero);
  resizeObserver.observe(hero);
  resize();
  schedule();
  hero.classList.add("floating-lines-ready");
})();
