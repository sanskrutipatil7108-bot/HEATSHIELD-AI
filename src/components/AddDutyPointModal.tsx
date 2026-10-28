import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DutyPoint } from '../types';
import { getShadeConditionName, getTrafficDensityName, getLocationDisplayName } from '../services/translations';
import { Plus, X, MapPin, AlertCircle, Shield } from 'lucide-react';

interface AddDutyPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates?: { lat: number; lon: number } | null;
}

export const AddDutyPointModal: React.FC<AddDutyPointModalProps> = ({
  isOpen,
  onClose,
  initialCoordinates
}) => {
  const { selectedLocation, addDutyPoint, t, language } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<DutyPoint['type']>('junction');
  const [latitude, setLatitude] = useState(
    initialCoordinates ? initialCoordinates.lat.toFixed(5) : selectedLocation.latitude.toFixed(5)
  );
  const [longitude, setLongitude] = useState(
    initialCoordinates ? initialCoordinates.lon.toFixed(5) : selectedLocation.longitude.toFixed(5)
  );
  const [trafficDensity, setTrafficDensity] = useState<DutyPoint['trafficDensity']>('High');
  const [shadeCondition, setShadeCondition] = useState<DutyPoint['shadeCondition']>('direct_sun');

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setFormError(language === 'hi' ? 'कृपया मान्य अक्षांश और देशांतर निर्देशांक दर्ज करें।' : language === 'mr' ? 'कृपया वैध अक्षांश व रेखांश प्रविष्ट करा.' : 'Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    addDutyPoint({
      locationId: selectedLocation.id,
      name: name.trim() || (language === 'hi' ? 'अचिह्नित ड्यूटी पॉइंट' : language === 'mr' ? 'अनामित ड्युटी पॉईंट' : 'Unlabeled Traffic Point'),
      type,
      latitude: lat,
      longitude: lon,
      verificationStatus: 'verified',
      trafficDensity,
      shadeCondition
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card-theme border-theme rounded-2xl w-full max-w-lg shadow-modal-theme overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h2 className="text-base font-semibold text-main-theme">{t('modals.addPointTitle')}</h2>
              <p className="text-xs text-muted-theme">
                {t('modals.addPointSubtitle')} · <span className="text-[#2563EB] font-medium">{getLocationDisplayName(selectedLocation, language)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-theme hover:text-main-theme rounded-lg hover:bg-subtle-theme transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-secondary-theme mb-1">
              {t('modals.pointName')}
            </label>
            <input
              type="text"
              required
              placeholder={language === 'hi' ? 'उदा. यूनिवर्सिटी चौक नॉर्थ फ्लाईओवर' : language === 'mr' ? 'उदा. विद्यापीठ चौक उत्तर उड्डाणपूल' : 'e.g. University Circle North Flyover'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.pointType')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
              >
                <option value="junction">{language === 'hi' ? 'ट्रैफिक जंक्शन / चौराहा' : language === 'mr' ? 'वाहतूक जंक्शन / चौक' : 'Traffic Junction / Intersection'}</option>
                <option value="roundabout">{language === 'hi' ? 'गोल चक्कर (राउंडअबाउट)' : language === 'mr' ? 'गोल चक्कर (राउंडअबाऊट)' : 'Roundabout / Traffic Circle'}</option>
                <option value="checkpoint">{language === 'hi' ? 'पुलिस नाका / चेकपॉइंट' : language === 'mr' ? 'पोलीस नाकाबंदी चेकपॉईंट' : 'Police Checkpoint'}</option>
                <option value="toll_plaza">{language === 'hi' ? 'टोल प्लाजा / हाईवे चौकी' : language === 'mr' ? 'टोल नाका / महामार्ग चौकी' : 'Toll Plaza / Highway Post'}</option>
                <option value="outdoor_post">{language === 'hi' ? 'स्थिर आउटडोर पोस्ट' : language === 'mr' ? 'स्थिर मैदानी पोस्ट' : 'Outdoor Stationary Post'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.trafficDensity')}</label>
              <select
                value={trafficDensity}
                onChange={(e) => setTrafficDensity(e.target.value as any)}
                className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
              >
                <option value="High">{getTrafficDensityName('High', language)}</option>
                <option value="Moderate">{getTrafficDensityName('Moderate', language)}</option>
                <option value="Low">{getTrafficDensityName('Low', language)}</option>
                <option value="Gridlock">{getTrafficDensityName('Gridlock', language)}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.shadeCondition')}</label>
            <select
              value={shadeCondition}
              onChange={(e) => setShadeCondition(e.target.value as any)}
              className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
            >
              <option value="direct_sun">{getShadeConditionName('direct_sun', language)}</option>
              <option value="partial_shade">{getShadeConditionName('partial_shade', language)}</option>
              <option value="tree_canopy">{getShadeConditionName('tree_canopy', language)}</option>
              <option value="overhead_tent">{getShadeConditionName('overhead_tent', language)}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.latitude')}</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.longitude')}</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-theme">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-muted-theme hover:text-main-theme"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('modals.addPointSubmit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
