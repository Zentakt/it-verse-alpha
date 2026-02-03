import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Lock, Globe } from 'lucide-react';

interface SecurityCheckProps {
    onVerified: () => void;
}

const SecurityCheck: React.FC<SecurityCheckProps> = ({ onVerified }) => {
    const captchaRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'initializing' | 'verifying' | 'success'>('initializing');

    useEffect(() => {
        // Double-check if Turnstile script is loaded
        const checkTurnstile = setInterval(() => {
            if ((window as any).turnstile) {
                clearInterval(checkTurnstile);
                setStatus('verifying');

                try {
                    // Primitive clear
                    if (captchaRef.current) captchaRef.current.innerHTML = '';

                    (window as any).turnstile.render(captchaRef.current, {
                        sitekey: '0x4AAAAAAACXVzz9vq7YbFpi', // Your Production Key
                        theme: 'dark',
                        callback: (token: string) => {
                            setStatus('success');
                            setTimeout(onVerified, 800); // Short delay to show success state
                        },
                    });
                } catch (e) {
                    console.error("Turnstile render error:", e);
                }
            }
        }, 100);

        return () => clearInterval(checkTurnstile);
    }, [onVerified]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#05050a] flex items-center justify-center p-4 text-white font-sans">
            <div className="max-w-md w-full bg-[#0a0a12] border border-white/10 rounded-xl p-8 shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center border border-white/10">
                        {status === 'success' ? (
                            <ShieldCheck className="text-green-500 animate-in zoom-in" size={24} />
                        ) : (
                            <Lock className="text-gray-400" size={24} />
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">DDoS Protection</h1>
                        <p className="text-xs text-gray-500 font-mono mt-1">CLOUDFLARE_SECURE_NODE</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Checking if the site connection is secure. This verification is required to proceed.
                    </p>

                    {/* Captcha Container */}
                    <div className="min-h-[65px] flex justify-center bg-[#05050a] rounded-lg p-2 border border-white/5">
                        <div ref={captchaRef}></div>
                    </div>

                    {status === 'success' && (
                        <div className="text-center text-green-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                            Verification Successful
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600">
                    <div className="flex items-center gap-2">
                        <Globe size={12} />
                        <span>Ray ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                    </div>
                    <div>Performance & Security by Cloudflare</div>
                </div>

                {/* Top loader bar */}
                {status !== 'success' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <div className="h-full bg-purple-500/50 w-1/3 animate-[shimmer_2s_infinite]"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityCheck;
