import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeMode, AppLanguage } from '../types';
import { getLocationDisplayName, formatNumberLocale } from '../services/translations';
import {
  ShieldAlert,
  Globe,
  Plus,
  RefreshCw,
  AlertTriangle,
  Sun,
  Moon,
  Leaf,
  ChevronDown,
  Menu,
  X,
  Flame,
  Sliders,
  Calendar,
  Umbrella,
  Bot,
  Languages
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLocationModal: () => void;
  onOpenAddPointModal: () => void;
  onOpenEmergencyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenLocationModal,
  onOpenAddPointModal,
  onOpenEmergencyModal
}) => {
  const {
    selectedLocation,
    currentLocationWeather,
    refreshWeatherForLocation,
    isWeatherLoading,
    activeOrg,
    theme,
    setTheme,
    language,
    setLanguage,
    t
  } = useApp();

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'map', label: t('nav.map'), icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'calculator', label: t('nav.calculator'), icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'planner', label: t('nav.planner'), icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'cooling', label: t('nav.cooling'), icon: <Umbrella className="w-3.5 h-3.5" /> },
    { id: 'nugen', label: t('nav.nugen'), icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'policies', label: t('nav.policies'), icon: <ShieldAlert className="w-3.5 h-3.5" /> }
  ];

  const themeOptions: { id: ThemeMode; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'light', labelKey: 'common.light', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'dark', labelKey: 'common.dark', icon: <Moon className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'nature', labelKey: 'common.nature', icon: <Leaf className="w-3.5 h-3.5 text-emerald-400" /> }
  ];

  const languageOptions: { id: AppLanguage; label: string; sub: string; short: string }[] = [
    { id: 'en', label: 'English', sub: 'English', short: 'EN' },
    { id: 'hi', label: 'हिंदी', sub: 'हिन्दी', short: 'हि' },
    { id: 'mr', label: 'मराठी', sub: 'मराठी', short: 'म' }
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const selectedLocationDisplay = getLocationDisplayName(selectedLocation, language);

  const currentLangObj = languageOptions.find((l) => l.id === language) || languageOptions[0];

  return (
    <header className="w-full max-w-full border-b border-slate-700/70 bg-[#14213D] text-white sticky top-0 z-50 shadow-sm transition-colors duration-200">
      {/* Primary Navigation Bar */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between gap-2 lg:gap-3 w-full min-w-0">
          
          {/* Zone 1: Logo & Title (Left) */}
          <div
            onClick={() => handleSelectTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0 cursor-pointer group"
            title={`${t('app.title')} - ${t('nav.dashboard')}`}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center text-[#14B8A6] shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
                {t('app.title')}
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#0F172A] text-[#14B8A6] border border-[#14B8A6]/40 font-semibold hidden xs:inline-block">
                v2.1
              </span>
            </div>
          </div>

          {/* Zone 2: Desktop Navigation Links (Center, xl+ screens) */}
          <nav
            className="hidden xl:flex items-center justify-center flex-1 min-w-0 mx-2"
            aria-label="Main Navigation"
          >
            <div className="flex items-center justify-center gap-1 2xl:gap-1.5 overflow-x-auto no-scrollbar max-w-full py-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`px-2 py-1.5 2xl:px-2.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#14B8A6] text-white font-semibold border border-[#0d9488] shadow-xs'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-[#14B8A6]'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Zone 3: Controls & Actions (Right) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Functional Multilingual Language Selector (English / हिंदी / मराठी) */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsLangMenuOpen(!isLangMenuOpen);
                  setIsThemeMenuOpen(false);
                }}
                className="px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700 text-slate-200 flex items-center gap-1 sm:gap-1.5 transition-colors shadow-xs"
                title="Select Language / भाषा निवडा / भाषा चुनें"
                aria-label="Select language"
              >
                <Languages className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                <span className="text-[11px] font-semibold hidden sm:inline">
                  {currentLangObj.label}
                </span>
                <span className="text-[11px] font-semibold sm:hidden">
                  {currentLangObj.short}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[55]"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[#0F172A] border border-slate-700 shadow-xl py-1 z-[60] text-xs animate-in fade-in duration-150">
                    <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
                      {t('common.language')}
                    </div>
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setLanguage(opt.id);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          language === opt.id
                            ? 'text-[#14B8A6] font-semibold bg-[#14B8A6]/15'
                            : 'text-slate-200'
                        }`}
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Day/Night Mode (Theme) Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsThemeMenuOpen(!isThemeMenuOpen);
                  setIsLangMenuOpen(false);
                }}
                className="px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700 text-slate-200 flex items-center gap-1 sm:gap-1.5 transition-colors shadow-xs"
                title="Change Color Theme (Day/Night)"
                aria-label="Change color theme"
              >
                {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                {theme === 'nature' && <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                <span className="capitalize text-[11px] font-medium hidden 2xl:inline">
                  {t(`common.${theme}`)}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {isThemeMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[55]"
                    onClick={() => setIsThemeMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-[#0F172A] border border-slate-700 shadow-xl py-1 z-[60] text-xs animate-in fade-in duration-150">
                    <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
                      {theme === 'light' ? 'Day Mode' : 'Night Mode'}
                    </div>
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTheme(opt.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                          theme === opt.id ? 'text-[#14B8A6] font-semibold bg-[#14B8A6]/15' : 'text-slate-200'
                        }`}
                      >
                        {opt.icon}
                        <span>{t(opt.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Heat Triage Emergency Button (Red) */}
            <button
              onClick={onOpenEmergencyModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 md:px-3 md:py-1.5 text-xs font-bold rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs border border-red-500/50 flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title={t('nav.emergencyTriage')}
              aria-label={t('nav.emergencyTriage')}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">{t('nav.emergencyTriage')}</span>
            </button>

            {/* Add Junction Button (Blue) */}
            <button
              onClick={onOpenAddPointModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 md:px-3 md:py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title={t('nav.addJunction')}
              aria-label={t('nav.addJunction')}
            >
              <Plus className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">{t('nav.addJunction')}</span>
            </button>

            {/* Mobile Menu Hamburger Button (Hidden on md+ / tablets & desktop) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700 text-slate-200 hover:text-white transition-colors shrink-0"
              title={isMobileMenuOpen ? t('common.close') : t('nav.title')}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>
          </div>

        </div>
      </div>

      {/* Tablet Secondary Navigation Strip (768px to 1279px) */}
      <div className="hidden md:block xl:hidden border-t border-slate-700/60 bg-[#0F172A]/90 px-3 sm:px-4 lg:px-6 py-1.5 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-start lg:justify-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#14B8A6] text-white font-semibold border border-[#0d9488] shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-[#14B8A6]'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Mobile Navigation Drawer (< 768px) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-700 bg-[#0F172A] px-3 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
          {/* Section: Navigation Tabs */}
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 pb-1.5">
              {t('nav.title')}
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#14B8A6] text-white font-semibold border border-[#0d9488]'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-white' : 'text-[#14B8A6]'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Mobile Quick Actions */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenEmergencyModal();
              }}
              className="w-full py-2 px-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t('nav.emergencyTriage')}</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAddPointModal();
              }}
              className="w-full py-2 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('nav.addJunction')}</span>
            </button>
          </div>

          {/* Section: Location & Organization info */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-2 text-xs text-slate-400">
            <span className="truncate max-w-[180px]">{activeOrg.name}</span>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenLocationModal();
              }}
              className="text-[#14B8A6] hover:underline text-[11px] font-medium"
            >
              {t('nav.changeLocation')}
            </button>
          </div>
        </div>
      )}

      {/* Sub-header Context Strip (Location & Weather) */}
      <div className="bg-[#0F172A] border-t border-slate-800/80 px-3 sm:px-4 lg:px-6 py-2 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs min-w-0">
          {/* Location details */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 text-[#14B8A6] hover:text-teal-300 font-medium group transition-colors min-w-0 shrink"
              title={t('nav.changeLocation')}
            >
              <Globe className="w-3.5 h-3.5 text-[#14B8A6] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="underline decoration-[#14B8A6]/50 underline-offset-2 font-semibold truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                {selectedLocationDisplay}
              </span>
              <span className="text-slate-400 font-normal shrink-0">
                ({selectedLocation.country})
              </span>
            </button>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Coordinates and status */}
            <span className="font-mono text-slate-400 text-[11px] hidden md:inline truncate">
              {formatNumberLocale(selectedLocation.latitude, language, 4)}°N, {formatNumberLocale(selectedLocation.longitude, language, 4)}°E
            </span>

            <span className="text-slate-400 text-[11px] hidden lg:inline">
              · {selectedLocation.verificationStatus === 'verified' ? t('common.verified') : t('common.unverified')}
            </span>
          </div>

          {/* Current Microclimate Reading */}
          <div className="flex items-center gap-2 sm:gap-3 text-slate-300 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono">
              <span className="text-white font-bold text-xs sm:text-sm">
                {formatNumberLocale(currentLocationWeather.temperature, language, 1)}°C
              </span>
              <span className="text-[#14B8A6] text-[11px]">
                ({formatNumberLocale(currentLocationWeather.relativeHumidity, language, 0)}% RH)
              </span>
            </div>

            <span className="text-slate-600 hidden xs:inline">·</span>

            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {t('map.source')}: {currentLocationWeather.providerName}
            </span>

            <button
              onClick={() => refreshWeatherForLocation(selectedLocation.id)}
              disabled={isWeatherLoading}
              className="p-1 text-slate-400 hover:text-[#14B8A6] rounded hover:bg-slate-800 transition-colors shrink-0"
              title={t('weather.refreshWeather')}
              aria-label="Refresh weather data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin text-[#14B8A6]' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
