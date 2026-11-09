import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CanvasStage } from './components/CanvasStage';
import { MinimalHUD } from './components/MinimalHUD';
import { GestureGuideModal } from './components/GestureGuideModal';
import { COLOR_PALETTE, sounds } from './utils/constants';
import { BackgroundMode, ColorOption, EffectMode, Point, Stroke } from './types';
import { ProcessedHand, processHand, dist } from './utils/gestureDetection';
import { AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    Hands?: any;
    Camera?: any;
  }
}

export default function App() {
  // State
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [processedHands, setProcessedHands] = useState<ProcessedHand[]>([]);
  const [activeColor, setActiveColor] = useState<ColorOption>(COLOR_PALETTE[0]);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  // Default to live camera background
  const [bgMode, setBgMode] = useState<BackgroundMode>('camera');
  // Default to magical stars effect
  const [effectMode, setEffectMode] = useState<EffectMode>('magic_stars');
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Refs for tracking and loop control
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsModelRef = useRef<any>(null);
  const isLoopRunningRef = useRef<boolean>(false);
  const isFrameProcessingRef = useRef<boolean>(false);
  const toastTimeoutRef = useRef<number | null>(null);

  // Stroke continuity buffer to prevent line breaking ("rasm uzilib qolmasin")
  const lastActivePtTimeRef = useRef<number>(0);
  const lastActivePtRef = useRef<Point | null>(null);

  // Mutable refs for current states in loop
  const activeColorRef = useRef<ColorOption>(activeColor);
  activeColorRef.current = activeColor;
  const isFrozenRef = useRef<boolean>(isFrozen);
  isFrozenRef.current = isFrozen;
  const effectModeRef = useRef<EffectMode>(effectMode);
  effectModeRef.current = effectMode;
  const activeStrokeRef = useRef<Stroke | null>(null);

  // Toast feedback
  const showToast = useCallback((msg: string, duration = 1400) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  // Freeze / Unfreeze ONLY on button click
  const toggleFreeze = useCallback(() => {
    setIsFrozen((prev) => {
      const next = !prev;
      if (next) {
        sounds.playFreeze();
        showToast('❄️ Rasm fazoda qotirildi');
      } else {
        sounds.playUnfreeze();
        showToast('🔓 Qotirish yechildi — Chizishingiz mumkin');
      }
      return next;
    });
  }, [showToast]);

  // Clear all drawings
  const clearAll = useCallback(() => {
    setStrokes([]);
    setActiveStroke(null);
    activeStrokeRef.current = null;
    lastActivePtRef.current = null;
    sounds.playClear();
    showToast('✨ Barcha rasm tozalindi');
  }, [showToast]);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => {
      const next = prev === 'user' ? 'environment' : 'user';
      showToast(next === 'user' ? 'Old kamera' : 'Orqa kamera');
      return next;
    });
  }, [showToast]);

  // Cycle background mode
  const cycleBgMode = useCallback(() => {
    setBgMode((prev) => {
      const next: BackgroundMode = prev === 'camera' ? 'cyber' : prev === 'cyber' ? 'black' : 'camera';
      const label = next === 'camera' ? 'Video Kamera' : next === 'cyber' ? "Kiber To'r" : 'Toza Qora';
      showToast(`Fon: ${label}`);
      return next;
    });
  }, [showToast]);

  // Select effect mode
  const selectEffectMode = useCallback(
    (mode: EffectMode) => {
      setEffectMode(mode);
      sounds.playEffectChange();
      const labels: Record<EffectMode, string> = {
        magic_stars: 'Sehrli Yulduzlar',
        cosmic: 'Koinot Tumanligi',
        lightning: 'Chaqmoq Arki',
        fire: 'Plazma Olov',
        rainbow: 'Kamalak Oqimi',
        frost: 'Muz Kristal',
      };
      showToast(`Effekt: ${labels[mode]}`);
    },
    [showToast]
  );

  // Sound toggle
  const toggleSound = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    showToast(muted ? "Ovoz o'chirildi" : 'Ovoz yoqildi');
  }, [showToast]);

  // Start video stream immediately
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Qurilmada kamera qo'llab-quvvatlanmaydi");
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('[Abdurazokhov] Kamera ruxsati xatosi:', err);
      let msg = "Kameraga ulanib bo'lmadi";
      if (err.name === 'NotAllowedError') {
        msg = "Kameraga ruxsat bering. Brauzer sozlamalaridan kamerani oching.";
      }
      setCameraError(msg);
      setCameraActive(true);
    }
  };

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Initialize MediaPipe Hands
  useEffect(() => {
    let isCancelled = false;

    const initMediaPipe = async () => {
      if (typeof window === 'undefined') return;

      let attempts = 0;
      while (!window.Hands && attempts < 30) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (!window.Hands) return;

      try {
        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.45,
        });

        hands.onResults((results: any) => {
          if (isCancelled) return;
          const rawLandmarksList = results.multiHandLandmarks || [];
          const width = window.innerWidth;
          const height = window.innerHeight;
          const vw = videoRef.current?.videoWidth || 640;
          const vh = videoRef.current?.videoHeight || 480;

          const processed = rawLandmarksList.map((lms: any) =>
            processHand(lms, width, height, vw, vh, facingMode === 'user')
          );

          setProcessedHands(processed);
          handleOneFingerDrawing(processed);
        });

        await hands.initialize();
        handsModelRef.current = hands;
      } catch (e) {
        console.error('[Abdurazokhov] Model yuklanish xatosi:', e);
      }
    };

    initMediaPipe();

    return () => {
      isCancelled = true;
    };
  }, [facingMode]);

  // Process frames continuously
  useEffect(() => {
    isLoopRunningRef.current = true;

    const frameLoop = async () => {
      if (!isLoopRunningRef.current) return;

      const video = videoRef.current;
      const model = handsModelRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        model &&
        !isFrameProcessingRef.current
      ) {
        isFrameProcessingRef.current = true;
        try {
          await model.send({ image: video });
        } catch {
          // ignore dropped frames
        } finally {
          isFrameProcessingRef.current = false;
        }
      }

      requestAnimationFrame(frameLoop);
    };

    const animId = requestAnimationFrame(frameLoop);

    return () => {
      isLoopRunningRef.current = false;
      cancelAnimationFrame(animId);
    };
  }, []);

  // ONLY SINGLE FINGER DRAWING (Hech qanday qo'shimcha shakl qoldirmasdan toza chizish)
  const handleOneFingerDrawing = (handsList: ProcessedHand[]) => {
    const now = performance.now();

    // If frozen, do not draw new strokes
    if (isFrozenRef.current) {
      if (activeStrokeRef.current) {
        const strokeToSave = activeStrokeRef.current;
        if (strokeToSave.pts.length > 1) {
          setStrokes((prev) => [...prev, strokeToSave]);
        }
        activeStrokeRef.current = null;
        setActiveStroke(null);
      }
      return;
    }

    if (handsList.length === 0) {
      // Finger lost grace period (350ms) to prevent line breaking ("rasm uzilib qolmasin")
      if (now - lastActivePtTimeRef.current > 350) {
        if (activeStrokeRef.current) {
          const strokeToSave = activeStrokeRef.current;
          if (strokeToSave.pts.length > 1) {
            setStrokes((prev) => [...prev, strokeToSave]);
          }
          activeStrokeRef.current = null;
          setActiveStroke(null);
        }
      }
      return;
    }

    const primaryHand = handsList[0];

    // Single index finger pointing draws!
    if (primaryHand.isIndexPointing) {
      const targetPt: Point = primaryHand.indexPoint;
      lastActivePtTimeRef.current = now;

      if (!activeStrokeRef.current) {
        // Start new continuous stroke
        const newStroke: Stroke = {
          id: `st-${Date.now()}`,
          pts: [targetPt],
          color: activeColorRef.current.hex,
          width: 4.5,
          isRainbow: activeColorRef.current.isRainbow,
          effect: effectModeRef.current,
        };
        activeStrokeRef.current = newStroke;
        lastActivePtRef.current = targetPt;
        setActiveStroke(newStroke);
      } else {
        const pts = activeStrokeRef.current.pts;
        const last = lastActivePtRef.current || pts[pts.length - 1];

        // Smooth trajectory filter to prevent line disconnection
        if (!last || dist(targetPt, last) > 2) {
          const smoothedPt: Point = last
            ? {
                x: last.x * 0.3 + targetPt.x * 0.7,
                y: last.y * 0.3 + targetPt.y * 0.7,
                t: now,
              }
            : targetPt;

          pts.push(smoothedPt);
          lastActivePtRef.current = smoothedPt;
          setActiveStroke({ ...activeStrokeRef.current });
        }
      }
    } else {
      // Finger curled
      if (now - lastActivePtTimeRef.current > 350) {
        if (activeStrokeRef.current) {
          const strokeToSave = activeStrokeRef.current;
          if (strokeToSave.pts.length > 1) {
            setStrokes((prev) => [...prev, strokeToSave]);
          }
          activeStrokeRef.current = null;
          setActiveStroke(null);
        }
      }
    }
  };

  // Direct Touch / Pointer Drawing for touch screens
  const isPointerDrawingRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isFrozen) return;
    isPointerDrawingRef.current = true;
    const pt: Point = { x: e.clientX, y: e.clientY, t: performance.now() };

    const newStroke: Stroke = {
      id: `pt-${Date.now()}`,
      pts: [pt],
      color: activeColor.hex,
      width: 4.5,
      isRainbow: activeColor.isRainbow,
      effect: effectMode,
    };
    activeStrokeRef.current = newStroke;
    setActiveStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDrawingRef.current || !activeStrokeRef.current || isFrozen) return;
    const pt: Point = { x: e.clientX, y: e.clientY, t: performance.now() };
    const pts = activeStrokeRef.current.pts;
    const last = pts[pts.length - 1];
    if (!last || dist(pt, last) > 2) {
      pts.push(pt);
      setActiveStroke({ ...activeStrokeRef.current });
    }
  };

  const handlePointerUp = () => {
    if (isPointerDrawingRef.current && activeStrokeRef.current) {
      const strokeToSave = activeStrokeRef.current;
      if (strokeToSave && strokeToSave.pts && strokeToSave.pts.length > 1) {
        setStrokes((prev) => [...prev, strokeToSave]);
      }
      activeStrokeRef.current = null;
      setActiveStroke(null);
    }
    isPointerDrawingRef.current = false;
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#030712] select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Hidden processing video stream */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="fixed w-1 h-1 opacity-0 pointer-events-none -left-20 -top-20"
      />

      {/* Main Interactive Stage with live camera backdrop and magical stars */}
      <CanvasStage
        strokes={strokes}
        activeStroke={activeStroke}
        hands={processedHands}
        isFrozen={isFrozen}
        activeColor={activeColor.hex}
        effectMode={effectMode}
        bgMode={bgMode}
        showSkeleton={showSkeleton}
        videoRef={videoRef}
      />

      {/* Abdurazokhov HUD with Dedicated Freeze/Unfreeze Buttons */}
      <MinimalHUD
        activeColor={activeColor}
        onSelectColor={(col) => {
          setActiveColor(col);
          sounds.playColorSwitch();
          showToast(`🎨 Rang: ${col.name}`);
        }}
        isFrozen={isFrozen}
        onToggleFreeze={toggleFreeze}
        onClear={clearAll}
        onSwitchCamera={switchCamera}
        facingMode={facingMode}
        bgMode={bgMode}
        onCycleBgMode={cycleBgMode}
        effectMode={effectMode}
        onSelectEffectMode={selectEffectMode}
        isMuted={isMuted}
        onToggleSound={toggleSound}
        onOpenGuide={() => setGuideOpen(true)}
        toastMessage={toastMessage}
        cameraActive={cameraActive}
        showSkeleton={showSkeleton}
        onToggleSkeleton={() => setShowSkeleton(!showSkeleton)}
      />

      {/* Subtle alert if camera permission is blocked */}
      {cameraError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-200 text-xs shadow-xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-tight">{cameraError}</span>
          </div>
          <button
            onClick={startCamera}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-semibold text-[10px] shrink-0 hover:bg-amber-400 transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
}
