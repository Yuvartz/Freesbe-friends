import { useEffect, useState } from 'react';

export default function FishJump({ x, y, scale = 1, type = 'fish1', direction = 1, onDone }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    // advance a frame ~8 fps
    const id = setInterval(() => {
      setFrame(f => f + 1);
    }, 120); // slower: ~8fps
    return () => clearInterval(id); // cleans on unmount
  }, []); // ← NO deps = runs once, even in Strict Mode

  useEffect(() => {
    if (frame >= 9) onDone?.(); // fire once, then parent removes us
  }, [frame, onDone]);

  if (frame >= 9) return null;

  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/fish/${type}/${type}_${String(frame + 1).padStart(2, '0')}.png`
      }
      alt="fish"
      style={{
        position: 'absolute',
        left: x + (frame / 8) * 20 * direction,
        top: y,
        width: 70 * scale * 0.7,
        height: 46 * scale * 0.7,
        pointerEvents: 'none',
        zIndex: 10001,
        imageRendering: 'pixelated',
        transform: `scaleX(${direction})`,
      }}
    />
  );
} 