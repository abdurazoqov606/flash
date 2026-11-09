import { HandLandmark, Point } from '../types';

export interface ProcessedHand {
  landmarks: HandLandmark[];
  screenPoints: Point[];
  handSize: number;
  proximity: number; // 0 = far, 1 = very close to camera
  palmCenter: Point;
  isIndexPointing: boolean;
  isIndexOnly: boolean;
  indexPoint: Point;
  wristPoint: Point;
}

export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function processHand(
  rawLandmarks: HandLandmark[],
  viewportWidth: number,
  viewportHeight: number,
  videoWidth: number,
  videoHeight: number,
  isMirrored: boolean = true
): ProcessedHand {
  const vw = videoWidth || 640;
  const vh = videoHeight || 480;
  const scale = Math.max(viewportWidth / vw, viewportHeight / vh);
  const ox = (viewportWidth - vw * scale) / 2;
  const oy = (viewportHeight - vh * scale) / 2;

  // Convert normalized landmarks to screen coordinates
  const screenPoints: Point[] = rawLandmarks.map((lm) => {
    const normX = isMirrored ? 1 - lm.x : lm.x;
    return {
      x: normX * vw * scale + ox,
      y: lm.y * vh * scale + oy,
      t: performance.now(),
    };
  });

  const wrist = screenPoints[0];
  const middleMcp = screenPoints[9];
  const handSize = Math.max(dist(wrist, middleMcp), 10);

  // Proximity to camera calculation (handSize relative to screen dimension)
  const minDimension = Math.min(viewportWidth, viewportHeight);
  // Normalized 0..1 scale: when handSize is ~70px it's far (0), when handSize > 180px it's close (1)
  const proximity = Math.max(0, Math.min(1, (handSize - minDimension * 0.12) / (minDimension * 0.22)));

  // Palm center
  const palmCenter: Point = {
    x: (screenPoints[0].x + screenPoints[5].x + screenPoints[9].x + screenPoints[13].x + screenPoints[17].x) / 5,
    y: (screenPoints[0].y + screenPoints[5].y + screenPoints[9].y + screenPoints[13].y + screenPoints[17].y) / 5,
    t: performance.now(),
  };

  // Finger extension checks
  const isIndexExtended = dist(screenPoints[8], wrist) > dist(screenPoints[6], wrist) * 1.1;
  const isMiddleExtended = dist(screenPoints[12], wrist) > dist(screenPoints[10], wrist) * 1.1;
  const isRingExtended = dist(screenPoints[16], wrist) > dist(screenPoints[14], wrist) * 1.1;
  const isPinkyExtended = dist(screenPoints[20], wrist) > dist(screenPoints[18], wrist) * 1.1;

  // Index pointing check (index is extended)
  const isIndexPointing = isIndexExtended;
  const isIndexOnly = isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;

  return {
    landmarks: rawLandmarks,
    screenPoints,
    handSize,
    proximity,
    palmCenter,
    isIndexPointing,
    isIndexOnly,
    indexPoint: screenPoints[8],
    wristPoint: screenPoints[0],
  };
}
