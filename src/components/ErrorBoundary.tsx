import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HeatShield AI Caught UI Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const storedLang = typeof window !== 'undefined' ? localStorage.getItem('heatshield_language') || 'en' : 'en';
      const isMr = storedLang === 'mr';
      const isHi = storedLang === 'hi';

      const title = isMr
        ? 'हीटशील्ड एआय सुरक्षित रिकव्हरी'
        : isHi
        ? 'हीटशील्ड एआई सुरक्षित पुनर्प्राप्ति'
        : 'HeatShield AI Safe Recovery';

      const desc = isMr
        ? 'इंटरफेसमध्ये अनपेक्षित तांत्रिक त्रुटी आली. स्थानिक सुरक्षा डेटा सुरक्षित आहे.'
        : isHi
        ? 'इंटरफेस में अप्रत्याशित तकनीकी त्रुटि आई। स्थानीय सुरक्षा डेटा सुरक्षित है।'
        : 'The interface encountered an unexpected client error. Local state and safety data remain preserved.';

      const reloadBtn = isMr
        ? 'अॅप्लिकेशन पुन्हा लोड करा'
        : isHi
        ? 'एप्लिकेशन पुनः लोड करें'
        : 'Reload Application';

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-[#14B8A6] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="text-xs text-slate-300 mt-1">
                {desc}
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 font-mono text-[11px] text-red-400 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{reloadBtn}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
