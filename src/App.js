import React, { useRef, useEffect, useState, useCallback } from 'react';
import './App.css';
import Boat from './Boat';
import FishJump from './FishJump';
import useBirds from './hooks/useBirds';
import Bird from './components/Bird';

// ──────────────────────────────── CONFIG ────────────────────────────────
const bgUrl      = process.env.PUBLIC_URL + '/Backgroundlevel1HD.png';
const musicUrl   = process.env.PUBLIC_URL + '/Calm Waves Sandy Coast 140428 0181 by klankbeeld Id-236009.mp3';
const birdsUrl   = process.env.PUBLIC_URL + '/Birds, Sea, Seagulls, Halmstad, Sweden SND61664.mp3';
const swooshUrl  = process.env.PUBLIC_URL + '/Light Slow Swoosh by Mikes-MultiMedia Id-349698.mp3';
const successUrl = process.env.PUBLIC_URL + '/Games, Video, Retro, Beeps, Success SND7059.mp3';
const artikUrl   = process.env.PUBLIC_URL + '/haloartik.mp3';
const beachUrl   = process.env.PUBLIC_URL + '/beach1.mp3';

// Disc flight + timing
const FLIGHT_TIME      = 2800;   // ms
const POST_CATCH_DELAY = 600;    // ms
const MISS_DELAY       = 2000;   // ms
const SUCCESS_DELAY    = 1000;   // ms
const RETURN_TIME      = 600;    // ms – tune as you like

// Player anchors (viewport-relative)
const getPositionA = () => ({
  x: window.innerWidth * 0.0938,
  y: window.innerHeight * 0.08
});  // Player‑1 hand
const getPositionB = () => ({
  x: window.innerWidth * 0.8305,
  y: window.innerHeight * 0.08
});  // Player‑2 hand

// Vertical offsets
const HIGH_OFFSET = 100;
const LOW_OFFSET  = -60;

// Arc height range (adds variation)
const ARC_HEIGHT_RANGE = [60, 120];

// Idle float
const IDLE_FLOAT_ANIM = 'frisbee-float 1.2s ease-in-out infinite';

// Hold time on last animation frame (separate for player and frisbee)
const HOLD_LAST_FRAME_PLAYER = 1000; // ms
const HOLD_LAST_FRAME_FRISBEE = 0; // ms (change if you want frisbee to wait)

export default function App() {
  // ───────────────────────── refs & state ─────────────────────────
  const audioRef   = useRef(null);
  const birdsRef   = useRef(null);
  const swooshRef  = useRef(null);
  const successRef = useRef(null);
  const artikRef   = useRef(null);
  const beachRef   = useRef(null);
  const frisbeeAnimRef = useRef(null);
  const flightStartRef  = useRef(getPositionA());
  const flightEndRef    = useRef(getPositionB());
  const flightArcDirRef = useRef(1);
  const flightArcAmpRef = useRef(ARC_HEIGHT_RANGE[0]);

  const throwChoiceRef = useRef(null);
  const catchChoiceRef = useRef(null);

  const frisbeeRef = useRef(null);
  const shadowRef = useRef(null);

  // Add a ref to track if early catchdown animation has been triggered
  const earlyCatchdownTriggeredRef = useRef(false);

  // Ref to ensure catch SFX only plays once per throw
  const catchSfxPlayedRef = useRef(false);

  // Game state
  const [menuVisible,   setMenuVisible]   = useState(false);
  const [gameStarted,   setGameStarted]   = useState(false);
  const [phase,         setPhase]         = useState('throw'); // 'throw' | 'flight' | 'catch' | 'result'
  const [thrower,       setThrower]       = useState(1);
  const [waiting,       setWaiting]       = useState(false);
  const [throwChoice,   setThrowChoice]   = useState(null);
  const [catchChoice,   setCatchChoice]   = useState(null);
  const [frisbeePos,    setFrisbeePos]    = useState(0);
  const frisbeePosRef = useRef(0);
  const [catchEnabled,  setCatchEnabled]  = useState(false);
  const [result,        setResult]        = useState(null);   // 'success' | 'fail'
  const [catcherAnim,   setCatcherAnim]   = useState('');
  const [throwCount,    setThrowCount]    = useState(0);
  const [catchStreak,   setCatchStreak]   = useState(0);
  const [specialScene,  setSpecialScene]  = useState(false);
  const [bgHue,         setBgHue]         = useState(0);
  const [artikPos,      setArtikPos]      = useState(0);
  const [artikFrame,    setArtikFrame]    = useState(1);
  const [artikDirection,setArtikDirection]= useState('right');

  // Player animation tracking
  const [p1AnimType,    setP1AnimType]    = useState('idle');
  const [p2AnimType,    setP2AnimType]    = useState('idle');
  const [p1AnimFrame,   setP1AnimFrame]   = useState(1);
  const [p2AnimFrame,   setP2AnimFrame]   = useState(1);
  const [p1AnimPlaying, setP1AnimPlaying] = useState(false);
  const [p2AnimPlaying, setP2AnimPlaying] = useState(false);

  // UI helpers
  const [startPressed,     setStartPressed]     = useState(false);
  const [highlightCounter, setHighlightCounter] = useState(false);
  const [allowBeachResume, setAllowBeachResume] = useState(true);
  const [stickToCatcher,   setStickToCatcher]   = useState(false);
  const [successMessage,   setSuccessMessage]   = useState('');

  // Add swish filenames (update with your actual .mp3 filenames)
  const swishList = [
    "Designed, Stinger, Light, Metallic, Magic, Whoosh, Transition SND122944.mp3",
    "Light Slow Swoosh by Mikes-MultiMedia Id-349698.mp3",
    "Swooshes, Whoosh, Ambient, Light 02 SND81818.mp3",
    "Swooshes, Whoosh, Designed, Swoosh, Light SND115627 1.mp3",
    "Swooshes, Whoosh, Low, Short 02 SND11974 2.mp3",
    "Swooshes, Whoosh, Organic, Wind, Soft, Long 01 SND55374 1.mp3",
    "Swooshes, Whoosh, Organic, Wind, Soft, Normal, Debris SND55381.mp3"
  ];
  const swishAudioRef = useRef(null);
  
  // Add bird sfx refs
  const birdSfxRef = useRef(null);
  window.birdSfxRef = birdSfxRef;

  // Catch SFX
  const catchSfxRef = useRef(null);
  const catchSfxList = [
    '/SFX2/catch/catch1.mp3',
    '/SFX2/catch/catch2.mp3',
    '/SFX2/catch/catch3.mp3',
    '/SFX2/catch/catch4.mp3'
  ];

  // Throw SFX
  const throwSfxRef = useRef(null);
  const throwSfxList = [
    '/SFX2/throw/throw1.mp3',
    '/SFX2/throw/throw2.mp3',
    '/SFX2/throw/throw3.mp3',
    '/SFX2/throw/throw4.mp3'
  ];

  // Helper to fade audio
  const fadeAudio = (audio, to, duration) => {
    if (!audio) return;
    const from = audio.volume;
    const step = (to - from) / (duration / 20);
    let v = from;
    let i = 0;
    const interval = setInterval(() => {
      v += step;
      audio.volume = Math.max(0, Math.min(1, v));
      i++;
      if ((step > 0 && v >= to) || (step < 0 && v <= to) || i > duration / 20) {
        audio.volume = to;
        clearInterval(interval);
      }
    }, 20);
  };

  // Helper to check if a player is currently in catchdown
  const isPlayerInCatchdown = (player) => (player === 1 ? p1AnimType : p2AnimType) === 'catchdown';

  // Helper to animate the disc (and shadow) from one point to another
  const returnDisc = (from, to, cb, dur = 600) => {
    let t0 = null;
    const step = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      if (frisbeeRef.current) {
        frisbeeRef.current.style.left   = `${x}px`;
        frisbeeRef.current.style.bottom = `${y}px`;
      }
      if (shadowRef.current) {
        shadowRef.current.style.left    = `${x}px`;
        shadowRef.current.style.bottom  = `5px`;
      }
      p < 1 ? requestAnimationFrame(step) : cb && cb();
    };
    requestAnimationFrame(step);
  };

  // Helper: glide disc + player back
  function returnDiscAndPlayer(onDone) {
    const catcher = thrower === 1 ? 2 : 1;
    const anchor  = getAnchor(catcher);          // where the next throw starts
    const playerEl = document.querySelector(
      catcher === 1 ? '.player1-abs' : '.player2-abs'
    );

    // start + target for disc
    const startX = parseFloat(frisbeeRef.current.style.left);
    const startY = parseFloat(frisbeeRef.current.style.bottom);
    const endX   = anchor.x;
    const endY   = anchor.y;

    // same easing for player transform (only if it moved)
    const startTx =
      playerEl.style.transform.includes('translateY') ? 30 : 0; // down 30px
    const endTx   = 0;

    let t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / RETURN_TIME, 1);  // 0→1
      // linear; replace with easeOut if you prefer
      const curX = startX + (endX - startX) * p;
      const curY = startY + (endY - startY) * p;
      const curTx = startTx + (endTx - startTx) * p;

      frisbeeRef.current.style.left   = `${curX}px`;
      frisbeeRef.current.style.bottom = `${curY}px`;
      if (startTx !== 0) playerEl.style.transform = `translateY(${curTx}px)`;

      // shadow
      if (shadowRef.current) {
        shadowRef.current.style.left = `${curX}px`;
      }

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        // clean up
        playerEl.style.transform = '';     // reset
        setStickToCatcher(false);         // release disc
        if (onDone) onDone();
      }
    }
    requestAnimationFrame(step);
  }

  // ───────────────────────── helpers ─────────────────────────
  const getAnchor = (pl) => (pl === 1 ? getPositionA() : getPositionB());
  const getHighY  = (pl) => getAnchor(pl).y + HIGH_OFFSET;
  const getLowY   = (pl) => getAnchor(pl).y + LOW_OFFSET;

  const buildFlightPath = (whoThrows, heightChoice) => {
    const start = getAnchor(whoThrows);
    const target = whoThrows === 1 ? 2 : 1;
    const end = { ...getAnchor(target) };
    if (heightChoice === 'high') end.y = getHighY(target);
    if (heightChoice === 'low')  end.y = getLowY(target);
    return { start, end };
  };

  const getPlayerImage = (player, animType, frame) => {
    const base = process.env.PUBLIC_URL + `/player${player}${player === 2 ? 'animations' : 'animation'}`;
    const path = player === 1
      ? (animType === 'start' ? '/start' :
         animType === 'win'   ? '/win'   :
         animType === 'lose'  ? '/lose'  :
         animType === 'throw' ? '/throw' :
         animType === 'catchup'      ? '/catchup' :
         animType === 'catchmiddle'  ? '/catchmiddle' :
         animType === 'catchdown'    ? '/catchdownfix' : '/stand')
      : (animType === 'start' ? '/start' :
         animType === 'win'   ? '/win'   :
         animType === 'lose'  ? '/lose'  :
         animType === 'throw' ? '/throw' :
         animType === 'catchup'     ? '/catchup' :
         animType === 'catchmiddle' ? '/catchmiddle' :
         animType === 'catchdown'   ? '/catchdown' : '/stand');
    return `${base}${path}/image_${frame}.png`;
  };

  // ───────────────────────── sprite driver ─────────────────────────
  const playAnimation = (pl, animType, duration = 2000, skipIdle = false) => {
    const setType   = pl === 1 ? setP1AnimType    : setP2AnimType;
    const setFrame  = pl === 1 ? setP1AnimFrame   : setP2AnimFrame;
    const setActive = pl === 1 ? setP1AnimPlaying : setP2AnimPlaying;

    setType(animType);
    setFrame(1);
    setActive(true);

    let frame = 1;
    const intv = setInterval(() => {
      frame += 1;
      if (frame > 8) {
        clearInterval(intv);
        setTimeout(() => {
          setActive(false);
          if (!skipIdle) {
            setType('idle');
            setFrame(1);
          }
          // If skipIdle, do nothing: let useEffect on phase handle reset
        }, HOLD_LAST_FRAME_PLAYER);
      } else {
        setFrame(frame);
      }
    }, duration / 8);
  };

  // ───────────────────────── audio helpers ─────────────────────────
  const playLoop = (ref, vol) => {
    if (!ref.current) return;
    ref.current.volume = vol;
    ref.current.loop = true;
    ref.current.play().catch(() => {});
  };

  const playOnce = (ref, vol) => {
    if (!ref.current) return;
    ref.current.volume = vol;
    ref.current.currentTime = 0;
    ref.current.play().catch(() => {});
  };

  // ───────────────────────── menu handlers ─────────────────────────
  const handleBigStart = () => {
    setMenuVisible(true);
    playLoop(audioRef, 0.5);
    playLoop(birdsRef, 0.3);
  };

  const handleStartGame = () => {
    setGameStarted(true);
    setPhase('throw');
    setThrower(1);
    setWaiting(false);
    setThrowChoice(null);
    setCatchChoice(null);
    setResult(null);
    setFrisbeePos(0);
    frisbeePosRef.current = 0;
    setCatchEnabled(false);
    setThrowCount(0);
    setCatchStreak(0);
    flightStartRef.current = getPositionA();
    flightEndRef.current   = getPositionB();
    playLoop(beachRef, 0.4);
    playAnimation(1, 'start', 2000);
    playAnimation(2, 'start', 2000);
  };

  // ───────────────────────── throw input ─────────────────────────
  const handleThrow = (choice) => {
    setThrowChoice(choice);
    throwChoiceRef.current = choice;
    setThrowCount(prev => prev + 1);
    // Play random throw SFX at the start of the throw
    const sfx = throwSfxList[Math.floor(Math.random() * throwSfxList.length)];
    if (throwSfxRef.current) {
      throwSfxRef.current.src = process.env.PUBLIC_URL + sfx;
      throwSfxRef.current.currentTime = 0;
      throwSfxRef.current.volume = 1.0;
      throwSfxRef.current.play().catch(() => {});
    }
    playAnimation(thrower, 'throw', 1000);

    // Flight path
    const { start, end } = buildFlightPath(thrower, choice);
    flightStartRef.current = start;
    flightEndRef.current   = end;
    flightArcDirRef.current = Math.random() < 0.5 ? 1 : -1;
    flightArcAmpRef.current = ARC_HEIGHT_RANGE[0] + Math.random() * (ARC_HEIGHT_RANGE[1] - ARC_HEIGHT_RANGE[0]);

    // Swish logic
    const swishFile = swishList[Math.floor(Math.random() * swishList.length)];
    const swishUrl = process.env.PUBLIC_URL + '/swishes/' + swishFile;
    setTimeout(() => {
      if (swishAudioRef.current) {
        swishAudioRef.current.src = swishUrl;
        swishAudioRef.current.volume = 1.0;
        swishAudioRef.current.currentTime = 0;
        swishAudioRef.current.play().catch(() => {});
      }
      fadeAudio(audioRef.current, 0.35, 180);
      fadeAudio(birdsRef.current, 0.18, 180);
      fadeAudio(beachRef.current, 0.18, 180);
      setTimeout(() => {
        fadeAudio(audioRef.current, 0.5, 120);
        fadeAudio(birdsRef.current, 0.3, 120);
        fadeAudio(beachRef.current, 0.4, 120);
      }, 600);
    }, 80); // Play swish/fade shortly after throw starts

    // Enter flight phase
    setPhase('flight');
    setCatchEnabled(true);
    setCatchChoice(null);
    catchChoiceRef.current = null;

    // Reset early catchdown trigger only
    earlyCatchdownTriggeredRef.current = false;

    // Animation loop
    if (frisbeeAnimRef.current) cancelAnimationFrame(frisbeeAnimRef.current);
    let startTime = null;
    catchSfxPlayedRef.current = false; // Reset at start of throw
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / FLIGHT_TIME, 1);
      frisbeePosRef.current = progress;
      // Direct DOM update for frisbee
      const start = flightStartRef.current;
      const end   = flightEndRef.current;
      let x = start.x + (end.x - start.x) * progress;
      let y = start.y + (end.y - start.y) * progress;
      y += -flightArcAmpRef.current * Math.sin(Math.PI * progress) * flightArcDirRef.current;
      if (frisbeeRef.current) {
        frisbeeRef.current.style.left = x + 'px';
        frisbeeRef.current.style.bottom = y + 'px';
      }
      // Direct DOM update for shadow
      if (shadowRef.current) {
        const shadowProgress = Math.max(0, Math.min(1, progress - 0.04));
        const shadowX = start.x + (end.x - start.x) * shadowProgress;
        const groundY = 5;
        const arc = Math.sin(Math.PI * shadowProgress);
        const scale = 1 - 0.35 * arc;
        const opacity = 0.4 * scale;
        shadowRef.current.style.left = shadowX + 'px';
        shadowRef.current.style.bottom = groundY + 'px';
        shadowRef.current.style.transform = `scale(${scale})`;
        shadowRef.current.style.opacity = opacity;
      }
      // Early catchdown animation and crouch movement (fix: freeze on crouched frame)
      if (
        !earlyCatchdownTriggeredRef.current &&
        progress > 0.15 &&
        phase === 'flight' &&
        (catchChoice === 'down' || catchChoiceRef.current === 'down')
      ) {
        earlyCatchdownTriggeredRef.current = true;
        const catcher = thrower === 1 ? 2 : 1;
        setCatcherAnim('crouch'); // adds .catcher-crouch class
        if (catcher === 1) { setP1AnimType('catchdown'); setP1AnimFrame(8); }
        else               { setP2AnimType('catchdown'); setP2AnimFrame(8); }
      }
      // Remove early catchdown trigger
      if (progress < 1) {
        frisbeeAnimRef.current = requestAnimationFrame(animate);
      } else {
        // Play catch SFX at the exact moment of catch (only once)
        if (!catchSfxPlayedRef.current) {
          catchSfxPlayedRef.current = true;
          // Determine if it's a successful catch
          const mapping = { high: 'up', mid: 'mid', low: 'down' };
          const finalCatch = catchChoiceRef.current || 'mid';
          const success = mapping[throwChoiceRef.current] === finalCatch;
          if (success) {
            const sfx = catchSfxList[Math.floor(Math.random() * catchSfxList.length)];
            if (catchSfxRef.current) {
              catchSfxRef.current.src = process.env.PUBLIC_URL + sfx;
              catchSfxRef.current.currentTime = 0;
              catchSfxRef.current.volume = 1.0;
              catchSfxRef.current.play().catch(() => {});
            }
          }
        }
        onDiscArrived();
      }
    };
    frisbeeAnimRef.current = requestAnimationFrame(animate);
  };

  // ───────────────────────── catch input ─────────────────────────
  const handleCatch = (choice) => {
    if (catchChoiceRef.current) return; // first key wins
    catchChoiceRef.current = choice;
    setCatchChoice(choice);
    setCatchEnabled(false);
  };

  // ───────────────────────── disc arrival ─────────────────────────
  const onDiscArrived = () => {
    setCatchEnabled(false);
    setPhase('catch');

    const finalCatch = catchChoiceRef.current || 'mid';
    let anim = '';
    if (finalCatch === 'up')   anim = 'jump';
    if (finalCatch === 'mid')  anim = 'hop';
    if (finalCatch === 'down') anim = 'crouch';
    setCatcherAnim(anim);

    // Stick frisbee to catcher
    setStickToCatcher(true);

    // Wait for animation + hold time (frisbee uses its own hold time)
    const ANIM_TIME = anim === 'jump' ? 800 : anim === 'hop' ? 300 : anim === 'crouch' ? 700 : 0;
    const TOTAL_WAIT = ANIM_TIME + Math.max(0, HOLD_LAST_FRAME_FRISBEE - 500);

    // After frisbee hold, trigger catch animation
    setTimeout(() => {
      // Start catch animation only if not already in catchdown
      const catcher = thrower === 1 ? 2 : 1;
      let catchAnimType = 'catchmiddle';
      if (finalCatch === 'up') catchAnimType = 'catchup';
      if (finalCatch === 'down') {
        if (!isPlayerInCatchdown(catcher)) {
          playAnimation(catcher, 'catchdown', 800, true);   // adds class automatically via setCatcherAnim
        } else {
          // Already crouched – just ensure frame 8
          if (catcher === 1) setP1AnimFrame(8);
          else setP2AnimFrame(8);
        }
      } else {
        playAnimation(catcher, catchAnimType, 800, false);
      }
      // Continue with rest of logic after player hold
      setTimeout(() => {
        // For catchdown, do NOT reset animation or transform here. Only do it at the start of the next throw.
        if (finalCatch !== 'down') {
          setCatcherAnim('');
        }
        // Define success in this scope
        const mapping = { high: 'up', mid: 'mid', low: 'down' };
        const success = mapping[throwChoiceRef.current] === finalCatch;
        // (SFX now played in animation loop at catch moment)
        setResult(success ? 'success' : 'fail');
        
        // Set random success message if successful
        if (success) {
          const messages = ['Good catch!', 'Nice!', 'Wa wa wi wa!', 'Salamtak!', 'Sweet!'];
          setSuccessMessage(messages[Math.floor(Math.random() * messages.length)]);
        }
        setPhase('result');
        setStickToCatcher(false);

        if (success) {
          playAnimation(catcher, 'win', 1500);
          const newStreak = catchStreak + 1;
          setCatchStreak(newStreak);

          if (newStreak === 5) {
            setArtikDirection('right');
            triggerSpecialScene();
          } else if (newStreak % 5 === 0) {
            setArtikDirection(prev => (prev === 'right' ? 'left' : 'right'));
            triggerSpecialScene();
          }
        } else {
          playAnimation(catcher, 'lose', 1500);
          setCatchStreak(0);
        }

        // Next round: glide disc+player back only on success
        if (success) {
          returnDiscAndPlayer(() => {
            setWaiting(true);               // show “Next round …”
            setTimeout(startNextRound, SUCCESS_DELAY);
          });
        } else {
          // miss – keep old behaviour
          setWaiting(true);
          setTimeout(startNextRound, MISS_DELAY);
        }
      }, HOLD_LAST_FRAME_PLAYER);
    }, Math.max(0, HOLD_LAST_FRAME_FRISBEE - 500));
  };

  // ───────────────────────── next round prep ─────────────────────────
  const startNextRound = () => {
    setWaiting(false);
    const nextThrower = thrower === 1 ? 2 : 1;
    setThrower(nextThrower);

    const next = getAnchor(nextThrower);
    const { start, end } = buildFlightPath(nextThrower, null);

    // Always snap instantly to the throw anchor for all catch types
    flightStartRef.current = next;
    flightEndRef.current = end;
    setThrowChoice(null);
    throwChoiceRef.current = null;
    setCatchChoice(null);
    catchChoiceRef.current = null;
    setResult(null);
    setFrisbeePos(0);
    frisbeePosRef.current = 0;
    setCatchEnabled(false);
    setPhase('throw');
    setThrowCount(prev => prev + 1);
  };

  // ───────────────────────── music helpers ─────────────────────────
  const ensureBackgroundMusic = () => {
    audioRef.current?.paused && playLoop(audioRef, 0.5);
    birdsRef.current?.paused && playLoop(birdsRef, 0.3);
    beachRef.current?.paused && !specialScene && allowBeachResume && playLoop(beachRef, 0.4);
  };

  // ───────────────────────── special scene ─────────────────────────
  const triggerSpecialScene = () => {
    setArtikPos(0); // Ensure Artik starts at left edge
    setSpecialScene(true);
    setAllowBeachResume(false);

    playOnce(successRef, 0.6);

    // Pause beach music immediately
    if (beachRef.current) {
      beachRef.current.pause();
      beachRef.current.currentTime = 0;
    }

    // Each player does 3 random animations in sequence
    const animTypes = ['win', 'throw', 'catchup', 'catchmiddle', 'catchdown', 'lose'];
    function playRandomSequence(player) {
      const seq = Array.from({length: 2}, () => animTypes[Math.floor(Math.random() * animTypes.length)]);
      let i = 0;
      function next() {
        if (i < seq.length) {
          playAnimation(player, seq[i], 900);
          setTimeout(next, 900 + HOLD_LAST_FRAME_PLAYER);
          i++;
        }
      }
      next();
    }
    playRandomSequence(1);
    playRandomSequence(2);

    // Background hue shift
    let hue = 0;
    const hueInterval = setInterval(() => {
      hue = (hue + 1) % 360;
      setBgHue(hue);
    }, 100);

    // Artik animation (now left to right)
    setArtikDirection('right'); // Always walk right for special scene
    let pos = 0; // Start on the left
    let frame = 1;
    const artikInterval = setInterval(() => {
      pos += 1/150;
      frame = (frame % 8) + 1;

      setArtikPos(Math.max(0, Math.min(pos, 1)));
      setArtikFrame(frame);

      if (pos >= 1) {
        clearInterval(artikInterval);
        clearInterval(hueInterval);
        setSpecialScene(false);
        setBgHue(0);
        setArtikPos(1);
        setArtikFrame(1);
        setAllowBeachResume(true);
        // Reset catch streak after a short delay so the bar can count every five catches
        setTimeout(() => setCatchStreak(0), 1200);
      }
    }, 100);

    // Play Artik music and resume beach music only after Artik is done
    if (artikRef.current) {
      playOnce(artikRef, 0.8);
      artikRef.current.onended = () => {
        if (beachRef.current) {
          beachRef.current.volume = 0.4;
          beachRef.current.play().catch(() => {});
        }
      };
    }
  };

  // ───────────────────────── scroll prevention ─────────────────────────
  useEffect(() => {
    // Prevent scrolling
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
      }
    });
    
    return () => {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // ───────────────────────── cleanup ─────────────────────────
  useEffect(() => () => {
    frisbeeAnimRef.current && cancelAnimationFrame(frisbeeAnimRef.current);
  }, []);

  // At the start of a new throw, reset both player transforms and animation state
  useEffect(() => {
    if (phase === 'throw') {
      document.querySelectorAll('.player1-abs, .player2-abs').forEach(el => {
        el.classList.remove('catcher-crouch');
      });
      setP1AnimType('idle');
      setP2AnimType('idle');
      setP1AnimFrame(1);
      setP2AnimFrame(1);
    }
  }, [phase]);

  // ───────────────────────── keyboard shortcuts ─────────────────────────
  useEffect(() => {
    if (!gameStarted) return;
    const onKey = (e) => {
      if (phase === 'throw' && !waiting) {
        if (e.key === 'ArrowUp')    handleThrow('high');
        if (e.key === 'ArrowRight') handleThrow('mid');
        if (e.key === 'ArrowDown')  handleThrow('low');
      } else if (phase === 'flight' && catchEnabled && !waiting) {
        if (e.key === 'ArrowUp')    handleCatch('up');
        if (e.key === 'ArrowRight') handleCatch('mid');
        if (e.key === 'ArrowDown')  handleCatch('down');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameStarted, phase, catchEnabled, waiting]);

  // ───────────────────────── music monitoring ─────────────────────────
  useEffect(() => {
    if (!gameStarted) return;
    const musicCheckInterval = setInterval(ensureBackgroundMusic, 5000);
    return () => clearInterval(musicCheckInterval);
  }, [gameStarted]);

  useEffect(() => {
    if (!specialScene) return;
    const specialMusicInterval = setInterval(() => {
      audioRef.current?.paused && playLoop(audioRef, 0.5);
      birdsRef.current?.paused && playLoop(birdsRef, 0.3);
    }, 1000);
    return () => clearInterval(specialMusicInterval);
  }, [specialScene]);

  // Wind system UI state
  const windDirections = ['N', 'E', 'S', 'W'];
  const [windDir, setWindDir] = useState(windDirections[Math.floor(Math.random() * 4)]);
  const [windStrength, setWindStrength] = useState(Math.floor(Math.random() * 6) + 1); // 1-6
  const [flagWave, setFlagWave] = useState(0);
  useEffect(() => {
    if (!gameStarted) return;
    let t = 0;
    const interval = setInterval(() => {
      t += 0.1;
      setFlagWave(Math.sin(t * windStrength * 1.5));
    }, 40);
    return () => clearInterval(interval);
  }, [gameStarted, windStrength]);

  // Bird animation state (cycle through bird1-6 every 20s, each bird takes 12s to cross)
  // Bird system using useBirds hook
  const birds = useBirds(gameStarted);


  // Boat animation useEffect (proper implementation)
  useEffect(() => {
    if (!gameStarted) return;
    
    // Boat spawning logic
    const spawnTick = setInterval(() => {
      const now = Date.now();
      
      BOAT_TYPES.forEach(def => {
        const { id, startDelay } = def;
        
        // Skip until startDelay has passed
        if (now < startDelay + boatLaunchTime.current) return;
        
        // Skip if already on screen
        if (activeBoatRef.current[id]) return;
        
        // Skip if last spawn < 60 seconds ago
        if (lastBoatSpawnRef.current[id] && now - lastBoatSpawnRef.current[id] < 60000) return;
        
        // Create the boat
        const phase = Math.random() * Math.PI * 2;
        setBoats(b => [
          ...b,
          {
            key: `${id}-${now}`,
            id,
            phase,
            yBase: def.yOffset,
            ...def,
            x: def.dir === 1 ? -160 : window.innerWidth + 160,
            frame: 1
          }
        ]);
        console.log('[boat spawn]', id);
        lastBoatSpawnRef.current[id] = now;
        activeBoatRef.current[id] = true;
      });
    }, 1000);
    
    // Boat movement and animation
    let raf;
    const step = () => {
      boatFrameRef.current += 1;
      setBoats(prev =>
        prev
          .map(b => {
            const t = (boatFrameRef.current / 60) + b.phase;
            const newX = b.x + b.speed * (b.dir === 1 ? 1 : -1) * 16;
            const out = b.dir === 1 ? newX > window.innerWidth + 160
                                   : newX < -160;
            
            if (out) {
              console.log('[boat exit]', b.id);
              activeBoatRef.current[b.id] = false;
            }
            
            return {
              ...b,
              x: newX,
              y: b.yBase + Math.sin(t * 2) * b.bobAmp,
              rot: Math.sin(t * 1.3) * 4,
              frame: ((Math.floor(t * 6) % 9) || 9)
            };
          })
          .filter(b => !(b.dir === 1 ? b.x > window.innerWidth + 160
                                        : b.x < -160))
      );
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    
    return () => {
      clearInterval(spawnTick);
      cancelAnimationFrame(raf);
    };
  }, [gameStarted]);

  // Fish zone definition (moved before useEffects that use it)
  const [fishZone] = useState({
    left: 0,
    top: 346,
    width: 1200,
    height: 145,
  });
  const [fishJumps, setFishJumps] = useState([]);

  // Bird zone definition
  const [birdZone] = useState({
    left: 0,
    bottom: 270,
    width: 1200,
    height: 260,
  });

  // Improved fish spawning system (based on reference)
  useEffect(() => {
    if (!gameStarted) return;
    let running = true;
    
    function spawnFish() {
      if (!running) return;
      
      // Random chance for burst spawning (20% chance)
      if (Math.random() < 0.2) {
        // Spawn 2-5 fish in quick succession
        const burstCount = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < burstCount; i++) {
          setTimeout(() => {
            if (!running) return;
            const x = fishZone.left + Math.random() * (fishZone.width - 120);
            const y = fishZone.top + Math.random() * (fishZone.height - 80);
            const relY = (y - fishZone.top) / (fishZone.height - 80);
            const scale = 0.3 + 0.9 * relY;
            const types = ['fish1', 'fish2', 'fish3', 'fish4'];
            const type = types[Math.floor(Math.random() * types.length)];
            const direction = Math.random() < 0.5 ? 1 : -1;
            const id = Math.random().toString(36).slice(2);
            setFishJumps(fj => [...fj, { x, y, scale, type, id, direction }]);
          }, i * 300); // 300ms apart in burst
        }
        setTimeout(spawnFish, 2000 + Math.random() * 3000); // Longer pause after burst
      } else {
        // Single fish spawn
        const x = fishZone.left + Math.random() * (fishZone.width - 120);
        const y = fishZone.top + Math.random() * (fishZone.height - 80);
        const relY = (y - fishZone.top) / (fishZone.height - 80);
        const scale = 0.3 + 0.9 * relY;
        const types = ['fish1', 'fish2', 'fish3', 'fish4'];
        const type = types[Math.floor(Math.random() * types.length)];
        const direction = Math.random() < 0.5 ? 1 : -1;
        const id = Math.random().toString(36).slice(2);
        setFishJumps(fj => [...fj, { x, y, scale, type, id, direction }]);
        setTimeout(spawnFish, 800 + Math.random() * 2000); // Quick single spawns: 0.8-2.8 seconds
      }
    }
    spawnFish();
    return () => { running = false; };
  }, [gameStarted, fishZone]);

  // Fish frenzy function (for testing)
  useEffect(() => {
    window.triggerFishFrenzy = () => {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const x = fishZone.left + Math.random() * (fishZone.width - 120);
          const y = fishZone.top + Math.random() * (fishZone.height - 80);
          const relY = (y - fishZone.top) / (fishZone.height - 80);
          const scale = 0.3 + 0.9 * relY;
          const types = ['fish1', 'fish2', 'fish3', 'fish4'];
          const type = types[Math.floor(Math.random() * types.length)];
          const direction = Math.random() < 0.5 ? 1 : -1; // Random direction
          const id = Math.random().toString(36).slice(2);
          setFishJumps(fj => [...fj, { x, y, scale, type, id, direction }]);
        }, Math.random() * 5000);
      }
    };
    return () => { window.triggerFishFrenzy = undefined; };
  }, [fishZone]);

  const handleFishDone = useCallback(
    id => setFishJumps(list => list.filter(f => f.id !== id)),
    []
  );

  // Add a function to trigger both frenzies for manual testing
  function triggerFrenzy() {
    if (window.triggerFishFrenzy) window.triggerFishFrenzy();
    if (window.triggerBirdFrenzy) window.triggerBirdFrenzy();
  }



  // Boat animation state (proper implementation based on reference)
  const BOAT_TYPES = [
    { id: 'boat1', dir: 1, folder: 'boat1', bobAmp: 3, scale: 0.612, speed: 0.01, yOffset: 47, startDelay: 0 },
    { id: 'boat2', dir: -1, folder: 'boat2', bobAmp: 6, scale: 0.51, speed: 0.01, yOffset: 106, startDelay: 20000 },
    { id: 'boat3', dir: 1, folder: 'boat3', bobAmp: 3, scale: 0.85, speed: 0.01, yOffset: 75, startDelay: 40000 }
  ];
  const [boats, setBoats] = useState([]);
  const boatFrameRef = useRef(0);
  const lastBoatSpawnRef = useRef({});
  const activeBoatRef = useRef({});
  const boatLaunchTime = useRef(Date.now());

  // ───────────────────────── frisbee style ─────────────────────────
  const getFrisbeeStyle = () => {
    const start = flightStartRef.current;
    const end   = flightEndRef.current;

    let { x, y } = phase === 'result'
      ? end
      : {
          x: start.x + (end.x - start.x) * frisbeePos,
          y: start.y + (end.y - start.y) * frisbeePos,
        };

    // Parabolic arc
    y += -flightArcAmpRef.current * Math.sin(Math.PI * frisbeePos) * flightArcDirRef.current;

    return {
      position: 'absolute',
      left: x,
      bottom: y,
      width: 76.5,
      height: 'auto',
      imageRendering: 'pixelated',
      zIndex: 20,
      transition: phase === 'throw' ? 'none' : 'left 0.1s linear, bottom 0.1s linear',
      animation: phase === 'throw' ? IDLE_FLOAT_ANIM : 'none',
    };
  };

  // Dynamic ground shadow that shrinks at the arc peak
  const getFrisbeeShadowStyle = () => {
    const start = flightStartRef.current;
    const end   = flightEndRef.current;

    const shadowProgress = Math.max(0, Math.min(1, frisbeePos - 0.04));
    const x = start.x + (end.x - start.x) * shadowProgress;
    const groundY = 5;                                       // near ground line

    // arc goes 0-1-0 (highest in mid-flight)
    const arc      = Math.sin(Math.PI * shadowProgress);
    const scale    = 1 - 0.35 * arc;   // 35 % smaller at peak
    const opacity  = 0.4 * scale;      // fades a bit when smaller

    return {
      left:   x,
      bottom: groundY,
      transform: `scale(${scale})`,
      opacity
    };
  };

  // ───────────────────────── render ─────────────────────────
  return (
    <div
      className="App"
      style={{
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        filter: specialScene ? `hue-rotate(${bgHue}deg)` : 'none',
      }}
    >
      <video
        src={process.env.PUBLIC_URL + '/Backgroundlevel1HD.mp4'}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      
      {/* Background Layers */}
      <img
        src={process.env.PUBLIC_URL + '/BGLAYERS/backhills.png'}
        alt="Back Hills"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
      <img
        src={process.env.PUBLIC_URL + '/BGLAYERS/island.png'}
        alt="Island"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
      <img
        src={process.env.PUBLIC_URL + '/BGLAYERS/fronttrees.png'}
        alt="Front Trees"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 25,
          pointerEvents: 'none'
        }}
      />
      <audio ref={audioRef} src={musicUrl} loop />
      <audio ref={birdsRef} src={birdsUrl} loop />
      <audio ref={swooshRef} src={swooshUrl} />
      <audio ref={successRef} src={successUrl} />
      <audio ref={artikRef} src={artikUrl} />
      <audio ref={beachRef} src={beachUrl} loop />
      <audio ref={swishAudioRef} />
      <audio ref={birdSfxRef} />
      <audio ref={catchSfxRef} />
      <audio ref={throwSfxRef} />

      {gameStarted && (
        <>
          {/* Wind Compass UI (arrow only, no flag, no S) */}
          <div style={{ position: 'fixed', top: 18, left: 18, zIndex: 99999, background: 'rgba(30,30,40,0.85)', borderRadius: 16, border: '2px solid #444', padding: 10, boxShadow: '0 2px 8px #0006', width: 80, height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 48, height: 48, marginBottom: 2 }}>
              {/* Compass circle */}
              <svg width="48" height="48" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle cx="24" cy="24" r="22" fill="#222" stroke="#aaa" strokeWidth="2" />
                {/* N/E/S/W labels */}
                <text x="24" y="12" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="monospace">N</text>
                <text x="40" y="27" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="monospace">E</text>
                <text x="24" y="44" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="monospace">S</text>
                <text x="8"  y="27" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="monospace">W</text>
              </svg>
              {/* Arrow showing wind direction */}
              <svg width="32" height="32" style={{ position: 'absolute', top: 8, left: 8, transform: `rotate(${(windDir === 'N' ? 0 : windDir === 'E' ? 90 : windDir === 'S' ? 180 : 270)}deg)` }}>
                <polygon points="16,6 22,26 16,22 10,26" fill="#7fffd4" stroke="#333" strokeWidth="1.5" />
              </svg>
            </div>
            <div style={{ color: '#fff', fontSize: 13, fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 }}>
              <span style={{ color: '#7fffd4', fontWeight: 'bold' }}>{windStrength}</span>
              <span style={{ fontSize: 10, color: '#aaa', marginLeft: 2, verticalAlign: 'middle' }}>km/h</span>
            </div>
          </div>
          
          {/* Special Event Button */}
          <button 
            onClick={() => {
              console.log('FRENZY button clicked!');
              triggerFrenzy();
            }}
            style={{
              position: 'fixed',
              top: 110,
              left: 18,
              zIndex: 100000,
              background: 'linear-gradient(#ff6b6b, #ee5a52)',
              color: '#fff',
              border: '2px solid #333',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '12px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              boxShadow: '0 2px 4px #0006',
              transition: 'transform 0.1s, box-shadow 0.1s',
              pointerEvents: 'auto'
            }}
            onMouseDown={(e) => {
              e.target.style.transform = 'translateY(1px)';
              e.target.style.boxShadow = '0 1px 2px #0006';
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px #0006';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px #0006';
            }}
          >
            🌪️ FRENZY
          </button>
          
          <div className="absolute-game-area">
          {/* Catch Streak Counter */}
          <div className="streak-panel">
            <div className="retro-panel">
              Catch Streak: {catchStreak}
              <div className="streak-bar">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      'streak-segment' +
                      (catchStreak > i ? ' filled' : '') +
                      (catchStreak === 5 ? ' celebrate' : '')
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Player 1 */}
          <img
            src={p1AnimPlaying ? getPlayerImage(1, p1AnimType, p1AnimFrame) : getPlayerImage(1, 'start', 1)}
            alt="Player 1"
            className={`player1-abs${catcherAnim && thrower === 2 ? ' catcher-' + catcherAnim : ''}`}
          />
          {/* Player 2 */}
          <img
            src={p2AnimPlaying ? getPlayerImage(2, p2AnimType, p2AnimFrame) : getPlayerImage(2, 'start', 1)}
            alt="Player 2"
            className={`player2-abs${catcherAnim && thrower === 1 ? ' catcher-' + catcherAnim : ''}`}
          />

          {/* Frisbee */}
          <img
            ref={frisbeeRef}
            src={process.env.PUBLIC_URL + '/freesbee1.png'}
            alt="Frisbee"
            style={getFrisbeeStyle()}
          />

          {/* Dynamic shadow */}
          <div
            ref={shadowRef}
            className="frisbee-shadow"
            style={getFrisbeeShadowStyle()}
          />

          {/* Birds using new system */}
          {birds.map(b => <Bird key={b.id} bird={b} />)}

          {/* Animated Boats with proper physics */}
          {boats.map(boat => (
            <Boat key={boat.key} boat={boat} />
          ))}



          

      {/* Fish jumps with proper animation */}
      {fishJumps.map(fj => (
        <FishJump
          key={fj.id}
          x={fj.x}
          y={fj.y}
          scale={fj.scale}
          type={fj.type}
          direction={fj.direction}
          onDone={() => handleFishDone(fj.id)}
        />
      ))}

          {/* Artik (halo Artik man) during special scene, animated frames from ARTIKanimations/runright */}
          {specialScene && (
            <img
              src={process.env.PUBLIC_URL + `/ARTIKanimations/runright/image_${artikFrame}.png`}
              alt="Artik"
              style={{
                position: 'absolute',
                left: `${artikPos * (window.innerWidth - 100)}px`,
                bottom: 0,
                zIndex: 50,
                width: 100,
                height: 'auto',
                pointerEvents: 'none',
                transform: artikDirection === 'left' ? 'scaleX(-1)' : 'none',
                transition: artikPos === 0 ? 'none' : 'left 0.1s linear',
              }}
            />
          )}
        </div>
        </>
      )}

      {/* ─────── Menus ─────── */}
      {!menuVisible ? (
        <button 
          className={`big-start-btn ${startPressed ? 'pressed' : ''}`}
          onClick={handleBigStart}
          onMouseDown={() => setStartPressed(true)}
          onMouseUp={() => setStartPressed(false)}
          onMouseLeave={() => setStartPressed(false)}
        >
          START
        </button>
      ) : !gameStarted ? (
        <div
          className="menu-content overlay-menu"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            paddingTop: 0,
            boxSizing: 'border-box'
          }}
        >
          <img
            src={process.env.PUBLIC_URL + '/friendsolympicsT1.png'}
            alt="Friends Olympics Title"
            className="title-img"
            style={{marginBottom: 20, maxWidth: '90vw', marginTop: '-0.7cm'}}
          />
          <button className="start-btn" onClick={handleStartGame} style={{marginBottom: 0, marginTop: '0.5cm'}}>
            Start Game
          </button>
          <div style={{height: '1.1cm'}} />
          <div className="how-to-play" style={{marginBottom: 24}}>
            <div className="retro-panel" style={{maxWidth: 340, textAlign: 'center', fontSize: '0.92em'}}>
              <div style={{ fontSize: '1em', letterSpacing: '2px', marginBottom: 8 }}>
                🕹️ HOW TO PLAY
              </div>
              <div style={{ marginBottom: 8, fontSize: '0.95em' }}>
                Throw or catch the frisbee!
              </div>
              {/* High/Middle/Low instructions removed as requested */}
            </div>
          </div>
        </div>
      ) : (
        <div className="menu-content overlay-menu">
          {phase === 'throw' && !waiting && (
            <>
      
              <div className="throw-buttons" style={{marginTop: '50px'}}>
                <button className="game-btn high" onClick={() => handleThrow('high')}>High (↑)</button>
                <button className="game-btn mid" onClick={() => handleThrow('mid')}>Middle (→)</button>
                <button className="game-btn low" onClick={() => handleThrow('low')}>Low (↓)</button>
              </div>
            </>
          )}

          {phase === 'flight' && (
            <>
      

              <div className="catch-buttons" style={{marginTop: '50px'}}>
                <button className="game-btn high" onClick={() => handleCatch('up')} disabled={!catchEnabled || !!catchChoice}>
                  Up (↑)
                </button>
                <button className="game-btn mid" onClick={() => handleCatch('mid')} disabled={!catchEnabled || !!catchChoice}>
                  Middle (→)
                </button>
                <button className="game-btn low" onClick={() => handleCatch('down')} disabled={!catchEnabled || !!catchChoice}>
                  Down (↓)
                </button>
              </div>

            </>
          )}

          {phase === 'result' && (
            <>
              {result === 'success' ? (
                <div className="retro-panel" style={{fontSize: '2em', color: '#7fff00'}}>
                  🏆 {successMessage}
                </div>
              ) : (
                <div className="retro-panel blink" style={{fontSize: '2em', color: '#ff4444'}}>
                  💥 Missed!
                </div>
              )}

              
            </>
          )}
        </div>
      )}
    </div>
  );
}
