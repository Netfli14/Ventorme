'use client';

import styles from './MascotFallback.module.css';

export type MascotPose = { rotation: number; zoom: number; highFive: number; lift: number };

export function mascotPose(progress: number): MascotPose {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const rotation = Math.min(180, Math.max(0, (p - 0.07) / 0.49 * 180));
  const approach = Math.max(0, Math.min(1, (p - 0.14) / 0.62));
  const zoom = 0.88 + 0.27 * approach - 0.13 * Math.max(0, Math.min(1, (p - 0.83) / 0.13));
  const highFive = p < 0.58 || p > 0.94 ? 0 : Math.sin(Math.PI * (p - 0.58) / 0.36);
  return { rotation, zoom, highFive: Math.max(0, highFive), lift: 8 * Math.sin(p * Math.PI * 2) };
}

const markings: Array<[number, number, number]> = [
  [144, 152, 10], [178, 119, 9], [222, 105, 9], [262, 126, 11],
  [293, 158, 8], [111, 197, 10], [321, 210, 8], [143, 249, 8],
  [286, 250, 8], [181, 84, 7], [250, 89, 7]
];

function Spots({ light = false }: { light?: boolean }) {
  return <g fill={light ? '#a9a6a5' : '#989798'} opacity={light ? .68 : .72}>
    {markings.map(([x, y, radius], i) => <ellipse key={i} cx={x} cy={y} rx={radius} ry={radius * .79} transform={`rotate(${i * 23} ${x} ${y})`} />)}
  </g>;
}

function ShapeBase({ rear = false }: { rear?: boolean }) {
  return <>
    <defs>
      <linearGradient id={rear ? 'furBack' : 'furFront'} x1="0" x2=".95" y1="0" y2=".95">
        <stop offset="0%" stopColor="#ffffff" /><stop offset="75%" stopColor="#f2eeee" /><stop offset="100%" stopColor="#d9d6d6" />
      </linearGradient>
      <linearGradient id={rear ? 'shirtBack' : 'shirtFront'} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3689ff" /><stop offset="100%" stopColor="#1256da" />
      </linearGradient>
    </defs>
    {/* Tail behind the torso, with snow leopard markings. */}
    <path d="M302 404 C350 442 397 444 416 407 C427 387 416 377 403 383 C385 396 365 404 341 389" fill="none" stroke="#ece8e6" strokeWidth="49" strokeLinecap="round" />
    <path d="M402 384 Q426 383 419 413" fill="none" stroke="#989596" strokeWidth="41" strokeLinecap="round" />
    <g fill="#a5a2a3">
      <ellipse cx="361" cy="416" rx="12" ry="20" transform="rotate(72 361 416)" />
      <ellipse cx="335" cy="400" rx="11" ry="16" transform="rotate(60 335 400)" />
    </g>
    {/* Legs and broad soft paws. */}
    <rect x="122" y="378" width="83" height="108" rx="32" fill="#efebea"/>
    <rect x="232" y="378" width="83" height="108" rx="32" fill="#efebea"/>
    <ellipse cx="165" cy="480" rx="66" ry="31" fill="#f8f5f4"/>
    <ellipse cx="273" cy="480" rx="66" ry="31" fill="#f8f5f4"/>
    <g stroke="#c8c1c0" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M140 470q-9 15 0 25M181 473q8 14 0 23M250 473q-8 14 0 23M289 473q8 14 0 23"/>
    </g>
    {/* Arms go under the jersey. */}
    <path d="M120 307 Q79 329 72 384" stroke="#f4f0ef" strokeWidth="55" strokeLinecap="round" fill="none"/>
    <path d="M315 308 Q358 334 365 378" stroke="#f4f0ef" strokeWidth="55" strokeLinecap="round" fill="none"/>
    <g fill="#a9a5a5"><circle cx="77" cy="363" r="10" /><circle cx="361" cy="359" r="10" /><circle cx="138" cy="432" r="12" /><circle cx="284" cy="424" r="12" /></g>
    {/* Blue VentorMe shirt. */}
    <path d="M155 285 Q214 270 273 285 Q321 286 345 318 L314 355 L311 403 Q216 432 112 402 L117 355 L84 321 Q109 290 155 285Z" fill={`url(#${rear ? 'shirtBack' : 'shirtFront'})`} />
    <path d="M113 355 L138 333 M313 355 L293 333" stroke="#1055c3" strokeWidth="7" opacity=".25" fill="none"/>
    {/* Round ears with pink centers. */}
    <circle cx="113" cy="126" r="59" fill="#8f8b8b"/>
    <circle cx="313" cy="126" r="59" fill="#8f8b8b"/>
    <ellipse cx="113" cy="126" rx="36" ry="41" fill="#f6b8bc"/>
    <ellipse cx="313" cy="126" rx="36" ry="41" fill="#f6b8bc"/>
    {/* Large leopard head. */}
    <ellipse cx="213" cy="192" rx="148" ry="137" fill={`url(#${rear ? 'furBack' : 'furFront'})`} />
    <Spots light />
  </>;
}

function Front({ highFive }: { highFive: number }) {
  const shift = -93 * highFive;
  const rise = -83 * highFive;
  const size = 1 + highFive * 1.55;
  return <svg viewBox="0 0 440 530" width="100%" height="100%" aria-hidden="true">
    <ShapeBase />
    {/* White cheeks and muzzle. */}
    <ellipse cx="144" cy="238" rx="57" ry="44" fill="#fbf9f8" />
    <ellipse cx="279" cy="238" rx="57" ry="44" fill="#fbf9f8" />
    <ellipse cx="214" cy="267" rx="80" ry="50" fill="#ffffff" />
    {/* Large expressive eyes. */}
    <ellipse cx="160" cy="194" rx="42" ry="54" fill="#fafbff" />
    <ellipse cx="265" cy="194" rx="42" ry="54" fill="#fafbff" />
    <ellipse cx="169" cy="201" rx="27" ry="37" fill="#173e59" />
    <ellipse cx="257" cy="201" rx="27" ry="37" fill="#173e59" />
    <ellipse cx="174" cy="208" rx="19" ry="28" fill="#060f1c" />
    <ellipse cx="253" cy="208" rx="19" ry="28" fill="#060f1c" />
    <circle cx="178" cy="189" r="9" fill="#fff" />
    <circle cx="261" cy="189" r="9" fill="#fff" />
    {/* Signature electric-blue round glasses. */}
    <g fill="none" stroke="#2775ff" strokeWidth="7">
      <circle cx="157" cy="190" r="59" /><circle cx="268" cy="190" r="59"/>
      <path d="M212 181 Q216 169 221 181 M98 186L77 179 M327 185L350 181"/>
    </g>
    <path d="M128 132Q152 116 177 134M250 134Q273 116 299 133" stroke="#615f60" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M189 258 Q215 273 239 258 Q238 313 215 323 Q190 309 189 258Z" fill="#513136" />
    <path d="M202 308 Q216 294 229 307 L226 317 Q215 325 205 316Z" fill="#fb8e9c"/>
    <path d="M188 251 Q211 233 239 251 Q217 271 207 264Z" fill="#f79fab"/>
    <path d="M212 266L212 283M212 281 Q199 294 189 279M212 281Q225 294 237 279" stroke="#735458" strokeWidth="3" fill="none" strokeLinecap="round" />
    <g fill="#a6a3a2"><circle cx="167" cy="269" r="3"/><circle cx="152" cy="260" r="3"/><circle cx="259" cy="269" r="3"/><circle cx="272" cy="261" r="3"/></g>
    {/* Friendly high five: paw reaches toward the viewer as the scroll progresses. */}
    <g transform={`translate(${shift} ${rise}) translate(350 312) scale(${size}) translate(-350 -312)`}>
      <path d="M329 334 Q351 294 364 295" stroke="#f1eceb" strokeWidth="31" strokeLinecap="round" fill="none"/>
      <ellipse cx="367" cy="272" rx="37" ry="39" fill="#faf6f4"/>
      <g fill="#a7a2a3"><ellipse cx="363" cy="284" rx="15" ry="18"/><ellipse cx="338" cy="260" rx="6" ry="9"/><ellipse cx="351" cy="241" rx="6" ry="9"/><ellipse cx="371" cy="233" rx="6" ry="9"/><ellipse cx="391" cy="246" rx="6" ry="9"/></g>
    </g>
  </svg>;
}

function Back() {
  return <svg viewBox="0 0 440 530" width="100%" height="100%" aria-hidden="true">
    <ShapeBase rear />
    {/* Back of snow leopard head: no face, rounded ears and spots. */}
    <g fill="#a19f9f" opacity=".65">
      <circle cx="213" cy="112" r="19" /><circle cx="174" cy="169" r="19" />
      <circle cx="256" cy="170" r="17" /><circle cx="215" cy="219" r="16" />
      <circle cx="135" cy="225" r="12" /><circle cx="290" cy="224" r="13" />
    </g>
    <path d="M90 278q20 22 51 27M296 304q33-4 50-25" stroke="#ddd8d7" strokeWidth="6" fill="none" />
  </svg>;
}

export function MascotFallback({ progress, reducedMotion = false }: { progress: number; reducedMotion?: boolean }) {
  const pose = mascotPose(reducedMotion ? 1 : progress);
  return <div className={styles.stage} aria-hidden="true">
    <div className={styles.glow} />
    <div className={styles.figure} style={{
      transform: `translate3d(0,${pose.lift}px,0) rotateY(${pose.rotation}deg) scale(${pose.zoom})`
    }}>
      <div className={styles.back}><Back /></div>
      <div className={styles.front}><Front highFive={pose.highFive} /></div>
    </div>
    <div className={styles.floor} />
  </div>;
}
