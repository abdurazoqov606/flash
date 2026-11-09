export type EffectMode =
  | 'magic_stars'
  | 'cosmic'
  | 'lightning'
  | 'fire'
  | 'rainbow'
  | 'frost';

export type BackgroundMode = 'camera' | 'cyber' | 'black';

export interface Point {
  x: number;
  y: number;
  t: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  pts: Point[];
  color: string;
  width: number;
  isRainbow?: boolean;
  effect: EffectMode;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  glow: string;
  isRainbow?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
  type: 'star' | 'dust' | 'spark' | 'glow';
  rotation?: number;
  vRot?: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
