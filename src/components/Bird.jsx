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
};

export default function Bird({ bird }) {
  const setInfo = BIRD_CONFIG.sets[bird.set];
  const idx = String(bird.frame + 1).padStart(2, '0');
  const src = process.env.PUBLIC_URL + `${setInfo.sheet}${idx}.png`;

  return (
    <img
      src={src}
      alt="bird"
      style={{
        position: 'absolute',
        left: bird.x,
        bottom: bird.y,
        width: 45 * bird.scale,
        height: 45 * bird.scale,
        transform: `scaleX(${bird.dir}) rotate(${bird.rot}deg)`,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
        zIndex: bird.isSmall ? 11 : 10
      }}
    />
  );
} 