import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bot,
  Send,
  AlertTriangle,
  Sparkles,
  Info,
  ShieldAlert,
  Droplets,
  Clock,
  ExternalLink,
  Flame,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { getLocationDisplayName } from '../services/translations';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: string;
  model?: string;
}

function formatInlineMarkdown(text: string): React.ReactNode[] {
  // Parse **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-main-theme">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**') && part.length >= 2) {
      return (
        <em key={i} className="italic text-secondary-theme">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-subtle-theme border border-theme font-mono text-[11px] text-teal-600 dark:text-teal-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdownContent(content: string) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-•*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5">
              <span className="text-teal-600 dark:text-teal-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{formatInlineMarkdown(itemText)}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5">
              <span className="font-mono font-semibold text-[#2563EB] shrink-0">{numMatch[1]}.</span>
              <span className="flex-1">{formatInlineMarkdown(numMatch[2])}</span>
            </div>
          );
        }

        // Header / title
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-main-theme text-xs mt-2 mb-0.5">
              {formatInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        return <p key={idx}>{formatInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

function getInitialGreeting(locName: string, temp: number, humidity: number, lang: string): string {
  if (lang === 'mr') {
    return `नमस्कार, पर्यवेक्षक महोदय. मी आपला हीटशील्ड एआय सुरक्षा अधिकारी आहे. मी **${locName}** (${temp.toFixed(1)}°C, ${humidity}% आर्द्रता) साठी उष्मा ताण गणना, ड्युटी रोटेशन मार्गदर्शक, पाणी पिण्याचे वेळापत्रक आणि तातडीचा उष्माघात प्रथमोपचार यात मदत करू शकतो.\n\nआज मी आपल्या ड्युटी नियोजनात कशी मदत करू?`;
  }
  if (lang === 'hi') {
    return `नमस्ते, सुपरवाइजर महोदय। मैं आपका हीटशील्ड एआई सुरक्षा अधिकारी हूँ। मैं **${locName}** (${temp.toFixed(1)}°C, ${humidity}% आर्द्रता) के लिए हीट स्ट्रेस गणना, ड्यूटी रोटेशन दिशा-निर्देश, जलपान समय-सारणी, एवं आपातकालीन हीटस्ट्रोक उपचार में सहायता कर सकता हूँ।\n\nआज मैं आपके ड्यूटी नियोजन में किस प्रकार सहयोग करूँ?`;
  }
  return `Hello, Supervisor. I am your HeatShield AI Safety Officer. I can assist with occupational heat stress calculations, officer rotation guidelines, hydration schedules, and emergency heatstroke triage for **${locName}** (${temp.toFixed(1)}°C, ${humidity}% RH).\n\nHow can I support your duty planning today?`;
}

export const NugenAssistantView: React.FC = () => {
  const { selectedLocation, currentLocationWeather, currentLocationDutyPoints, activeOrg, language, t } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_1',
      sender: 'assistant',
      text: getInitialGreeting(
        getLocationDisplayName(selectedLocation, language),
        currentLocationWeather.temperature,
        currentLocationWeather.relativeHumidity,
        language
      ),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'demo'
    }
  ]);

  // Update initial greeting if user switches language and hasn't chatted yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'init_1') {
        return [
          {
            id: 'init_1',
            sender: 'assistant',
            text: getInitialGreeting(
              getLocationDisplayName(selectedLocation, language),
              currentLocationWeather.temperature,
              currentLocationWeather.relativeHumidity,
              language
            ),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'demo'
          }
        ];
      }
      return prev;
    });
  }, [language, selectedLocation, currentLocationWeather.temperature, currentLocationWeather.relativeHumidity]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nugenStatus, setNugenStatus] = useState<{
    configured: boolean;
    provider: string;
    status: string;
    message: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check Nugen backend status on load
  useEffect(() => {
    fetch('/api/nugen/status')
      .then((res) => res.json())
      .then((data) => setNugenStatus(data))
      .catch(() =>
        setNugenStatus({
          configured: false,
          provider: 'Nugen Intelligence',
          status: 'demo_mode',
          message: 'Offline Safety Engine'
        })
      );
  }, []);

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      // Build location and weather context with language parameter
      const context = {
        locationName: selectedLocation.name,
        country: selectedLocation.country,
        temperature: currentLocationWeather.temperature,
        humidity: currentLocationWeather.relativeHumidity,
        windSpeed: currentLocationWeather.windSpeed,
        riskCategory: currentLocationWeather.temperature >= 38 ? 'High' : 'Moderate',
        dutyPointsCount: currentLocationDutyPoints.length,
        organization: activeOrg.name,
        language
      };

      const resp = await fetch('/api/nugen/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          context
        })
      });

      if (!resp.ok) {
        throw new Error(`API responded with ${resp.status}`);
      }

      const data = await resp.json();

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: data.mode,
        model: data.model
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_err_${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Safety Assistant response unavailable: ${err.message}. Please check local emergency contacts if heat illness is suspected.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: 'error'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    t('nugen.q1'),
    t('nugen.q2'),
    t('nugen.q3'),
    t('nugen.q4')
  ];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-main-theme">{t('nugen.title')}</h1>
                {nugenStatus?.configured ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] border border-emerald-200 dark:border-emerald-800 font-semibold">
                    {t('nugen.statusLive')}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-[#F59E0B] border border-amber-200 dark:border-amber-800 font-semibold">
                    {t('nugen.statusDemo')}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-theme mt-0.5">
                {t('nugen.subtitle')}
              </p>
            </div>
          </div>

          <a
            href="https://docs.nugen.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-theme hover:text-[#2563EB] flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>Nugen Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* API Key Status Notice */}
        {!nugenStatus?.configured && (
          <div className="mt-4 p-3 bg-subtle-theme border border-theme rounded-lg text-xs text-secondary-theme flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-main-theme">
                {language === 'hi' ? 'पारदर्शी सुरक्षा मोड:' : language === 'mr' ? 'पारदर्शक सुरक्षा मोड:' : 'Zero-Fake Status Transparency:'}{' '}
              </strong>
              {language === 'hi'
                ? 'हीटशील्ड एआई वर्तमान में स्थानीय विशेषज्ञ सुरक्षा सलाहकार इंजन पर चल रहा है। लाइव न्यूजेन इंटेलिजेंस सक्षम करने हेतु सर्वर वातावरण में NUGEN_API_KEY सेट करें।'
                : language === 'mr'
                ? 'हीटशील्ड एआई सध्या स्थानिक तज्ज्ञ सुरक्षा सल्लागार इंजिनवर चालत आहे. थेट न्यूजेन इंटेलिजन्स सक्षम करण्यासाठी सर्व्हर वातावरणात NUGEN_API_KEY सेट करा.'
                : 'HeatShield AI is currently running with the local expert safety advisor. To enable live inference from Nugen Intelligence, set NUGEN_API_KEY in server environment variables.'}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl flex flex-col h-[520px] overflow-hidden">
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#2563EB] text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-subtle-theme text-main-theme border border-theme rounded-tl-none shadow-xs'
                }`}
              >
                {renderMarkdownContent(msg.text)}

                <div
                  className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
                    msg.sender === 'user'
                      ? 'border-blue-400/40 text-blue-100'
                      : 'border-theme text-muted-theme'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <span>
                      {msg.mode === 'live_nugen'
                        ? 'Nugen LLM'
                        : msg.mode === 'gemini_flash'
                        ? 'Gemini 2.5 Flash'
                        : language === 'hi'
                        ? 'हीटशील्ड नियम इंजन'
                        : language === 'mr'
                        ? 'हीटशील्ड नियम इंजिन'
                        : 'HeatShield Rule Engine'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 justify-start animate-in fade-in">
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-subtle-theme border border-theme rounded-xl p-3 text-xs text-muted-theme flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-500" />
                <span>{t('nugen.thinking')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="p-3 bg-subtle-theme border-t border-theme flex items-center gap-2 overflow-x-auto">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-card-theme border-theme text-secondary-theme hover:text-[#2563EB] hover:border-[#2563EB]/40 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50 shadow-xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-card-theme border-t border-theme">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={t('nugen.inputPlaceholder')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs input-theme rounded-lg placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nugen.send')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
