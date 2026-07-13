export type PremiumTheme = "purple" | "pistachio-orange";

export interface ThemeStyles {
  id: PremiumTheme;
  name: string;
  // Dark mode specific styles
  accentText: string;        // e.g., "text-purple-400"
  hoverText: string;         // e.g., "hover:text-purple-300"
  accentBg: string;          // e.g., "bg-purple-600"
  gradientLogo: string;      // gradient for Logo (dark)
  gradientBtn: string;       // gradient for standard buttons
  badgeBg: string;           // e.g., "bg-purple-950/60"
  badgeBorder: string;       // e.g., "border-purple-900/40"
  shadowGlow: string;        // box-shadow glow
  activeDot: string;         // small dot active color
  loaderColor: string;       // spinner color
  
  // Light mode specific styles
  lightAccentText: string;   // e.g., "text-brand-indigo"
  lightGradientLogo: string; // e.g., "from-brand-blue to-brand-indigo"
  lightGradientBtn: string;  // e.g., "from-indigo-600 to-purple-600"
  lightActiveDot: string;    // e.g., "bg-brand-indigo"
}

export const themes: Record<PremiumTheme, ThemeStyles> = {
  purple: {
    id: "purple",
    name: "Premium Purple",
    accentText: "text-purple-400",
    hoverText: "hover:text-purple-300",
    accentBg: "bg-purple-600",
    gradientLogo: "from-brand-indigo via-brand-violet to-purple-500",
    gradientBtn: "from-brand-indigo to-brand-violet",
    badgeBg: "bg-purple-950/60",
    badgeBorder: "border-purple-900/40",
    shadowGlow: "shadow-[0_0_20px_rgba(124,58,237,0.4)]",
    activeDot: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    loaderColor: "text-purple-400",
    
    lightAccentText: "text-brand-indigo",
    lightGradientLogo: "from-brand-blue to-brand-indigo",
    lightGradientBtn: "from-indigo-600 to-purple-600",
    lightActiveDot: "bg-brand-indigo",
  },
  "pistachio-orange": {
    id: "pistachio-orange",
    name: "Premium Pistachio + Orange",
    accentText: "text-lime-400",
    hoverText: "hover:text-lime-300",
    accentBg: "bg-lime-500",
    gradientLogo: "from-lime-400 via-emerald-400 to-orange-500",
    gradientBtn: "from-lime-500 to-orange-500",
    badgeBg: "bg-lime-950/60",
    badgeBorder: "border-lime-900/40",
    shadowGlow: "shadow-[0_0_20px_rgba(132,204,22,0.4)]",
    activeDot: "bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]",
    loaderColor: "text-lime-400",
    
    lightAccentText: "text-orange-600",
    lightGradientLogo: "from-lime-600 to-orange-500",
    lightGradientBtn: "from-lime-600 to-orange-600",
    lightActiveDot: "bg-orange-600",
  },
};

export function getThemeStyles(themeId: PremiumTheme | null | string): ThemeStyles {
  if (themeId === "pistachio-orange") {
    return themes["pistachio-orange"];
  }
  return themes.purple;
}
