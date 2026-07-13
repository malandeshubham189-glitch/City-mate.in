import { useState } from "react";
import { UserRole, UserProfile } from "../types";
import { LogIn, LogOut, Shield, User, Building, MapPin, Bell, Sun, Moon } from "lucide-react";

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  cities: string[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  unreadNotificationsCount?: number;
  notificationsList?: any[];
  onMarkNotificationsAsRead?: () => void;
}

export default function Header({
  currentUser,
  onOpenAuth,
  onLogout,
  selectedCity,
  onCityChange,
  cities,
  darkMode,
  onToggleDarkMode,
  unreadNotificationsCount = 0,
  notificationsList = [],
  onMarkNotificationsAsRead,
}: HeaderProps) {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      darkMode 
        ? "bg-slate-950/80 border-b border-slate-800/80 text-white shadow-[0_4px_30px_rgba(0,0,0,0.4)]" 
        : "bg-white/80 border-b border-slate-200/80 text-slate-900 shadow-[0_4px_30px_rgba(0,0,0,0.02)]"
    } backdrop-blur-xl`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-white transition-all duration-300 ${
              darkMode 
                ? "bg-gradient-to-tr from-brand-indigo via-brand-violet to-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.4)]" 
                : "bg-gradient-to-tr from-brand-blue to-brand-indigo shadow-[0_0_15px_rgba(79,70,229,0.2)]"
            }`}>
              CM
            </div>
            <div>
              <span className={`text-xl font-extrabold tracking-tight transition-colors duration-300 ${
                darkMode ? "text-white" : "text-slate-900"
              }`}>
                CityMate<span className={darkMode ? "text-purple-400" : "text-brand-indigo"}>.in</span>
              </span>
              <p className={`hidden text-[9px] font-bold tracking-widest uppercase sm:block transition-colors duration-300 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}>
                India Relocation Hub
              </p>
            </div>
          </div>

          {/* City Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-indigo ${
                darkMode
                  ? "border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
              id="header-city-selector"
            >
              <MapPin className={`h-3.5 w-3.5 transition-colors ${darkMode ? "text-purple-400" : "text-brand-indigo"}`} />
              <span>{selectedCity}</span>
            </button>

            {showCityDropdown && (
              <div className={`absolute left-0 mt-2 w-52 rounded-2xl border p-1.5 shadow-2xl z-50 animate-in fade-in-50 slide-in-from-top-1 ${
                darkMode
                  ? "border-slate-800 bg-slate-900 text-white"
                  : "border-slate-100 bg-white text-slate-800"
              }`}>
                <div className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider border-b mb-1 ${
                  darkMode ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"
                }`}>
                  Select Indian City
                </div>
                <div className="max-h-60 overflow-y-auto pr-1">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        onCityChange(city);
                        setShowCityDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                        selectedCity === city
                          ? darkMode 
                            ? "bg-purple-950/40 text-purple-400 font-bold" 
                            : "bg-indigo-50/50 text-brand-indigo font-bold"
                          : darkMode 
                            ? "text-slate-300 hover:bg-slate-800/60 hover:text-white" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && (
                        <span className={`h-1.5 w-1.5 rounded-full ${darkMode ? "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" : "bg-brand-indigo"}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Profile info */}
        <div className="flex items-center gap-3">
          
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`rounded-xl p-2.5 border transition-all duration-300 hover:scale-105 active:scale-95 ${
              darkMode
                ? "border-slate-800 bg-slate-900/60 text-yellow-400 hover:bg-slate-800"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            id="theme-toggle-btn"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Real-time Notifications Bell Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className={`relative hidden rounded-xl p-2.5 border transition-all duration-300 md:block focus:outline-none ${
                darkMode 
                  ? "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white" 
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900"
              }`} 
              id="header-bell-notif"
              title="Notifications feed"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white ${
                  darkMode ? "bg-purple-600 shadow-[0_0_8px_rgba(192,132,252,0.8)]" : "bg-red-500"
                }`}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div className={`absolute right-0 mt-2 w-80 rounded-2xl border p-1.5 shadow-2xl z-50 animate-in fade-in-50 slide-in-from-top-1 ${
                darkMode
                  ? "border-slate-800 bg-slate-900 text-white"
                  : "border-slate-100 bg-white text-slate-800"
              }`}>
                <div className={`flex items-center justify-between px-3 py-2 border-b mb-1 ${
                  darkMode ? "border-slate-800" : "border-slate-100"
                }`}>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Notifications ({unreadNotificationsCount} Unread)
                  </span>
                  {unreadNotificationsCount > 0 && onMarkNotificationsAsRead && (
                    <button
                      onClick={() => {
                        onMarkNotificationsAsRead();
                        setShowNotificationsDropdown(false);
                      }}
                      className="text-[9px] font-bold text-indigo-400 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
                  {notificationsList.length === 0 ? (
                    <div className="py-8 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Inbox is empty
                    </div>
                  ) : (
                    notificationsList.slice(0, 5).map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          !n.read 
                            ? darkMode 
                              ? "bg-slate-800/40 border-slate-700/60 text-white" 
                              : "bg-indigo-50/30 border-indigo-100/50 text-slate-850"
                            : darkMode 
                            ? "bg-transparent border-transparent opacity-60 text-slate-300" 
                            : "bg-transparent border-transparent opacity-70 text-slate-600"
                        }`}
                      >
                        <p className="text-xs font-bold">{n.title}</p>
                        <p className={`text-[10px] mt-0.5 leading-normal ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{n.message}</p>
                        <p className="text-[8px] text-slate-500 mt-1 font-mono">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className={`text-xs font-extrabold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{currentUser.name}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {currentUser.role === "admin" && (
                    <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                      darkMode ? "bg-red-950/40 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      <Shield className="h-2 w-2" /> Admin
                    </span>
                  )}
                  {currentUser.role === "owner" && (
                    <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                      darkMode ? "bg-blue-950/40 text-blue-400 border-blue-900/50" : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>
                      <Building className="h-2 w-2" /> Owner
                    </span>
                  )}
                  {currentUser.role === "user" && (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                      darkMode ? "bg-green-950/40 text-green-400 border-green-900/50" : "bg-green-50 text-green-600 border-green-100"
                    }`}>
                      Seeker
                    </span>
                  )}
                </div>
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black transition-all overflow-hidden ${
                  darkMode 
                    ? "bg-purple-950/60 text-purple-300 border border-purple-900/40" 
                    : "bg-indigo-50 text-brand-indigo border border-indigo-100"
                }`}>
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      referrerPolicy="no-referrer" 
                      alt={currentUser.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "?"
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className={`rounded-xl border p-2.5 transition-all duration-300 hover:scale-105 active:scale-95 ${
                    darkMode
                      ? "border-slate-800 text-slate-400 hover:bg-red-950/55 hover:text-red-400 hover:border-red-900/40"
                      : "border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                  }`}
                  title="Logout"
                  id="header-logout-btn"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer ${
                darkMode
                  ? "bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-indigo-900/30 hover:shadow-indigo-900/50"
                  : "bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800"
              }`}
              id="header-login-btn"
            >
              <LogIn className="h-4 w-4" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
