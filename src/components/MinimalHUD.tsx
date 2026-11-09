import React, { useState } from 'react';
import {
  Snowflake,
  Play,
  Trash2,
  RefreshCw,
  Layers,
  Sparkles,
  Zap,
  Flame,
  Globe,
  Sun,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Star,
} from 'lucide-react';
import { COLOR_PALETTE } from '../utils/constants';
import { BackgroundMode, ColorOption, EffectMode } from '../types';

interface MinimalHUDProps {
  activeColor: ColorOption;
  onSelectColor: (color: ColorOption) => void;
  isFrozen: boolean;
  onToggleFreeze: () => void;
  onClear: () => void;
  onSwitchCamera: () => void;
  facingMode: 'user' | 'environment';
  bgMode: BackgroundMode;
  onCycleBgMode: () => void;
  effectMode: EffectMode;
  onSelectEffectMode: (mode: EffectMode) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenGuide: () => void;
  toastMessage: string | null;
  cameraActive: boolean;
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
}

const EFFECTS: { id: EffectMode; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'magic_stars', label: 'Sehrli Yulduzlar', icon: <Star className="w-3.5 h-3.5" />, color: '#ffd700' },
  { id: 'cosmic', label: 'Koinot', icon: <Globe className="w-3.5 h-3.5" />, color: '#a855f7' },
  { id: 'lightning', label: 'Chaqmoq', icon: <Zap className="w-3.5 h-3.5" />, color: '#38bdf8' },
  { id: 'fire', label: 'Plazma Olov', icon: <Flame className="w-3.5 h-3.5" />, color: '#f97316' },
  { id: 'rainbow', label: 'Kamalak', icon: <Sun className="w-3.5 h-3.5" />, color: '#ec4899' },
  { id: 'frost', label: 'Muz Kristal', icon: <Snowflake className="w-3.5 h-3.5" />, color: '#67e8f9' },
];

export const MinimalHUD: React.FC<MinimalHUDProps> = ({
  activeColor,
  onSelectColor,
  isFrozen,
  onToggleFreeze,
  onClear,
  onSwitchCamera,
  facingMode,
  bgMode,
  onCycleBgMode,
  effectMode,
  onSelectEffectMode,
  isMuted,
  onToggleSound,
  onOpenGuide,
  toastMessage,
  showSkeleton,
  onToggleSkeleton,
}) => {
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showEffectsPicker, setShowEffectsPicker] = useState<boolean>(false);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full">
        {/* Name: Just "Abdurazokhov" */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex items-baseline gap-2 bg-slate-950/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_24px_rgba(0,240,255,0.2)]">
            <span className="text-base sm:text-xl font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]">
              Abdurazokhov
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider hidden sm:inline">
              SEHRLI BARMOQ
            </span>
          </div>
        </div>

        {/* Top Right Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* AR Wireframe toggle */}
          <button
            onClick={onToggleSkeleton}
            className={`p-2 rounded-full border backdrop-blur-md transition-all ${
              showSkeleton
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={showSkeleton ? "AR skeletini yashirish" : "AR skeletini ko'rsatish"}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Camera Flip */}
          <button
            onClick={onSwitchCamera}
            className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all"
            title={facingMode === 'user' ? 'Orqa kameraga o\'tish' : 'Old kameraga o\'tish'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all"
            title={isMuted ? 'Ovozni yoqish' : 'Ovozni o\'chirish'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Zen Clean Screen Mode */}
          <button
            onClick={() => setZenMode(!zenMode)}
            className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all"
            title={zenMode ? "Boshqaruvni ko'rsatish" : "Toza ekran (Zen)"}
          >
            {zenMode ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Help Modal */}
          <button
            onClick={onOpenGuide}
            className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 backdrop-blur-md transition-all"
            title="Qo'llanma"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Dynamic Feedback Toast */}
      <div className="flex justify-center items-center my-auto pointer-events-none">
        {toastMessage && (
          <div className="px-4 py-2 rounded-full bg-slate-950/85 border border-cyan-400 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_30px_rgba(0,240,255,0.4)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Dock */}
      <div
        className={`w-full max-w-xl mx-auto flex flex-col items-center gap-2 pointer-events-auto transition-all duration-300 ${
          zenMode ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Color Picker Drawer */}
        {showColorPicker && (
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {COLOR_PALETTE.map((col) => {
              const isSelected = activeColor.id === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => {
                    onSelectColor(col);
                    setShowColorPicker(false);
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all relative ${
                    isSelected ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: col.isRainbow ? '#ff007f' : col.hex,
                    boxShadow: isSelected ? `0 0 16px ${col.glow}` : 'none',
                    backgroundImage: col.isRainbow
                      ? 'linear-gradient(135deg, #ff007f, #00f0ff, #39ff88)'
                      : undefined,
                  }}
                  title={col.name}
                />
              );
            })}
          </div>
        )}

        {/* Effects Selector Drawer */}
        {showEffectsPicker && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-2xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {EFFECTS.map((eff) => {
              const isSelected = effectMode === eff.id;
              return (
                <button
                  key={eff.id}
                  onClick={() => {
                    onSelectEffectMode(eff.id);
                    setShowEffectsPicker(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-cyan-500/30 border border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
                  }`}
                >
                  <span style={{ color: eff.color }}>{eff.icon}</span>
                  <span>{eff.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Dock */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-white/15 backdrop-blur-2xl shadow-[0_12px_45px_rgba(0,0,0,0.7)]">
          {/* 1. Freeze / Unfreeze - Dedicated Glass Button */}
          <button
            onClick={onToggleFreeze}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md ${
              isFrozen
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-cyan-300'
                : 'bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200'
            }`}
          >
            {isFrozen ? (
              <>
                <Play className="w-4 h-4 fill-current text-white animate-pulse" />
                <span>Yechib olish (Chizish)</span>
              </>
            ) : (
              <>
                <Snowflake className="w-4 h-4 text-cyan-300" />
                <span>Qotirib qo'yish</span>
              </>
            )}
          </button>

          {/* 2. Color Palette Trigger */}
          <button
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowEffectsPicker(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
          >
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
              style={{
                backgroundColor: activeColor.isRainbow ? '#ff007f' : activeColor.hex,
                backgroundImage: activeColor.isRainbow
                  ? 'linear-gradient(135deg, #ff007f, #00f0ff, #39ff88)'
                  : undefined,
              }}
            />
            <span className="hidden sm:inline">{activeColor.name}</span>
          </button>

          {/* 3. Effects Selector Trigger */}
          <button
            onClick={() => {
              setShowEffectsPicker(!showEffectsPicker);
              setShowColorPicker(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{EFFECTS.find((e) => e.id === effectMode)?.label}</span>
          </button>

          {/* 4. Clear Canvas Button */}
          <button
            onClick={onClear}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-colors text-xs flex items-center gap-1.5"
            title="Barcha rasmni tozalash"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tozalash</span>
          </button>

          {/* 5. Background Mode Cycle */}
          <button
            onClick={onCycleBgMode}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title={`Fon: ${bgMode === 'camera' ? 'Video Kamera' : bgMode === 'cyber' ? 'Kiber To\'r' : 'Toza Qora'}`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Proximity Tip */}
        <div className="text-[11px] text-slate-400/80 font-mono tracking-tight flex items-center gap-2">
          <span>☝️ 1 barmoqda chiziladi</span>
          <span>·</span>
          <span>✨ Qo'lni yaqin olib kelsangiz yulduzlar va sehrli aura portlaydi</span>
        </div>
      </div>
    </div>
  );
};
