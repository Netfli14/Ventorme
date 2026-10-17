"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type * as Three from "three";
import { useReducedMotion } from "../useMotionPreference";
import styles from "./animated-shader-background.module.css";

export type AnimatedShaderBackgroundProps = {
  className?: string;
  intensity?: number;
  speed?: number;
  paused?: boolean;
  onAvailabilityChange?: (available: boolean) => void;
};

const vertexShader = `
  void main() { gl_Position = vec4(position, 1.0); }
`;

// The supplied aurora: three noise octaves, moving ray tails and colour waves.
// Alpha removes its black backdrop; guarded math avoids NaNs on some GPUs.
const fragmentShader = `
  uniform float iTime;
  uniform vec2 iResolution;
  #define NUM_OCTAVES 3
  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
      mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
  }
  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.3;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.4;
    }
    return v;
  }
  void main() {
    vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
    vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5)
      / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
    vec4 o = vec4(0.0);
    float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;
    for (int ray = 0; ray < NUM_RAYS; ray++) {
      float i = float(ray);
      vec2 v = p + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0))
        * 3.5 + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);
      float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - i / float(NUM_RAYS));
      vec4 auroraColors = vec4(0.1 + 0.3 * sin(i * 0.2 + iTime * 0.4),
        0.3 + 0.5 * cos(i * 0.3 + iTime * 0.5),
        0.7 + 0.3 * sin(i * 0.4 + iTime * 0.3), 1.0);
      float distanceToRay = max(0.001, length(max(v, vec2(v.x * f * 0.015, v.y * 1.5))));
      vec4 contribution = auroraColors * exp(sin(i * i + iTime * 0.8)) / distanceToRay;
      float thinness = smoothstep(0.0, 1.0, i / float(NUM_RAYS)) * 0.6;
      o += contribution * (1.0 + tailNoise * 0.8) * thinness;
    }
    vec3 positive = pow(max(o.rgb / 100.0, vec3(0.0)), vec3(1.6));
    vec3 e = exp(-2.0 * positive);
    vec3 glow = clamp((1.0 - e) / (1.0 + e) * 1.5, 0.0, 1.0);
    float alpha = max(max(glow.r, glow.g), glow.b) * 0.85;
    gl_FragColor = vec4(mix(glow, vec3(0.23, 0.28, 1.0), 0.25), alpha);
  }
`;

export function AnimatedShaderBackground({
  className = "", intensity = 0.2, speed = 0.22, paused = false,
  onAvailabilityChange,
}: AnimatedShaderBackgroundProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => {});
  const reduce = useReducedMotion();

  useEffect(() => { pausedRef.current = paused; syncRef.current(); }, [paused]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (reduce) {
      viewport.dataset.shaderState = "reduced";
      onAvailabilityChange?.(false);
      return;
    }
    let disposed = false, visible = false, failed = false;
    let renderer: Three.WebGLRenderer | undefined;
    let material: Three.ShaderMaterial | undefined;
    let geometry: Three.PlaneGeometry | undefined;
    let scene: Three.Scene | undefined;
    let camera: Three.OrthographicCamera | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let initializing: Promise<void> | undefined;
    let frame = 0, elapsed = 0, previousTick = 0, previousRender = 0;
    const motionSpeed = Number.isFinite(speed) ? Math.max(0, Math.min(2, speed)) : 0.22;
    viewport.dataset.shaderState = "idle";

    const stop = () => { cancelAnimationFrame(frame); frame = 0; previousTick = 0; };
    const fallback = () => {
      failed = true; stop();
      viewport.dataset.shaderState = "fallback";
      if (canvas) canvas.hidden = true;
      onAvailabilityChange?.(false);
    };
    const contextLost = (event: Event) => { event.preventDefault(); fallback(); };
    const resize = () => {
      if (!renderer || !material || !scene || !camera || failed) return;
      const { width, height } = viewport.getBoundingClientRect();
      const mobile = matchMedia("(max-width: 850px)").matches;
      const scale = Math.min(1, (mobile ? 640 : 1200) / Math.max(width, height),
        Math.sqrt((mobile ? 180000 : 500000) / Math.max(1, width * height)));
      const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
      renderer.setSize(w, h, false);
      material.uniforms.iResolution.value.set(w, h);
      renderer.render(scene, camera);
    };
    const animate = (time: number) => {
      frame = 0;
      if (disposed || failed || !visible || document.hidden || pausedRef.current) return;
      const delta = previousTick ? Math.min((time - previousTick) / 1000, 0.1) : 0;
      previousTick = time; elapsed += delta;
      const interval = matchMedia("(max-width: 850px)").matches ? 1000 / 18 : 1000 / 24;
      if (renderer && scene && camera && material && time - previousRender >= interval) {
        material.uniforms.iTime.value = elapsed * motionSpeed;
        renderer.render(scene, camera); previousRender = time;
      }
      frame = requestAnimationFrame(animate);
    };
    const initialize = async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;
        canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2", {
          alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "low-power",
        });
        if (!context) { fallback(); return; }
        renderer = new THREE.WebGLRenderer({canvas, context, alpha: true,
          antialias: false, premultipliedAlpha: false, powerPreference: "low-power"});
        renderer.setPixelRatio(1);
        renderer.setClearColor(0x000000, 0);
        renderer.debug.onShaderError = fallback;
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        material = new THREE.ShaderMaterial({
          uniforms: {iTime: {value: 0}, iResolution: {value: new THREE.Vector2(1, 1)}},
          defines: {NUM_RAYS: matchMedia("(max-width: 850px)").matches ? 20 : 35},
          vertexShader, fragmentShader, depthTest: false, depthWrite: false,
        });
        geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false; scene.add(mesh);
        canvas.className = styles.canvas;
        canvas.addEventListener("webglcontextlost", contextLost);
        viewport.appendChild(canvas);
        renderer.compile(scene, camera);
        resize();
        if (!failed) onAvailabilityChange?.(true);
        sync();
      } catch { if (!disposed) fallback(); }
    };
    const sync = () => {
      if (disposed || failed) return;
      if (!visible || document.hidden) { stop(); return; }
      if (!renderer && !initializing) initializing = initialize();
      if (!renderer) return;
      viewport.dataset.shaderState = pausedRef.current ? "paused" : "active";
      if (pausedRef.current) stop();
      else if (!frame) frame = requestAnimationFrame(animate);
    };
    syncRef.current = sync;
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();}, {threshold: 0.01});
    observer.observe(viewport);
    const resizer = new ResizeObserver(resize);
    resizer.observe(viewport);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true; stop(); syncRef.current = () => {};
      observer.disconnect(); resizer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas?.removeEventListener("webglcontextlost", contextLost);
      geometry?.dispose(); material?.dispose();
      renderer?.dispose(); renderer?.forceContextLoss(); canvas?.remove();
      onAvailabilityChange?.(false);
    };
  }, [reduce, speed, onAvailabilityChange]);

  const opacity = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 0.2;
  return (
    <div className={`${styles.host} ${className}`} aria-hidden="true" data-shader-background
      style={{"--shader-intensity": opacity} as CSSProperties}>
      <div className={styles.viewport} ref={viewportRef} data-shader-state="idle" />
    </div>
  );
}

// Preserve the import used by the supplied demo.
export default AnimatedShaderBackground;
