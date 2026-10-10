'use client';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { Compass } from 'lucide-react';
import { useApp } from './Providers';
// Small SVG scene; no WebGL context, textures or continuous render loop.
export function CompassScene() {
  const host = useRef<HTMLDivElement>(null), { theme } = useApp(), reduce = useReducedMotion();
  useEffect(() => {
    const el = host.current;
    if (!el || reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches || window.innerWidth < 900) return;
    let stopped = false, destroy: (() => void) | undefined;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) return;
      observer.disconnect();
      Promise.all([import('three'), import('three/addons/renderers/SVGRenderer.js'), import('gsap')]).then(([THREE, { SVGRenderer }, { gsap }]) => {
        if (stopped) return;
        const renderer = new SVGRenderer(); renderer.setQuality('low');
        renderer.domElement.setAttribute('aria-hidden', 'true');
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50), group = new THREE.Group();
        camera.position.set(0, 0, 7); group.rotation.x = -0.12; scene.add(group);
        const blue = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(), warm = getComputedStyle(document.documentElement).getPropertyValue('--warm').trim();
        const materials: InstanceType<typeof THREE.LineBasicMaterial>[] = [], geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
        for (const radius of [1.08, 1.28, 1.55]) {
          const pts = Array.from({ length: 65 }, (_, i) => new THREE.Vector3(Math.cos(i / 64 * Math.PI * 2) * radius, Math.sin(i / 64 * Math.PI * 2) * radius, 0));
          const g = new THREE.BufferGeometry().setFromPoints(pts), m = new THREE.LineBasicMaterial({ color: blue, opacity: 0.35, transparent: true });
          geometries.push(g); materials.push(m); group.add(new THREE.Line(g, m));
        }
        const needle = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.48, -0.65, 0.12), new THREE.Vector3(0, 1.08, 0.12), new THREE.Vector3(0.48, -0.65, 0.12), new THREE.Vector3(0, -0.35, 0.12), new THREE.Vector3(-0.48, -0.65, 0.12)]);
        const needleMaterial = new THREE.LineBasicMaterial({ color: warm }); geometries.push(needle); materials.push(needleMaterial); group.add(new THREE.Line(needle, needleMaterial));
        el.appendChild(renderer.domElement); el.dataset.ready = 'true';
        const render = () => { if (!stopped) renderer.render(scene, camera); };
        const resize = () => { const size = Math.min(el.clientWidth, el.clientHeight); renderer.setSize(size, size); render(); };
        const ro = new ResizeObserver(resize); ro.observe(el); resize();
        const pointer = (e: PointerEvent) => { const r = el.getBoundingClientRect(); gsap.to(group.rotation, { x: -(e.clientY - r.top - r.height / 2) / r.height * 0.6, y: (e.clientX - r.left - r.width / 2) / r.width * 0.6, duration: 0.24, onUpdate: render }); };
        const leave = () => { gsap.to(group.rotation, { x: -0.12, y: 0, duration: 0.24, onUpdate: render }); };
        el.addEventListener('pointermove', pointer); el.addEventListener('pointerleave', leave);
        destroy = () => { gsap.killTweensOf(group.rotation); ro.disconnect(); el.removeEventListener('pointermove', pointer); el.removeEventListener('pointerleave', leave); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.domElement.remove(); delete el.dataset.ready; };
      }).catch(() => { /* The static compass remains visible if the enhancement fails. */ });
    }); observer.observe(el);
    return () => { stopped = true; observer.disconnect(); destroy?.(); };
  }, [theme, reduce]);
  return <div className="compass-scene" ref={host} aria-hidden="true"><Compass className="static-compass" size={138} strokeWidth={0.6} /></div>;
}
