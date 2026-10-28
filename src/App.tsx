/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RiskCalculatorView } from './components/RiskCalculatorView';
import { DutyPlannerView } from './components/DutyPlannerView';
import { GlobalHeatMapView } from './components/GlobalHeatMapView';
import { CoolingPrioritiesView } from './components/CoolingPrioritiesView';
import { NugenAssistantView } from './components/NugenAssistantView';
import { OrgPoliciesView } from './components/OrgPoliciesView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { AddDutyPointModal } from './components/AddDutyPointModal';
import { EmergencyProtocolModal } from './components/EmergencyProtocolModal';
import {
  ShieldAlert,
  Flame,
  Calendar,
  Umbrella,
  Bot,
  Sliders,
  Globe,
  HeartPulse
} from 'lucide-react';

function MainAppContent() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  const handleOpenAddPointWithCoords = (lat: number, lon: number) => {
    setPickedCoordinates({ lat, lon });
    setIsAddPointModalOpen(true);
  };

  const handleSelectDutyPointFromDashboard = (_dpId: string) => {
    setActiveTab('calculator');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-app text-main-theme flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenAddPointModal={() => {
          setPickedCoordinates(null);
          setIsAddPointModalOpen(true);
        }}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onSelectDutyPoint={handleSelectDutyPointFromDashboard}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onOpenAddPointModal={() => {
              setPickedCoordinates(null);
              setIsAddPointModalOpen(true);
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'map' && (
          <GlobalHeatMapView
            onOpenAddPointWithCoords={handleOpenAddPointWithCoords}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'calculator' && <RiskCalculatorView />}

        {activeTab === 'planner' && <DutyPlannerView />}

        {activeTab === 'cooling' && <CoolingPrioritiesView />}

        {activeTab === 'nugen' && <NugenAssistantView />}

        {activeTab === 'policies' && <OrgPoliciesView />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-theme bg-card-theme text-muted-theme text-xs py-6 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="font-semibold text-main-theme">HeatShield AI</span>
            <span>· {t('footer.tagline')}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-theme">
            <span>{t('footer.model')}</span>
            <span>·</span>
            <span>{t('footer.ready')}</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isLocationModalOpen && (
        <LocationSelectorModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onOpenAddPoint={() => {
            setPickedCoordinates(null);
            setIsAddPointModalOpen(true);
          }}
        />
      )}

      {isAddPointModalOpen && (
        <AddDutyPointModal
          isOpen={isAddPointModalOpen}
          onClose={() => {
            setIsAddPointModalOpen(false);
            setPickedCoordinates(null);
          }}
          initialCoordinates={pickedCoordinates}
        />
      )}

      {isEmergencyModalOpen && (
        <EmergencyProtocolModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
