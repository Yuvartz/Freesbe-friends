import { useEffect, useState, useRef } from 'react';

// Bird configuration
const BIRD_CONFIG = {
  sets: [
    { sheet: '/birds/bird1/bird1_', frames: 9 },
    { sheet: '/birds/bird2/bird2_', frames: 9 },
    { sheet: '/birds/bird3/bird3_', frames: 9 },
    { sheet: '/birds/bird4/bird4_', frames: 9 },
    { sheet: '/birds/bird5/bird5_', frames: 9 },
    { sheet: '/birds/bird6/bird6_', frames: 9 },
  ],
  baseSpeed: 4200,      // ms for full screen at scale 1
  speedJitter: 0.15,    // ±15 %
  scaleRange: [0.6, 1.0],
  ampRange: [12, 30],   // wave amplitude px
  freqRange: [0.5, 1.0], // wave frequency factor
  yRange: [200, 460]    // spawn altitude px (bottom value)
};

// Small bird configuration (1/20 size)
const SMALL_BIRD_CONFIG = {
  sets: [
    { sheet: '/birds/bird1/bird1_', frames: 9 },
    { sheet: '/birds/bird2/bird2_', frames: 9 },
    { sheet: '/birds/bird3/bird3_', frames: 9 },
    { sheet: '/birds/bird4/bird4_', frames: 9 },
  ],
  baseSpeed: 6000,      // slower than regular birds
  speedJitter: 0.2,     // more speed variation
  scaleRange: [0.05, 0.08], // Much smaller
  ampRange: [2, 6],     // smaller wave amplitude
  freqRange: [0.8, 1.2], // slightly different frequency
  yRange: [290, 550]    // same zone as regular birds
};

function rand(min, max) { return min + Math.random() * (max - min); }

export default function useBirds(active, gameAreaWidth = 1200) {
  const [birds, setBirds] = useState([]);
  const [smallBirds, setSmallBirds] = useState([]);
  const idCounter = useRef(0);
  const smallBirdIdCounter = useRef(0);
  const frameRef = useRef(0);
  let lastBirdSoundTime = 0;

  // --- spawnOne must be outside useEffect for 5-min event ---
  const spawnOne = (dir) => {
    const set = Math.floor(Math.random() * BIRD_CONFIG.sets.length);
    if (dir === undefined) dir = Math.random() < 0.5 ? 1 : -1;
    const scale = rand(...BIRD_CONFIG.scaleRange);
    const speed = BIRD_CONFIG.baseSpeed * 3 *
                  (1 + (Math.random() - 0.5) * BIRD_CONFIG.speedJitter * 2) /
                  scale; // 3x slower
    const amp = rand(...BIRD_CONFIG.ampRange) * scale;
    const freq = rand(...BIRD_CONFIG.freqRange);
    const phase = Math.random() * Math.PI * 2;
    const y0 = rand(...BIRD_CONFIG.yRange);
    const spawnX = dir === 1 ? -120 : gameAreaWidth + 120;
    const now = Date.now();
    
    // Play matching SFX for this bird set
    const sfx = `/birds/sfx/bird${set + 1}.mp3`;
    if (window.birdSfxRef && window.birdSfxRef.current && now - lastBirdSoundTime > 7000) {
      try {
        const audio = window.birdSfxRef.current;
        audio.pause();
        audio.currentTime = 0;
        audio.src = process.env.PUBLIC_URL + sfx;
        audio.volume = 0.3;
        audio.play().catch(() => {});
        lastBirdSoundTime = now;
      } catch (e) {}
    }
    
    setBirds(list => [
      ...list,
      {
        id: idCounter.current++,
        set,
        frame: 0,
        x: spawnX,
        y: y0,
        yBase: y0,
        dir,
        scale,
        speed,
        amp,
        freq,
        phase,
        born: performance.now(),
      },
    ]);
  };

  // --- spawnSmallOne for small birds ---
  const spawnSmallOne = (dir, birdType, height) => {
    const set = birdType !== undefined ? birdType : Math.floor(Math.random() * SMALL_BIRD_CONFIG.sets.length);
    if (dir === undefined) dir = Math.random() < 0.5 ? 1 : -1;
    const scale = rand(...SMALL_BIRD_CONFIG.scaleRange);
    const speed = SMALL_BIRD_CONFIG.baseSpeed * 2 *
                  (1 + (Math.random() - 0.5) * SMALL_BIRD_CONFIG.speedJitter * 2) /
                  scale; // 2x slower than regular birds
    const amp = rand(...SMALL_BIRD_CONFIG.ampRange) * scale;
    const freq = rand(...SMALL_BIRD_CONFIG.freqRange);
    const phase = Math.random() * Math.PI * 2;
    const y0 = height !== undefined ? height : rand(...SMALL_BIRD_CONFIG.yRange);
    const spawnX = dir === 1 ? -60 : gameAreaWidth + 60; // smaller spawn distance
    
    setSmallBirds(list => [
      ...list,
      {
        id: `small-${smallBirdIdCounter.current++}`,
        set,
        frame: 0,
        x: spawnX,
        y: y0,
        yBase: y0,
        dir,
        scale,
        speed,
        amp,
        freq,
        phase,
        born: performance.now(),
        isSmall: true,
      },
    ]);
  };

  useEffect(() => {
    if (!active) return;

    // requestAnimationFrame-based animation loop
    let raf;
    let last = performance.now();
    const step = () => {
      frameRef.current += 1;
      
      // Update regular birds
      setBirds(list => {
        return list
          .map(b => {
            const t = (frameRef.current / 60) + b.phase; // match boats
            const dx = (gameAreaWidth / b.speed) * (1000 / 60); // dt ~16.67ms
            const newX = b.x + (b.dir === 1 ? dx : -dx);
            const out = b.dir === 1 ? newX > gameAreaWidth + 60
                                   : newX < -60;
            return {
              ...b,
              x: newX,
              y: b.yBase + Math.sin(b.phase + newX / 80) * b.amp, // up/down movement
              rot: Math.sin(b.phase + newX / 80 * 1.3) * 4,
              frame: (Math.floor(t * 6) % BIRD_CONFIG.sets[b.set].frames)
            };
          })
          .filter(b => {
            const out = (b.dir === 1 && b.x > gameAreaWidth + 60) || (b.dir === -1 && b.x < -60);
            return !out;
          });
      });
      
      // Update small birds
      setSmallBirds(list => {
        return list
          .map(b => {
            const t = (frameRef.current / 60) + b.phase;
            const dx = (gameAreaWidth / b.speed) * (1000 / 60);
            const newX = b.x + (b.dir === 1 ? dx : -dx);
            return {
              ...b,
              x: newX,
              y: b.yBase + Math.sin(b.phase + newX / 60) * b.amp, // smaller wave pattern
              rot: Math.sin(b.phase + newX / 60 * 1.3) * 2, // smaller rotation
              frame: (Math.floor(t * 8) % SMALL_BIRD_CONFIG.sets[b.set].frames) // faster animation
            };
          })
          .filter(b => {
            const out = (b.dir === 1 && b.x > gameAreaWidth + 30) || (b.dir === -1 && b.x < -30);
            return !out;
          });
      });
      
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // spawn one bird from left, then after 5s one from right, then wait for both to leave before repeating
    let spawnState = { phase: 'idle', timeout: null };
    function startCycle() {
      setBirds([]); // clear any leftover birds
      spawnState.phase = 'left';
      setBirds(list => { spawnOne(1); return list; });
      spawnState.timeout = setTimeout(() => {
        spawnState.phase = 'right';
        setBirds(list => { spawnOne(-1); return list; });
      }, 5000);
    }
    function checkAndRestart() {
      setBirds(list => {
        if (list.length === 0 && spawnState.phase === 'right') {
          // both birds have left, start next cycle
          startCycle();
        }
        return list;
      });
    }
    startCycle();
    const observer = setInterval(checkAndRestart, 500);
    
    // Small bird spawning with different timing
    let smallBirdSpawnTime = 0;
    const smallBirdSpawnInterval = setInterval(() => {
      if (!active) return;
      
      // Random chance to spawn a group (30% chance)
      if (Math.random() < 0.3) {
        // Spawn 3-20 small birds in a group
        const groupSize = Math.floor(Math.random() * 18) + 3; // 3-20 birds
        const direction = Math.random() < 0.5 ? 1 : -1;
        const birdType = Math.floor(Math.random() * SMALL_BIRD_CONFIG.sets.length); // Same type for group
        const baseHeight = rand(...SMALL_BIRD_CONFIG.yRange); // Same base height for group
        
        for (let i = 0; i < groupSize; i++) {
          setTimeout(() => {
            spawnSmallOne(direction, birdType, baseHeight + (Math.random() - 0.5) * 20); // ±10px height variation
          }, i * 100); // 100ms apart within the group
        }
      } else {
        // Single bird spawn (70% chance)
        spawnSmallOne();
      }
      
      // Random interval between spawns (20-40 seconds)
      const nextInterval = 20000 + Math.random() * 20000;
      setTimeout(() => {
        smallBirdSpawnTime = Date.now();
      }, nextInterval);
    }, 20000 + Math.random() * 20000); // Initial spawn after 20-40 seconds
    return () => { 
      cancelAnimationFrame(raf); 
      clearInterval(observer); 
      clearInterval(smallBirdSpawnInterval);
      if (spawnState.timeout) clearTimeout(spawnState.timeout); 
    };
  }, [active, gameAreaWidth]);

  // --- 5-minute flock event ---
  useEffect(() => {
    if (!active) return;
    const event = setInterval(() => {
      for (let i = 0; i < 100; i++) {
        spawnOne(Math.random() < 0.5 ? 1 : -1);
      }
      // Special event: play all SFX in rapid succession (random/chaotic)
      const birdSfxList = [
        '/birds/sfx/bird1.mp3',
        '/birds/sfx/bird2.mp3',
        '/birds/sfx/bird3.mp3',
        '/birds/sfx/bird4.mp3',
        '/birds/sfx/bird5.mp3',
        '/birds/sfx/bird6.mp3',
      ];
      // Play all bird SFX in rapid succession using new Audio() for each
      birdSfxList.forEach((sfx, idx) => {
        setTimeout(() => {
          const audio = new Audio(process.env.PUBLIC_URL + sfx);
          audio.volume = 1.0;
          audio.play().catch(() => {});
        }, idx * 30); // 30ms apart
      });
      // Trigger fish frenzy event
      if (window.triggerFishFrenzy) window.triggerFishFrenzy();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(event);
  }, [active, gameAreaWidth]);

  // Add a global function to trigger the 100-bird flock event immediately
  useEffect(() => {
    window.triggerBirdFrenzy = () => {
      for (let i = 0; i < 100; i++) {
        spawnOne(Math.random() < 0.5 ? 1 : -1);
      }
      // Also spawn some small birds in the frenzy
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          spawnSmallOne(Math.random() < 0.5 ? 1 : -1);
        }, i * 50);
      }
      // Play all bird SFX in rapid succession using new Audio() for each
      const birdSfxList = [
        '/birds/sfx/bird1.mp3',
        '/birds/sfx/bird2.mp3',
        '/birds/sfx/bird3.mp3',
        '/birds/sfx/bird4.mp3',
        '/birds/sfx/bird5.mp3',
        '/birds/sfx/bird6.mp3',
      ];
      birdSfxList.forEach((sfx, idx) => {
        setTimeout(() => {
          const audio = new Audio(process.env.PUBLIC_URL + sfx);
          audio.volume = 1.0;
          audio.play().catch(() => {});
        }, idx * 30);
      });
    };
    return () => { window.triggerBirdFrenzy = undefined; };
  }, [active, gameAreaWidth]);

  return [...birds, ...smallBirds];
} 