import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LocationRecord } from '../types';
import { getLocationTypeName, getLocationDisplayName } from '../services/translations';
import {
  Globe,
  Search,
  MapPin,
  Plus,
  Check,
  X,
  Compass,
  AlertCircle,
  Building,
  Navigation
} from 'lucide-react';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddPoint: () => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onOpenAddPoint
}) => {
  const {
    locations,
    selectedLocationId,
    setSelectedLocationId,
    addLocation,
    searchGeocode,
    activeOrgId,
    t,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState<any[]>([]);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Tab mode: 'saved' | 'search_online' | 'manual_custom'
  const [mode, setMode] = useState<'saved' | 'search_online' | 'manual_custom'>('saved');

  // Manual Custom Form state
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<LocationRecord['locationType']>('city');
  const [customCountry, setCustomCountry] = useState('');
  const [customState, setCustomState] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customLat, setCustomLat] = useState('18.5204');
  const [customLon, setCustomLon] = useState('73.8567');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'city' | 'town' | 'village'>('all');

  if (!isOpen) return null;

  // Filter saved locations
  const filteredSavedLocations = locations.filter((loc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      loc.name.toLowerCase().includes(q) ||
      loc.country.toLowerCase().includes(q) ||
      (loc.city && loc.city.toLowerCase().includes(q)) ||
      (loc.state && loc.state.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (typeFilter === 'all') return true;
    if (typeFilter === 'village') return loc.locationType === 'village' || loc.locationType === 'checkpoint' || loc.locationType === 'custom';
    return loc.locationType === typeFilter;
  });

  const handleOnlineSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingGeocode(true);
    setGeocodeError(null);
    try {
      const results = await searchGeocode(searchQuery.trim());
      setGeocodeResults(results);
      if (results.length === 0) {
        setGeocodeError('No matching geographic places found. Try manual coordinate entry.');
      }
    } catch {
      setGeocodeError('Geocoding request failed. Please enter coordinates manually.');
    } finally {
      setIsSearchingGeocode(false);
    }
  };

  const handleSelectGeocodeResult = async (res: any) => {
    const newLoc = await addLocation({
      name: res.displayName.split(',')[0],
      locationType: res.type === 'administrative' ? 'district' : 'city',
      country: res.country || 'Global',
      state: res.state || undefined,
      district: res.district || undefined,
      city: res.city || undefined,
      latitude: res.lat,
      longitude: res.lon,
      verificationStatus: 'verified',
      organizationId: activeOrgId
    });
    setSelectedLocationId(newLoc.id);
    onClose();
  };

  const handleCreateCustomLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || isNaN(lon)) {
      setCustomError('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    setIsSubmittingCustom(true);
    try {
      const newLoc = await addLocation({
        name: customName || 'Custom Operational Area',
        locationType: customType,
        country: customCountry || 'Custom Jurisdiction',
        state: customState || undefined,
        district: customDistrict || undefined,
        city: customCity || undefined,
        latitude: lat,
        longitude: lon,
        verificationStatus: 'manual',
        organizationId: activeOrgId
      });
      setSelectedLocationId(newLoc.id);
      onClose();
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card-theme border-theme rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-modal-theme overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h2 className="text-base font-semibold text-main-theme">{t('modals.locationTitle')}</h2>
              <p className="text-xs text-muted-theme">
                {t('modals.locationSubtitle')}
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

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 border-b border-[#DCE5EF] bg-[#F8FAFC] flex items-center gap-2">
          <button
            onClick={() => setMode('saved')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              mode === 'saved'
                ? 'border-[#2563EB] text-[#2563EB] font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t('modals.tabSaved')} ({locations.length})
          </button>
          <button
            onClick={() => setMode('search_online')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              mode === 'search_online'
                ? 'border-[#2563EB] text-[#2563EB] font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t('modals.tabSearch')}
          </button>
          <button
            onClick={() => setMode('manual_custom')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              mode === 'manual_custom'
                ? 'border-[#2563EB] text-[#2563EB] font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t('modals.tabCustom')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {mode === 'saved' && (
            <div className="space-y-3">
              {/* Filter Input & Category Chips */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder={t('modals.searchLocationPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs input-theme rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
                  <button
                    type="button"
                    onClick={() => setTypeFilter('all')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors whitespace-nowrap font-medium ${
                      typeFilter === 'all'
                        ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                        : 'bg-[#E8F2FF] text-[#0F172A] hover:bg-[#d8e8fe] border border-[#DCE5EF]'
                    }`}
                  >
                    {t('modals.allTypes')} ({locations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('city')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors whitespace-nowrap font-medium ${
                      typeFilter === 'city'
                        ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                        : 'bg-[#E8F2FF] text-[#0F172A] hover:bg-[#d8e8fe] border border-[#DCE5EF]'
                    }`}
                  >
                    🏙️ {t('modals.cities')} ({locations.filter((l) => l.locationType === 'city').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('town')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors whitespace-nowrap font-medium ${
                      typeFilter === 'town'
                        ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                        : 'bg-[#E8F2FF] text-[#0F172A] hover:bg-[#d8e8fe] border border-[#DCE5EF]'
                    }`}
                  >
                    🏘️ {t('modals.towns')} ({locations.filter((l) => l.locationType === 'town').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('village')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors whitespace-nowrap font-medium ${
                      typeFilter === 'village'
                        ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                        : 'bg-[#E8F2FF] text-[#0F172A] hover:bg-[#d8e8fe] border border-[#DCE5EF]'
                    }`}
                  >
                    🌾 {t('modals.villages')} (
                    {locations.filter((l) => l.locationType === 'village' || l.locationType === 'checkpoint').length})
                  </button>
                </div>
              </div>

              {/* Location List */}
              <div className="space-y-2 mt-3">
                {filteredSavedLocations.map((loc) => {
                  const isSelected = loc.id === selectedLocationId;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setSelectedLocationId(loc.id);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#E8F2FF] border-[#2563EB] text-[#0F172A] shadow-xs font-medium'
                          : 'bg-white border-[#DCE5EF] hover:bg-[#E8F2FF] hover:border-[#2563EB]/40 text-[#0F172A]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin
                          className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-[#2563EB]' : 'text-muted-theme'}`}
                        />
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-2">
                            <span>{getLocationDisplayName(loc, language)}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-subtle-theme text-muted-theme border-theme">
                              {getLocationTypeName(loc.locationType, language)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-theme mt-0.5">
                            {[loc.city, loc.district, loc.state, loc.country].filter(Boolean).join(', ')}
                          </div>
                          <div className="text-[11px] font-mono text-muted-theme mt-1">
                            {loc.latitude.toFixed(4)}°N, {loc.longitude.toFixed(4)}°E ·{' '}
                            {loc.verificationStatus === 'verified'
                              ? (language === 'hi' ? 'सत्यापित निर्देशांक' : language === 'mr' ? 'प्रमाणित अक्षांश-रेखांश' : 'Verified coordinates')
                              : (language === 'hi' ? 'मैन्युअल प्रविष्टि' : language === 'mr' ? 'मॅन्युअल नोंद' : 'Manual entry')}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredSavedLocations.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-theme">
                    {language === 'hi'
                      ? 'कोई मेल खाता स्थान नहीं मिला। किसी भी शहर या गांव को खोजने के लिए "वैश्विक खोज" टैब पर जाएं।'
                      : language === 'mr'
                      ? 'कोणतेही जुळणारे ठिकाण आढळले नाही. कोणत्याही शहरासाठी किंवा गावासाठी "नकाशा शोध" टॅब वापरा.'
                      : 'No matching location found. Switch to "Search Worldwide" to geocode any town, village, or junction.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'search_online' && (
            <div className="space-y-4">
              <form onSubmit={handleOnlineSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Compass className="w-4 h-4 absolute left-3 top-3 text-muted-theme" />
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'शहर, कस्बा, गांव या पता दर्ज करें (उदा. नागपुर, क्योटो, पुणे)...' : language === 'mr' ? 'शहर, गाव, तालुका किंवा पत्ता प्रविष्ट करा (उदा. नागपूर, पुणे)...' : 'Enter city, town, village, district, or address (e.g., Cairo, Nagpur, Kyoto, Lyon)...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingGeocode || !searchQuery.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50 transition-colors shrink-0 shadow-xs"
                >
                  {isSearchingGeocode ? t('common.loading') : (language === 'hi' ? 'खोजें' : language === 'mr' ? 'शोधा' : 'Search Geocode')}
                </button>
              </form>

              {geocodeError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-[#F59E0B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>{geocodeError}</span>
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2">
                {geocodeResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectGeocodeResult(res)}
                    className="p-3 bg-card-theme border-theme rounded-xl hover:border-[#2563EB]/40 hover:bg-subtle-theme cursor-pointer transition-all shadow-xs"
                  >
                    <div className="text-sm font-medium text-main-theme flex items-center justify-between">
                      <span>{res.displayName.split(',')[0]}</span>
                      <span className="text-[11px] font-mono text-[#2563EB]">
                        {res.lat.toFixed(4)}, {res.lon.toFixed(4)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-theme mt-1 line-clamp-1">{res.displayName}</div>
                    <div className="text-[11px] text-muted-theme mt-1 flex items-center gap-2">
                      <span>{t('modals.customCountry')}: {res.country || 'N/A'}</span>
                      {res.state && <span>· {t('modals.customState')}: {res.state}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'manual_custom' && (
            <form onSubmit={handleCreateCustomLocation} className="space-y-4">
              {customError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {customError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.customName')}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'hi' ? 'उदा. ईस्टर्न हाईवे सेक्टर 4' : language === 'mr' ? 'उदा. पूर्व महामार्ग सेक्टर ४' : 'e.g. Eastern Highway Sector 4'}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.customType')}</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                  >
                    <option value="city">{getLocationTypeName('city', language)}</option>
                    <option value="town">{getLocationTypeName('town', language)}</option>
                    <option value="village">{getLocationTypeName('village', language)}</option>
                    <option value="district">{getLocationTypeName('district', language)}</option>
                    <option value="checkpoint">{getLocationTypeName('checkpoint', language)}</option>
                    <option value="custom">{getLocationTypeName('custom', language)}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.customCountry')}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'hi' ? 'उदा. भारत' : language === 'mr' ? 'उदा. भारत' : 'e.g. India, Japan, Spain'}
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.customState')}</label>
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'उदा. महाराष्ट्र' : language === 'mr' ? 'उदा. महाराष्ट्र' : 'e.g. Maharashtra, Texas'}
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                    className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.customDistrict')}</label>
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'उदा. पुणे' : language === 'mr' ? 'उदा. पुणे' : 'e.g. Pune Rural, Downtown'}
                    value={customDistrict}
                    onChange={(e) => setCustomDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.customLat')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="18.5204"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('modals.customLon')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="73.8567"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-theme">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-muted-theme hover:text-main-theme"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-xs"
                >
                  {isSubmittingCustom ? t('common.loading') : t('modals.customSubmit')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer with Quick Shortcut */}
        <div className="px-6 py-3 border-t border-theme bg-subtle-theme flex items-center justify-between text-xs text-muted-theme">
          <div className="flex items-center gap-1.5">
            <span>
              {language === 'hi'
                ? 'वर्तमान क्षेत्र में नया जंक्शन जोड़ना चाहते हैं?'
                : language === 'mr'
                ? 'सध्याच्या भागात नवीन जंक्शन जोडायचे आहे का?'
                : 'Need a new junction inside active location?'}
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenAddPoint();
            }}
            className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('nav.addJunction')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
