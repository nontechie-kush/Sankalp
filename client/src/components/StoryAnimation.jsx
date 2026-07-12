import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SCENE_DURATION = 4500;

// ─── Scene 1: Feeling low — dark room, rain, unlit diya ──────────────────────
function Scene1() {
  return (
    <svg viewBox="0 0 400 260" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s1bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#080E1C"/>
          <stop offset="100%" stopColor="#101828"/>
        </linearGradient>
        <linearGradient id="s1floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E1620"/>
          <stop offset="100%" stopColor="#070D16"/>
        </linearGradient>
        <radialGradient id="s1moonHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8BAACC" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#8BAACC" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="s1diyaGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#FF8830" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#FF8830" stopOpacity="0"/>
        </radialGradient>
      </defs>

      <rect width="400" height="260" fill="url(#s1bg)"/>

      {/* Moon */}
      <circle cx="318" cy="52" r="40" fill="url(#s1moonHalo)"/>
      <circle cx="318" cy="52" r="20" fill="#C5D8ED" opacity="0.85"/>
      {/* Clouds obscuring moon */}
      <ellipse cx="300" cy="60" rx="38" ry="16" fill="#121E30"/>
      <ellipse cx="322" cy="54" rx="30" ry="14" fill="#162438"/>
      <ellipse cx="346" cy="62" rx="24" ry="12" fill="#121E30"/>

      {/* Window frame */}
      <rect x="28" y="28" width="138" height="156" rx="6" fill="#09111C"/>
      <rect x="32" y="32" width="130" height="148" rx="4" fill="#050C17"/>
      {/* Stormy sky in window */}
      <rect x="33" y="33" width="128" height="146" rx="3" fill="#060D1A"/>
      <ellipse cx="60"  cy="55" rx="36" ry="20" fill="#0C1826"/>
      <ellipse cx="100" cy="44" rx="48" ry="22" fill="#0E1E2E"/>
      <ellipse cx="140" cy="52" rx="30" ry="16" fill="#0C1826"/>
      {/* Window panes */}
      <line x1="97" y1="32" x2="97" y2="180" stroke="#09111C" strokeWidth="5"/>
      <line x1="32" y1="106" x2="162" y2="106" stroke="#09111C" strokeWidth="5"/>

      {/* Rain drops */}
      {[14,26,38,50,62,74,86,98,110,122,134,148].map((x, i) => (
        <line key={i}
          x1={x + 33} y1={0}
          x2={x + 28} y2={22}
          stroke="#3A6090" strokeWidth="1.2" strokeLinecap="round" opacity="0">
          <animate attributeName="y1"
            values={`${35+(i%5)*16};176`}
            dur={`${0.65+i*0.045}s`} repeatCount="indefinite" begin={`${i*0.07}s`}/>
          <animate attributeName="y2"
            values={`${57+(i%5)*16};198`}
            dur={`${0.65+i*0.045}s`} repeatCount="indefinite" begin={`${i*0.07}s`}/>
          <animate attributeName="opacity" values="0;0.6;0"
            dur={`${0.65+i*0.045}s`} repeatCount="indefinite" begin={`${i*0.07}s`}/>
        </line>
      ))}

      {/* Floor */}
      <rect x="0" y="196" width="400" height="64" fill="url(#s1floor)"/>
      <rect x="0" y="195" width="400" height="2" fill="#060C14"/>

      {/* Table / shelf */}
      <rect x="140" y="168" width="240" height="7" rx="2" fill="#141E2C"/>

      {/* Diya glow on surface */}
      <ellipse cx="242" cy="185" rx="55" ry="18" fill="url(#s1diyaGlow)"/>

      {/* Diya (oil lamp) */}
      <ellipse cx="242" cy="182" rx="30" ry="9" fill="#7A5230"/>
      <path d="M212,182 Q218,193 242,195 Q266,193 272,182 Q256,186 242,187 Q228,186 212,182Z"
        fill="#69421E"/>
      {/* Oil surface */}
      <ellipse cx="242" cy="181" rx="24" ry="6" fill="#5A3010"/>
      {/* Wick */}
      <line x1="242" y1="180" x2="246" y2="171" stroke="#3A2010" strokeWidth="1.5"/>
      {/* Very dim flame — barely alive */}
      <ellipse cx="246" cy="167" rx="4" ry="6" fill="#C05018" opacity="0.2">
        <animate attributeName="opacity" values="0.08;0.3;0.15;0.28;0.08" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="6;7;5;6.5;6" dur="2.4s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="246" cy="167" rx="2" ry="3.5" fill="#FF8030" opacity="0.15">
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="1.8s" repeatCount="indefinite"/>
      </ellipse>

      {/* Floating question marks */}
      {[{x:230,y:95,s:26,d:'0s'},{x:310,y:75,s:19,d:'0.5s'},{x:360,y:105,s:22,d:'0.9s'}].map((q,i)=>(
        <text key={i} x={q.x} y={q.y} fontSize={q.s} fill="#2A4060" textAnchor="middle"
          fontFamily="Georgia,serif" opacity="0">
          ?
          <animate attributeName="opacity" values="0;0.45;0;0.4;0"
            dur="3.2s" repeatCount="indefinite" begin={q.d}/>
          <animate attributeName="y" values={`${q.y};${q.y-10};${q.y}`}
            dur="3.2s" repeatCount="indefinite" begin={q.d}/>
        </text>
      ))}

      {/* Phone face-down on table */}
      <rect x="310" y="165" width="52" height="30" rx="5" fill="#1C1C1E"
        transform="rotate(-8,336,180)"/>
      <rect x="313" y="168" width="46" height="24" rx="3.5" fill="#141416"
        transform="rotate(-8,336,180)"/>

      <rect x="0" y="233" width="400" height="27" fill="rgba(0,0,0,0.35)"/>
      <text x="200" y="251" fill="#7A9AB8" fontSize="12.5" textAnchor="middle"
        fontFamily="system-ui,sans-serif" fontWeight="500">
        Feeling anxious before something that matters...
      </text>
    </svg>
  );
}

// ─── Scene 2: Lotus blooms at sunrise — no character ─────────────────────────
function Scene2() {
  const rays = Array.from({length:12},(_,i)=>i*30);
  return (
    <svg viewBox="0 0 400 260" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s2sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A0E04"/>
          <stop offset="35%" stopColor="#B04418"/>
          <stop offset="70%" stopColor="#E07030"/>
          <stop offset="100%" stopColor="#F09040"/>
        </linearGradient>
        <linearGradient id="s2water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6A2208"/>
          <stop offset="100%" stopColor="#3A1004"/>
        </linearGradient>
        <radialGradient id="s2sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE090" stopOpacity="0.7"/>
          <stop offset="50%" stopColor="#FFA030" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#FF6010" stopOpacity="0"/>
        </radialGradient>
        <filter id="s2glow">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="400" height="260" fill="url(#s2sky)"/>

      {/* Sun glow halo */}
      <circle cx="200" cy="185" r="85" fill="url(#s2sunGlow)">
        <animate attributeName="r" values="82;90;82" dur="3s" repeatCount="indefinite"/>
      </circle>

      {/* Sun */}
      <circle cx="200" cy="200" r="34" fill="#FFD440" filter="url(#s2glow)">
        <animate attributeName="cy" values="215;188;192" dur="2.5s" fill="freeze" begin="0.2s"/>
      </circle>

      {/* Sun rays */}
      {rays.map((angle,i) => {
        const r = angle * Math.PI / 180;
        const cx = 200, cy = 192;
        return (
          <line key={i}
            x1={cx + Math.cos(r)*38} y1={cy + Math.sin(r)*38}
            x2={cx + Math.cos(r)*56} y2={cy + Math.sin(r)*56}
            stroke="#FFE870" strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
            <animate attributeName="opacity" values="0.35;0.85;0.35"
              dur="2.2s" repeatCount="indefinite" begin={`${i*0.08}s`}/>
            <animate attributeName="x2"
              values={`${cx+Math.cos(r)*56};${cx+Math.cos(r)*62};${cx+Math.cos(r)*56}`}
              dur="2.2s" repeatCount="indefinite" begin={`${i*0.08}s`}/>
            <animate attributeName="y2"
              values={`${cy+Math.sin(r)*56};${cy+Math.sin(r)*62};${cy+Math.sin(r)*56}`}
              dur="2.2s" repeatCount="indefinite" begin={`${i*0.08}s`}/>
          </line>
        );
      })}

      {/* Hills */}
      <path d="M0,200 Q55,155 115,178 Q175,130 235,168 Q285,138 345,162 Q375,150 400,158 L400,260 L0,260Z"
        fill="#7A2E0C"/>
      <path d="M0,225 Q48,198 98,212 Q148,182 200,202 Q252,176 305,196 Q352,180 400,192 L400,260 L0,260Z"
        fill="#5A2008"/>
      {/* Water */}
      <ellipse cx="200" cy="248" rx="180" ry="20" fill="url(#s2water)" opacity="0.6"/>

      {/* Lotus stem */}
      <path d="M200,248 Q196,228 198,210" stroke="#4A6828" strokeWidth="3.5" fill="none"
        strokeLinecap="round"/>
      {/* Leaf left */}
      <ellipse cx="184" cy="228" rx="18" ry="8" fill="#3E5A22"
        transform="rotate(-35,184,228)"/>
      {/* Leaf right */}
      <ellipse cx="216" cy="222" rx="16" ry="7" fill="#4A6828"
        transform="rotate(28,216,222)"/>

      {/* Lotus petals — outer, 6 petals, bloom sequentially */}
      {[0,60,120,180,240,300].map((a,i)=>{
        const rad = (a-90)*Math.PI/180;
        const px = 200+Math.cos(rad)*19, py = 202+Math.sin(rad)*11;
        return (
          <ellipse key={`op${i}`} cx={px} cy={py} rx="11" ry="20"
            fill="#F09AB8" transform={`rotate(${a},${px},${py})`} opacity="0">
            <animate attributeName="opacity" values="0;0.92" dur="0.5s"
              fill="freeze" begin={`${0.9+i*0.18}s`}/>
          </ellipse>
        );
      })}
      {/* Inner petals */}
      {[30,90,150,210,270,330].map((a,i)=>{
        const rad = (a-90)*Math.PI/180;
        const px = 200+Math.cos(rad)*11, py = 203+Math.sin(rad)*6;
        return (
          <ellipse key={`ip${i}`} cx={px} cy={py} rx="7" ry="13"
            fill="#F8C0D4" transform={`rotate(${a},${px},${py})`} opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.4s"
              fill="freeze" begin={`${1.7+i*0.12}s`}/>
          </ellipse>
        );
      })}
      {/* Center */}
      <circle cx="200" cy="202" r="8" fill="#FFE050" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze" begin="2.4s"/>
      </circle>
      <circle cx="200" cy="202" r="5" fill="#FFB020" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze" begin="2.5s"/>
      </circle>

      {/* Sparkles */}
      {[{x:120,y:148,d:'0.4s'},{x:285,y:138,d:'0.8s'},{x:315,y:168,d:'1.2s'},
        {x:90,y:168,d:'0.6s'},{x:248,y:118,d:'1.5s'},{x:160,y:122,d:'1s'}].map((s,i)=>(
        <g key={i}>
          <line x1={s.x} y1={s.y-7} x2={s.x} y2={s.y+7} stroke="#FFE870" strokeWidth="1.8" opacity="0">
            <animate attributeName="opacity" values="0;1;0" dur="1.1s" repeatCount="indefinite" begin={s.d}/>
          </line>
          <line x1={s.x-7} y1={s.y} x2={s.x+7} y2={s.y} stroke="#FFE870" strokeWidth="1.8" opacity="0">
            <animate attributeName="opacity" values="0;1;0" dur="1.1s" repeatCount="indefinite" begin={s.d}/>
          </line>
        </g>
      ))}

      {/* Sankalp wordmark */}
      <text x="200" y="80" fill="#FFE8C0" fontSize="22" textAnchor="middle"
        fontFamily="Georgia,serif" fontWeight="700" letterSpacing="3" opacity="0">
        SANKALP
        <animate attributeName="opacity" values="0;0.95" dur="0.8s" fill="freeze" begin="1.2s"/>
      </text>
      <text x="200" y="98" fill="#F5C090" fontSize="9" textAnchor="middle"
        fontFamily="system-ui" letterSpacing="4" opacity="0">
        RITUALS FOR LIFE'S MOMENTS
        <animate attributeName="opacity" values="0;0.7" dur="0.6s" fill="freeze" begin="1.8s"/>
      </text>

      <rect x="0" y="233" width="400" height="27" fill="rgba(0,0,0,0.25)"/>
      <text x="200" y="251" fill="#FFE0C0" fontSize="12.5" textAnchor="middle"
        fontFamily="system-ui,sans-serif" fontWeight="500">
        Opens Sankalp — finds the right ritual instantly
      </text>
    </svg>
  );
}

// ─── Scene 3: Books ritual — phone payment UI ─────────────────────────────────
function Scene3() {
  return (
    <svg viewBox="0 0 400 260" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s3bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF6E8"/>
          <stop offset="100%" stopColor="#FFE8C8"/>
        </linearGradient>
        <filter id="s3sh"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="400" height="260" fill="url(#s3bg)"/>

      {/* Ambient dots */}
      {[{cx:45,cy:45,r:6,c:'#F4B87A',o:0.28},{cx:372,cy:75,r:8,c:'#E07840',o:0.22},
        {cx:28,cy:195,r:5,c:'#D06030',o:0.18},{cx:382,cy:205,r:7,c:'#F4B87A',o:0.28},
        {cx:88,cy:235,r:4,c:'#E07840',o:0.18},{cx:340,cy:238,r:5,c:'#D06030',o:0.2}].map((d,i)=>(
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.c} opacity={d.o}/>
      ))}

      {/* Phone shadow */}
      <rect x="126" y="24" width="152" height="226" rx="22" fill="rgba(0,0,0,0.1)"
        filter="url(#s3sh)" transform="translate(3,4)"/>
      {/* Phone body */}
      <rect x="126" y="24" width="152" height="226" rx="22" fill="#1A1A1A"/>
      <rect x="128" y="26" width="148" height="222" rx="21" fill="#2A2A2A"/>
      <rect x="130" y="28" width="144" height="218" rx="20" fill="#FDFAF5"/>
      {/* Notch */}
      <rect x="178" y="28" width="48" height="10" rx="5" fill="#2A2A2A"/>

      {/* App header */}
      <rect x="130" y="28" width="144" height="36" rx="20" fill="#7D4A2F"/>
      <rect x="130" y="44" width="144" height="20" fill="#7D4A2F"/>
      <text x="202" y="50" fill="#fff" fontSize="10" textAnchor="middle"
        fontFamily="system-ui" fontWeight="800" letterSpacing="2">SANKALP</text>

      {/* Ritual card */}
      <rect x="138" y="72" width="128" height="52" rx="10" fill="#fff"/>
      <rect x="138" y="72" width="128" height="52" rx="10" fill="none"
        stroke="#F0E0C8" strokeWidth="1"/>
      <circle cx="158" cy="98" r="14" fill="#FFF0E0"/>
      <text x="158" y="102" fontSize="15" textAnchor="middle">🕉️</text>
      <text x="175" y="85" fill="#1A1108" fontSize="8.5" fontWeight="700"
        fontFamily="system-ui">Raksha Kavach</text>
      <text x="175" y="96" fill="#7D4A2F" fontSize="7.5" fontFamily="system-ui">Exam Day · ₹149</text>
      <text x="175" y="106" fill="#999" fontSize="7" fontFamily="system-ui">Calm focus when it counts</text>

      {/* Slot */}
      <rect x="138" y="130" width="128" height="24" rx="7" fill="#F5F0E8"/>
      <text x="148" y="146" fill="#5A4030" fontSize="7.5" fontFamily="system-ui">
        📅  Tomorrow, early morning
      </text>

      {/* Divider */}
      <line x1="138" y1="163" x2="266" y2="163" stroke="#EDE0D0" strokeWidth="1"/>

      {/* Price */}
      <text x="148" y="182" fill="#AAA" fontSize="9" fontFamily="system-ui">Total</text>
      <text x="260" y="183" fill="#1A1108" fontSize="20" fontWeight="800"
        textAnchor="end" fontFamily="system-ui">₹149</text>

      {/* Pay CTA button */}
      <rect x="138" y="190" width="128" height="34" rx="11" fill="#7D4A2F">
        <animate attributeName="opacity" values="1;0.82;1" dur="1.6s" repeatCount="indefinite"/>
      </rect>
      <text x="202" y="212" fill="#fff" fontSize="11" textAnchor="middle"
        fontWeight="700" fontFamily="system-ui">Confirm &amp; Pay →</text>

      {/* Confirmed badge */}
      <circle cx="306" cy="72" r="32" fill="#E8F8EE" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze" begin="0.6s"/>
      </circle>
      <circle cx="306" cy="72" r="26" fill="#22C55E" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.4s" fill="freeze" begin="0.7s"/>
      </circle>
      <path d="M294,72 L302,81 L318,58" stroke="#fff" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.25s" fill="freeze" begin="0.95s"/>
      </path>
      <text x="306" y="112" fill="#22C55E" fontSize="9" textAnchor="middle"
        fontWeight="700" fontFamily="system-ui" opacity="0">
        Confirmed!
        <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze" begin="1.1s"/>
      </text>

      <rect x="0" y="233" width="400" height="27" fill="rgba(180,100,30,0.1)"/>
      <text x="200" y="251" fill="#7D4A2F" fontSize="12.5" textAnchor="middle"
        fontFamily="system-ui,sans-serif" fontWeight="600">
        Books the ritual — confirmed in under a minute
      </text>
    </svg>
  );
}

// ─── Scene 4: Pandit performs — sacred fire, OM, no character ────────────────
function Scene4() {
  return (
    <svg viewBox="0 0 400 260" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s4bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060300"/>
          <stop offset="100%" stopColor="#120800"/>
        </linearGradient>
        <radialGradient id="s4ambientGlow" cx="50%" cy="75%" r="55%">
          <stop offset="0%" stopColor="#FF6010" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#FF4000" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="s4floorGlow" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#FF5010" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#FF4000" stopOpacity="0"/>
        </radialGradient>
        <filter id="s4bigBlur"><feGaussianBlur stdDeviation="10"/></filter>
        <filter id="s4medBlur"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>

      <rect width="400" height="260" fill="url(#s4bg)"/>

      {/* Fire ambient light on ground */}
      <ellipse cx="200" cy="240" rx="120" ry="28" fill="url(#s4floorGlow)"/>
      <ellipse cx="200" cy="210" rx="80" ry="40" fill="url(#s4ambientGlow)">
        <animate attributeName="rx" values="75;88;72;80" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;0.85;1" dur="1.4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Stars */}
      {[{x:32,y:22},{x:72,y:12},{x:120,y:38},{x:165,y:15},{x:235,y:25},
        {x:278,y:10},{x:325,y:35},{x:362,y:16},{x:52,y:58},{x:108,y:62},
        {x:295,y:52},{x:355,y:44},{x:145,y:50},{x:385,y:72}].map((s,i)=>(
        <circle key={i} cx={s.x} cy={s.y} r="1.3" fill="#D8C890" opacity="0">
          <animate attributeName="opacity"
            values="0;0.8;0.3;0.9;0"
            dur={`${2.2+i*0.28}s`} repeatCount="indefinite" begin={`${i*0.18}s`}/>
        </circle>
      ))}

      {/* Crescent moon */}
      <circle cx="342" cy="44" r="20" fill="#C8B460"/>
      <circle cx="351" cy="38" r="17" fill="#0A0500"/>

      {/* OM symbol — center, glowing gold */}
      <text x="200" y="105" fontSize="58" fill="#D4A020" textAnchor="middle"
        fontFamily="serif" opacity="0" filter="url(#s4bigBlur)">
        ॐ
        <animate attributeName="opacity" values="0.15;0.3;0.15" dur="2.5s" repeatCount="indefinite"/>
      </text>
      <text x="200" y="105" fontSize="58" fill="#F0C030" textAnchor="middle"
        fontFamily="serif">
        ॐ
        <animate attributeName="opacity" values="0.75;1;0.78;0.95;0.75" dur="2.8s" repeatCount="indefinite"/>
        <animate attributeName="fontSize" values="58;60;58" dur="2.8s" repeatCount="indefinite"/>
      </text>

      {/* Havan kund (ritual fire pit) — brick square */}
      <rect x="152" y="186" width="96" height="28" rx="5" fill="#5A2E10"/>
      <rect x="155" y="189" width="90" height="22" rx="4" fill="#3E1E08"/>
      {[0,1,2].map(row=>[0,1,2,3].map(col=>(
        <rect key={`${row}-${col}`}
          x={160+col*22+(row%2)*11} y={190+row*7}
          width="19" height="6" rx="1.5"
          fill="none" stroke="#5A2E10" strokeWidth="0.6"/>
      )))}
      {/* Ash base */}
      <ellipse cx="200" cy="198" rx="36" ry="8" fill="#2E1408"/>

      {/* Fire outer glow */}
      <ellipse cx="200" cy="178" rx="38" ry="24" fill="#FF4800" opacity="0.08"
        filter="url(#s4bigBlur)">
        <animate attributeName="rx" values="38;46;34;40;38" dur="1.1s" repeatCount="indefinite"/>
      </ellipse>

      {/* Large flame */}
      <path d="M182,188 Q174,164 184,140 Q190,124 200,112 Q210,126 216,144 Q222,164 216,188Z"
        fill="#E85010">
        <animate attributeName="d"
          values="M182,188 Q174,164 184,140 Q190,124 200,112 Q210,126 216,144 Q222,164 216,188Z;
                  M183,188 Q173,160 185,136 Q192,120 200,108 Q208,122 215,140 Q220,162 215,188Z;
                  M181,188 Q176,166 183,138 Q190,126 200,114 Q210,124 217,142 Q223,160 217,188Z;
                  M182,188 Q174,164 184,140 Q190,124 200,112 Q210,126 216,144 Q222,164 216,188Z"
          dur="0.75s" repeatCount="indefinite"/>
      </path>

      {/* Mid flame */}
      <path d="M188,188 Q184,168 192,148 Q197,136 200,128 Q203,138 207,152 Q211,168 210,188Z"
        fill="#FF8818">
        <animate attributeName="d"
          values="M188,188 Q184,168 192,148 Q197,136 200,128 Q203,138 207,152 Q211,168 210,188Z;
                  M187,188 Q182,165 191,144 Q196,133 200,125 Q204,135 208,150 Q212,170 210,188Z;
                  M189,188 Q185,170 193,150 Q198,139 200,131 Q202,141 206,154 Q210,166 209,188Z;
                  M188,188 Q184,168 192,148 Q197,136 200,128 Q203,138 207,152 Q211,168 210,188Z"
          dur="0.6s" repeatCount="indefinite"/>
      </path>

      {/* Inner bright flame */}
      <path d="M193,188 Q191,172 196,156 Q199,146 200,142 Q201,148 203,160 Q206,174 206,188Z"
        fill="#FFE040">
        <animate attributeName="d"
          values="M193,188 Q191,172 196,156 Q199,146 200,142 Q201,148 203,160 Q206,174 206,188Z;
                  M192,188 Q190,170 195,153 Q198,144 200,140 Q202,146 204,158 Q207,175 207,188Z;
                  M194,188 Q192,174 197,158 Q200,148 200,144 Q200,150 202,162 Q205,172 205,188Z;
                  M193,188 Q191,172 196,156 Q199,146 200,142 Q201,148 203,160 Q206,174 206,188Z"
          dur="0.5s" repeatCount="indefinite"/>
      </path>

      {/* Sparks floating up */}
      {[{x:193,y:125,d:'0s'},{x:207,y:118,d:'0.22s'},{x:199,y:110,d:'0.44s'},
        {x:213,y:130,d:'0.66s'},{x:187,y:132,d:'0.33s'},{x:204,y:108,d:'0.55s'}].map((sp,i)=>(
        <circle key={i} cx={sp.x} cy={sp.y} r="2.2" fill="#FFD040" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="0.7s" repeatCount="indefinite" begin={sp.d}/>
          <animate attributeName="cy" values={`${sp.y};${sp.y-20}`} dur="0.7s" repeatCount="indefinite" begin={sp.d}/>
          <animate attributeName="r" values="2.2;0.4" dur="0.7s" repeatCount="indefinite" begin={sp.d}/>
        </circle>
      ))}

      {/* Smoke wisps */}
      {[{x:195,d:'0s'},{x:205,d:'0.45s'},{x:200,d:'0.9s'}].map((sm,i)=>(
        <path key={i}
          d={`M${sm.x},108 Q${sm.x-9},94 ${sm.x+5},80 Q${sm.x+9},66 ${sm.x-4},52`}
          fill="none" stroke="#807878" strokeWidth="2.5" strokeLinecap="round" opacity="0">
          <animate attributeName="opacity" values="0;0.22;0.12;0" dur="2.2s" repeatCount="indefinite" begin={sm.d}/>
        </path>
      ))}

      {/* Floating flower petals */}
      {[{x:138,y:172,a:35,d:'0.3s'},{x:262,y:168,a:-25,d:'0.9s'},
        {x:150,y:148,a:50,d:'1.4s'},{x:255,y:150,a:-40,d:'0.6s'},
        {x:125,y:155,a:20,d:'1.1s'},{x:275,y:140,a:-15,d:'1.7s'}].map((p,i)=>(
        <ellipse key={i} cx={p.x} cy={p.y} rx="5.5" ry="10"
          fill="#F498B0" transform={`rotate(${p.a},${p.x},${p.y})`} opacity="0">
          <animate attributeName="opacity" values="0;0.65;0" dur="2.2s" repeatCount="indefinite" begin={p.d}/>
          <animate attributeName="cy" values={`${p.y};${p.y-38}`} dur="2.2s" repeatCount="indefinite" begin={p.d}/>
          <animate attributeName="cx"
            values={`${p.x};${p.x+(i%2?8:-8)};${p.x}`}
            dur="2.2s" repeatCount="indefinite" begin={p.d}/>
        </ellipse>
      ))}

      <rect x="0" y="233" width="400" height="27" fill="rgba(0,0,0,0.45)"/>
      <text x="200" y="251" fill="#E8C050" fontSize="12.5" textAnchor="middle"
        fontFamily="system-ui,sans-serif" fontWeight="500">
        Verified pandit performs the Sankalp in your name
      </text>
    </svg>
  );
}

// ─── Scene 5: Certificate & WhatsApp delivery ─────────────────────────────────
function Scene5() {
  return (
    <svg viewBox="0 0 400 260" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s5bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFDF5"/>
          <stop offset="100%" stopColor="#FFF5DC"/>
        </linearGradient>
        <linearGradient id="s5cert" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFEFA"/>
          <stop offset="100%" stopColor="#FFF9E8"/>
        </linearGradient>
        <filter id="s5sh"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>

      <rect width="400" height="260" fill="url(#s5bg)"/>

      {/* Confetti */}
      {[{x:35,y:18,c:'#FF6B6B',a:25,w:7,h:12},{x:80,y:8,c:'#FFD93D',a:-15,w:6,h:10},
        {x:140,y:14,c:'#6BCB77',a:40,w:8,h:13},{x:195,y:5,c:'#4D96FF',a:-30,w:7,h:11},
        {x:248,y:20,c:'#FF6B6B',a:20,w:6,h:12},{x:302,y:8,c:'#FFD93D',a:-40,w:8,h:10},
        {x:348,y:22,c:'#6BCB77',a:35,w:6,h:13},{x:72,y:50,c:'#4D96FF',a:-20,w:7,h:10},
        {x:125,y:40,c:'#FF9A3C',a:15,w:5,h:11},{x:278,y:45,c:'#FF6B6B',a:-25,w:8,h:10},
        {x:362,y:44,c:'#FFD93D',a:30,w:6,h:12},{x:22,y:58,c:'#6BCB77',a:-10,w:5,h:9},
        {x:385,y:65,c:'#FF9A3C',a:45,w:7,h:11}].map((c,i)=>(
        <rect key={i}
          x={c.x-c.w/2} y={c.y-c.h/2}
          width={c.w} height={c.h} rx="1.5"
          fill={c.c} transform={`rotate(${c.a},${c.x},${c.y})`} opacity="0">
          <animate attributeName="opacity" values="0;0.9;0.9;0"
            dur={`${1.8+i*0.12}s`} repeatCount="indefinite" begin={`${i*0.11}s`}/>
          <animate attributeName="y"
            values={`${c.y-c.h/2};${c.y+70-c.h/2}`}
            dur={`${1.8+i*0.12}s`} repeatCount="indefinite" begin={`${i*0.11}s`}/>
        </rect>
      ))}

      {/* Certificate shadow */}
      <rect x="42" y="36" width="188" height="190" rx="12"
        fill="rgba(0,0,0,0.08)" filter="url(#s5sh)" transform="translate(4,5)"/>
      {/* Certificate body */}
      <rect x="42" y="36" width="188" height="190" rx="12" fill="url(#s5cert)"
        stroke="#D4A020" strokeWidth="1.8"/>
      {/* Inner dashed border */}
      <rect x="49" y="43" width="174" height="176" rx="8"
        fill="none" stroke="#E8C040" strokeWidth="0.7" strokeDasharray="5,3"/>

      {/* Header band */}
      <rect x="42" y="36" width="188" height="38" rx="12" fill="#D4A020"/>
      <rect x="42" y="56" width="188" height="18" fill="#D4A020"/>
      <text x="136" y="60" fill="#7A3A0E" fontSize="11" textAnchor="middle"
        fontWeight="800" fontFamily="Georgia,serif" letterSpacing="2.5">SANKALP</text>

      {/* Certificate title */}
      <text x="136" y="90" fill="#3A1A08" fontSize="12.5" textAnchor="middle"
        fontWeight="700" fontFamily="Georgia,serif">Ritual Certificate</text>
      {/* Divider line */}
      <path d="M62,97 Q136,104 210,97" stroke="#D4A020" strokeWidth="1.2" fill="none"/>

      {/* OM center */}
      <circle cx="136" cy="140" r="30" fill="#D4A020" opacity="0.08">
        <animate attributeName="r" values="30;38;30" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.08;0;0.08" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="136" cy="140" r="24" fill="none" stroke="#D4A020" strokeWidth="1.2" strokeDasharray="4,3"/>
      <text x="136" y="148" fill="#C8901C" fontSize="28" textAnchor="middle" fontFamily="serif">ॐ</text>

      {/* Ritual name */}
      <text x="136" y="178" fill="#5A2808" fontSize="10" textAnchor="middle"
        fontFamily="system-ui" fontWeight="600">Raksha Kavach Puja</text>
      <text x="136" y="190" fill="#9A6040" fontSize="8" textAnchor="middle"
        fontFamily="system-ui">duly performed on your behalf</text>

      {/* VERIFIED seal */}
      <circle cx="136" cy="214" r="15" fill="#BE6A43"/>
      <circle cx="136" cy="214" r="12" fill="#D4804E"/>
      <text x="136" y="218" fill="#fff" fontSize="6" textAnchor="middle"
        fontWeight="800" fontFamily="system-ui" letterSpacing="1.2">VERIFIED</text>

      {/* Corner stars */}
      {[{x:52,y:46},{x:218,y:46},{x:52,y:218},{x:218,y:218}].map((s,i)=>(
        <text key={i} x={s.x} y={s.y} fontSize="9" fill="#D4A020" textAnchor="middle">★</text>
      ))}

      {/* Phone with WhatsApp notification */}
      <rect x="252" y="48" width="112" height="196" rx="16" fill="#1C1C1E"
        filter="url(#s5sh)" transform="translate(2,3)" opacity="0.4"/>
      <rect x="252" y="48" width="112" height="196" rx="16" fill="#1C1C1E"/>
      <rect x="266" y="52" width="84" height="8" rx="4" fill="#0A0A0C"/>
      {/* Screen */}
      <rect x="256" y="62" width="104" height="178" rx="10" fill="#121212"/>

      {/* WhatsApp message bubble */}
      <rect x="260" y="68" width="96" height="80" rx="10" fill="#1A2E1A"/>
      {/* WA header */}
      <rect x="260" y="68" width="96" height="22" rx="10" fill="#25D366"/>
      <rect x="260" y="78" width="96" height="12" fill="#25D366"/>
      <circle cx="272" cy="79" r="6" fill="#128C7E"/>
      <text x="285" y="83" fill="#fff" fontSize="7.5" fontWeight="700"
        fontFamily="system-ui">Sankalp</text>

      {/* Certificate thumbnail in chat */}
      <rect x="264" y="94" width="60" height="42" rx="5" fill="#2A2A1A"/>
      <rect x="264" y="94" width="60" height="42" rx="5"
        fill="none" stroke="#D4A020" strokeWidth="0.8"/>
      <text x="294" y="110" fill="#D4A020" fontSize="14" textAnchor="middle" fontFamily="serif">ॐ</text>
      <text x="294" y="122" fill="#B8901A" fontSize="6" textAnchor="middle"
        fontFamily="system-ui" fontWeight="700">RITUAL CERT</text>
      <text x="294" y="131" fill="#888" fontSize="5.5" textAnchor="middle"
        fontFamily="system-ui">tap to view</text>

      {/* Message text */}
      <text x="332" y="100" fill="#B0D8B0" fontSize="6.5" fontFamily="system-ui">Video ready! 🙏</text>
      <text x="332" y="110" fill="#888" fontSize="6" fontFamily="system-ui">Raksha Kavach</text>
      <text x="332" y="119" fill="#888" fontSize="6" fontFamily="system-ui">performed ✓✓</text>

      {/* Green tick delivered */}
      <text x="352" y="138" fill="#25D366" fontSize="7" fontFamily="system-ui">✓✓ Delivered</text>

      {/* Diya icon below */}
      <text x="308" y="178" fontSize="26" textAnchor="middle">🪔</text>
      <text x="308" y="200" fill="#D4A020" fontSize="7.5" textAnchor="middle"
        fontWeight="600" fontFamily="system-ui">Puja Completed</text>
      <text x="308" y="212" fill="#888" fontSize="6.5" textAnchor="middle"
        fontFamily="system-ui">With full Vedic rites</text>

      <rect x="0" y="233" width="400" height="27" fill="rgba(180,100,30,0.09)"/>
      <text x="200" y="251" fill="#7D4A2F" fontSize="12.5" textAnchor="middle"
        fontFamily="system-ui,sans-serif" fontWeight="600">
        Certificate &amp; video proof — delivered to WhatsApp
      </text>
    </svg>
  );
}

const SCENES = [
  { id: 'low',    label: 'Feeling low',      bg: '#0C1420', Scene: Scene1 },
  { id: 'app',    label: 'Opens Sankalp',    bg: '#7A2C08', Scene: Scene2 },
  { id: 'book',   label: 'Books ritual',     bg: '#FFF0D4', Scene: Scene3 },
  { id: 'ritual', label: 'Pandit performs',  bg: '#0E0600', Scene: Scene4 },
  { id: 'cert',   label: 'Gets certificate', bg: '#FFFBEE', Scene: Scene5 },
];

export default function StoryAnimation() {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef(null);

  function startTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setScene(s => (s + 1) % SCENES.length), SCENE_DURATION);
  }

  useEffect(() => {
    if (playing) startTimer();
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [playing]);

  function goTo(i) { setScene(i); if (playing) startTimer(); }

  const { Scene: ActiveScene, bg, label } = SCENES[scene];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        border: '1.5px solid rgba(0,0,0,0.08)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.13)',
        position: 'relative', background: bg,
        transition: 'background 0.5s ease',
      }}>
        {/* Progress bars */}
        <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10,
          display:'flex', gap:3, padding:'10px 12px' }}>
          {SCENES.map((_,i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              flex:1, height:3, borderRadius:2,
              background:'rgba(255,255,255,0.28)', overflow:'hidden', cursor:'pointer',
            }}>
              {i < scene && <div style={{width:'100%',height:'100%',background:'rgba(255,255,255,0.9)'}}/>}
              {i === scene && (
                <motion.div key={scene}
                  initial={{width:'0%'}} animate={{width:'100%'}}
                  transition={{duration: playing ? SCENE_DURATION/1000 : 0, ease:'linear'}}
                  style={{height:'100%',background:'rgba(255,255,255,0.95)'}}/>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={scene}
            initial={{opacity:0, scale:0.97}}
            animate={{opacity:1, scale:1}}
            exit={{opacity:0, scale:1.02}}
            transition={{duration:0.3, ease:'easeInOut'}}>
            <ActiveScene/>
          </motion.div>
        </AnimatePresence>

        {/* Tap zones */}
        <div style={{position:'absolute',inset:0,display:'flex'}}>
          <div style={{flex:1,cursor:'pointer'}} onClick={() => goTo((scene-1+SCENES.length)%SCENES.length)}/>
          <div style={{flex:1,cursor:'pointer'}} onClick={() => goTo((scene+1)%SCENES.length)}/>
        </div>

        {/* Play / pause */}
        <button onClick={() => setPlaying(p=>!p)} style={{
          position:'absolute', bottom:42, right:12, zIndex:10,
          background:'rgba(0,0,0,0.28)', border:'none', borderRadius:'50%',
          width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', color:'#fff',
        }}>
          {playing
            ? <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                <rect x="0" y="0" width="3.5" height="12"/><rect x="6.5" y="0" width="3.5" height="12"/>
              </svg>
            : <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                <path d="M0 0 L10 6 L0 12Z"/>
              </svg>
          }
        </button>
      </div>

      {/* Dot nav + label */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, marginTop:10 }}>
        <div style={{ display:'flex', gap:7, alignItems:'center' }}>
          {SCENES.map((_,i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === scene ? 22 : 7,
              height:7, borderRadius:4, border:'none', cursor:'pointer',
              background: i === scene ? '#BE6A43' : 'rgba(0,0,0,0.18)',
              transition:'all 0.35s ease', padding:0,
            }}/>
          ))}
        </div>
        <div style={{ fontSize:12, color:'var(--text-3)', letterSpacing:'.02em' }}>
          {label} · tap to navigate
        </div>
      </div>
    </div>
  );
}
