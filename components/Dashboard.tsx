
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, WeatherData, LocationInfo, RecommendationStatus } from '../types';
import { fetchWeather, searchLocation, reverseGeocode, getWeatherDescription } from '../services/weatherService';
import { canAccessCity, recordCityAccess, getCityLimitInfo } from '../services/cityLimitService';
import { MANDATORY_SPORTS } from '../constants';
import { getSportRecommendation, getStatusText } from '../utils/recommendation';

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitMessage, setLimitMessage] = useState<string>('');
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isCurrentLocation, setIsCurrentLocation] = useState(true);

  // Helper para parsear fechas de Open-Meteo sin errores de zona horaria
  const parseDate = (dateStr: string) => {
    // Reemplazamos guiones por barras o añadimos la hora para forzar interpretación local
    return new Date(dateStr.replace(/-/g, '\/'));
  };

  const initWeather = useCallback(async (lat: number, lon: number, name?: string, fromCurrentLocation: boolean = false) => {
    setLoading(true);
    try {
      const detectedName = name || await reverseGeocode(lat, lon);
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      setLocation({ lat, lon, name: detectedName });
      setIsCurrentLocation(fromCurrentLocation);

      // Registrar acceso a la ciudad (solo si no es ubicación actual)
      if (!fromCurrentLocation && user.id && user.email) {
        try {
          await recordCityAccess(user.id, user.email, detectedName, lat, lon, fromCurrentLocation);
        } catch (error) {
          console.error('Error registrando acceso a ciudad:', error);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.id, user.email]);

  const [geoError, setGeoError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setGeoError(null);

    if (!("geolocation" in navigator)) {
      setGeoError("Tu navegador no soporta geolocalización.");
      initWeather(40.4168, -3.7038, 'Madrid (Manual)', false);
      return;
    }

    const geoOptions = {
      enableHighAccuracy: false, // Menos exigente para que sea más rápido
      timeout: 8000,
      maximumAge: 30000 // Aceptar ubicaciones de hasta 30 segundos de antigüedad
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('✅ Ubicación obtenida');
        initWeather(pos.coords.latitude, pos.coords.longitude, undefined, true);
      },
      (err) => {
        console.warn('❌ Error GPS:', err.code, err.message);
        let msg = "No pudimos obtener tu ubicación.";
        if (err.code === 1) msg = "Has denegado el permiso de ubicación. Por favor, actívalo en tu navegador.";
        if (err.code === 3) msg = "La solicitud de ubicación tardó demasiado.";

        setGeoError(msg);
        initWeather(40.4168, -3.7038, 'Madrid (Fallback)', false);
      },
      geoOptions
    );
  }, [initWeather]);

  useEffect(() => {
    // Intentar obtener automáticamente al inicio, pero sin ser intrusivos
    requestLocation();
  }, [requestLocation]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;
    const results = await searchLocation(searchQuery);
    setSearchResults(results);
  };

  const selectLocation = async (loc: LocationInfo) => {
    // Verificar límite antes de permitir la búsqueda
    const limitCheck = await canAccessCity(user.id, user.email, loc.name, false);

    if (!limitCheck.allowed) {
      // Límite alcanzado - Mostrar ubicación actual
      setShowLimitWarning(true);
      setLimitMessage(limitCheck.message || 'Has alcanzado el límite de ciudades.');
      setSearchResults([]);
      setSearchQuery('');

      // Obtener ubicación actual
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          initWeather(pos.coords.latitude, pos.coords.longitude, undefined, true);
        },
        () => {
          // Si falla GPS, usar Madrid como fallback
          initWeather(40.4168, -3.7038, 'Madrid (Default)', false);
        }
      );

      // Ocultar warning después de 5 segundos
      setTimeout(() => setShowLimitWarning(false), 5000);
      return;
    }

    // Si está permitido, proceder normalmente
    initWeather(loc.lat, loc.lon, loc.name, false);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedDay(0);
    setShowLimitWarning(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Sincronizando con satélites...</p>
      </div>
    );
  }

  const currentDayData = weather[selectedDay];
  const filteredSports = MANDATORY_SPORTS.filter(sport => user.sports.includes(sport.id));

  // Formateador de fecha para el encabezado
  const getFullDateLabel = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).toUpperCase();
  };

  const getDayLabel = (dateStr: string, index: number) => {
    if (index === 0) return 'HOY';
    const date = parseDate(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Barra de Búsqueda y Ubicación */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <input
              type="text"
              placeholder="Buscar ciudad (ej: Barcelona, Londres...)"
              className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>

          <button
            onClick={requestLocation}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl transition-all border border-slate-700 hover:border-teal-500/50"
            title="Usar mi ubicación actual"
          >
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-bold text-sm uppercase tracking-wider">Mi Ubicación</span>
          </button>
        </div>

        {geoError && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-orange-200 text-sm font-medium">{geoError}</p>
          </div>
        )}

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            {searchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => selectLocation(res)}
                className="w-full text-left px-6 py-4 hover:bg-slate-800 border-b border-slate-800 last:border-0 transition-colors flex items-center gap-3 group"
              >
                <span className="text-slate-500 group-hover:text-teal-400 transition-colors text-xl">📍</span>
                <div>
                  <div className="text-white font-bold">{res.name}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-widest">{res.lat.toFixed(2)}, {res.lon.toFixed(2)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Warning de Límite Alcanzado */}
      {showLimitWarning && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-amber-400 font-bold text-lg mb-1">Límite de Exploración Alcanzado</h4>
              <p className="text-slate-300 text-sm mb-2">{limitMessage}</p>
              <p className="text-slate-400 text-xs">
                📍 Mostrando el clima de tu ubicación actual. Puedes seguir consultando ciudades que ya hayas buscado antes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Widget de Clima */}
      <div className="bg-[#0b1215] border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-6">
            <div>
              <p className="text-teal-400 font-bold tracking-[0.2em] text-[10px] mb-3">
                {selectedDay === 0 ? 'CLIMA ACTUAL' : 'PRONÓSTICO'} - {getFullDateLabel(currentDayData.time)}
              </p>
              <h2 className="text-4xl font-black text-white flex items-center gap-3 flex-wrap">
                <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {location?.name}
                {isCurrentLocation && (
                  <span className="text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full">
                    📍 TU UBICACIÓN
                  </span>
                )}
              </h2>
            </div>

            <div className="flex items-end gap-6">
              <h2 className="text-8xl font-bold text-white tracking-tighter">{Math.round(currentDayData?.temp ?? 0)}°C</h2>
              <div className="pb-3 space-y-1">
                <p className="text-2xl text-slate-100 font-semibold">{getWeatherDescription(currentDayData?.condition ?? 0)}</p>
                <div className="flex gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Viento: {currentDayData?.wind} km/h</span>
                  <span>Lluvia: {currentDayData?.rain} mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Días (Incluso más reducido) */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 no-scrollbar items-center">
            {weather.map((w, i) => {
              const isActive = selectedDay === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`min-w-[56px] px-2 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all duration-300 ${isActive
                    ? 'bg-teal-500 text-[#0b1215] scale-105 shadow-[0_5px_15px_rgba(20,184,166,0.3)]'
                    : 'bg-slate-900/40 text-slate-500 border border-slate-800/50 hover:bg-slate-800'
                    }`}
                >
                  <span className={`text-[9px] font-black tracking-tighter ${isActive ? 'text-[#0b1215]' : 'text-slate-400'}`}>
                    {getDayLabel(w.time, i)}
                  </span>
                  <span className="text-sm font-bold">{Math.round(w.temp)}°</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid de Recomendaciones Deportivas */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-black text-white tracking-tight">Deportes Sugeridos</h3>
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(20,184,166,1)]"></span>
            Tolerancia <span className="text-white ml-1">{user.tolerance === 'low' ? 'Baja' : user.tolerance === 'moderate' ? 'Media' : 'Alta'}</span>
          </div>
        </div>

        {filteredSports.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredSports.map((sport) => {
              const status = getSportRecommendation(sport, currentDayData, user.tolerance);
              const statusText = getStatusText(status);
              return (
                <div key={sport.id} className="group bg-[#111827]/40 border border-slate-800/60 rounded-[1.5rem] overflow-hidden hover:border-teal-500/30 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
                  <div className="relative h-28 sm:h-32">
                    <img src={sport.imageUrl} alt={sport.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/10 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <span className="text-2xl filter drop-shadow-md">{sport.icon}</span>
                      <span className="font-bold text-white text-sm tracking-tight">{sport.name}</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex items-center justify-between bg-slate-900/20">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${status === '🟢' ? 'bg-green-500/5 text-green-400 border-green-500/20' :
                      status === '🟡' ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20' :
                        'bg-red-500/5 text-red-400 border-red-500/20'
                      }`}>
                      {statusText}
                    </span>
                    <span className="text-xl">{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-[2rem] p-16 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sin deportes seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
