import React from 'react';
import { X, Hand, Snowflake, Sparkles, Star, Zap } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const guides = [
    {
      icon: <Hand className="w-5 h-5 text-cyan-400" />,
      title: "Bitta ko'rsatkich barmoqda chizish",
      action: "Faqat ko'rsatkich barmoq bilan havoda chiziladi. Rasm uzilmasdan silliq oqadi.",
      badge: "1 Barmoq",
    },
    {
      icon: <Star className="w-5 h-5 text-amber-400" />,
      title: "Qo'lni yaqinlashtirganda — Sehrli Yulduzlar",
      action: "Qo'lingizni kameraga yaqinlashtiring — barmoqlaringizdan chaqnab turuvchi yulduzlar va sehrli aura otilib chiqadi! Qo'l uzoqlashganda effektlar darhol yo'qoladi.",
      badge: "Sehrli Aura",
    },
    {
      icon: <Snowflake className="w-5 h-5 text-blue-400" />,
      title: "Qotirib qo'yish va Yechish (Faqat tugmada)",
      action: "Pastdagi 'Qotirib qo'yish' tugmasini bosing — chizilgan rasm fazoda muzlab qotadi. Qayta bosganda erkin chizish davom etadi.",
      badge: "Tugmada",
    },
    {
      icon: <Zap className="w-5 h-5 text-sky-400" />,
      title: "Ikki qo'l yaqinlashganda — Chaqmoq",
      action: "Ikkala qo'lingizni ko'rsatib yaqinlashtiring — barmoqlar o'rtasida plazma chaqmoq nurlari tutashadi.",
      badge: "Chaqmoq",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
      title: "Sehrli effektlar menyusi",
      action: "Pastdagi menyu orqali Sehrli Yulduzlar, Koinot tumanligi, Olov, Kamalak va Muz kristallarini tanlashingiz mumkin.",
      badge: "6 xil Effekt",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900/95 border border-cyan-500/40 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-cyan-400">Abdurazokhov</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Qo'llanma</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bitta barmoq bilan chizish va yaqinlashtirganda sehrli yulduzlar
          </p>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {guides.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-white/5 shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                  <span className="text-[10px] text-cyan-400 font-mono border border-cyan-500/30 px-1.5 py-0.2 rounded shrink-0">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.action}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">Kamera avtomatik faol</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Tushundim
          </button>
        </div>
      </div>
    </div>
  );
};
