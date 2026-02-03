
import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, ArrowRight, Fingerprint, ScanEye, ShieldCheck, Key } from 'lucide-react';
import gsap from 'gsap';
import { Team } from '../types';
import { ADMIN_CREDENTIALS } from '../constants';

interface LoginViewProps {
    currentTeam: Team;
    onLogin: (username: string, isAdmin: boolean) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ currentTeam, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const captchaRef = useRef<HTMLDivElement>(null);

    // Initial Focus & Animation
    useEffect(() => {
        if (!formRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(formRef.current,
                { y: 50, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" }
            );

            gsap.fromTo(".anim-input",
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out", delay: 0.2 }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Turnstile Initialization
    useEffect(() => {
        // Function to verify if turnstile is loaded
        const initTurnstile = () => {
            if (captchaRef.current && (window as any).turnstile) {
                try {
                    // Clear previous instances if any (primitive way)
                    captchaRef.current.innerHTML = '';
                    (window as any).turnstile.render(captchaRef.current, {
                        sitekey: '0x4AAAAAAACXVzz9vq7YbFpi', // Production Site Key
                        theme: 'dark',
                        callback: (token: string) => setCaptchaToken(token),
                        'expired-callback': () => setCaptchaToken(null),
                    });
                } catch (e) {
                    console.error("Turnstile render error:", e);
                }
            }
        };

        // Try to init immediately, and also set a small timeout in case script is async loading
        initTurnstile();
        const timer = setTimeout(initTurnstile, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        if (!captchaToken) {
            alert("Security Check Required: Please complete the CAPTCHA.");
            return;
        }

        setIsLoading(true);
        setStatus('scanning');
        // ... rest of the code ...

        // Check if admin credentials
        const isAdmin = username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;

        // Simulate biometric scan delay
        setTimeout(() => {
            setStatus('success');
            // Success animation before redirect
            gsap.to(formRef.current, {
                scale: 1.05,
                borderColor: '#22c55e',
                boxShadow: '0 0 50px #22c55e',
                duration: 0.3
            });
            setTimeout(() => {
                onLogin(username, isAdmin);
            }, 800);
        }, 1500);
    };

    const tc = currentTeam.color;

    return (
        <div ref={containerRef} className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--team-color)]/10 rounded-full blur-[100px] animate-pulse" style={{ '--team-color': tc } as React.CSSProperties}></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>
            </div>

            {/* Login Card */}
            <div
                ref={formRef}
                className="w-full max-w-md bg-[#0a0a12]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-2xl group"
                style={{ boxShadow: `0 0 40px -10px ${tc}30` }}
            >
                {/* Dynamic Border Gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--team-color)] to-transparent" style={{ '--team-color': tc } as React.CSSProperties}></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Header */}
                <div className="text-center mb-10 relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1a1a24] mb-6 border border-white/5 relative group-hover:border-[var(--team-color)] transition-colors duration-500" style={{ '--team-color': tc } as React.CSSProperties}>
                        {status === 'success' ? (
                            <ShieldCheck size={40} className="text-green-500 animate-in zoom-in duration-300" />
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div className="absolute inset-0 bg-[var(--team-color)] blur-lg opacity-20 animate-pulse" style={{ '--team-color': tc } as React.CSSProperties}></div>
                                {typeof currentTeam.logo === 'string' && currentTeam.logo.startsWith('data:') ? (
                                    <img src={currentTeam.logo} alt={currentTeam.name} className="w-16 h-16 object-cover rounded-full relative z-10" />
                                ) : (
                                    <div className="text-4xl relative z-10">{currentTeam.logo}</div>
                                )}
                            </div>
                        )}

                        {/* Scanning Ring */}
                        {status === 'scanning' && (
                            <div className="absolute inset-0 border-2 border-t-transparent border-[var(--team-color)] rounded-full animate-spin" style={{ '--team-color': tc } as React.CSSProperties}></div>
                        )}
                    </div>

                    <h2 className="text-3xl font-black font-cyber text-white tracking-wide mb-2">
                        {status === 'success' ? 'ACCESS GRANTED' : 'AUTHENTICATION'}
                    </h2>
                    <p className="text-gray-400 text-xs font-mono tracking-[0.2em] uppercase">
                        SECURE UPLINK // {currentTeam.id.toUpperCase()}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                    {/* Username */}
                    <div className="anim-input group/input relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[var(--team-color)] transition-colors" style={{ '--team-color': tc } as React.CSSProperties}>
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="AGENT ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#13131c] border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:border-[var(--team-color)] focus:bg-[#1a1a24] transition-all placeholder:text-gray-600"
                            style={{ '--team-color': tc } as React.CSSProperties}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password */}
                    <div className="anim-input group/input relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[var(--team-color)] transition-colors" style={{ '--team-color': tc } as React.CSSProperties}>
                            <Key size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="ACCESS KEY"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#13131c] border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:border-[var(--team-color)] focus:bg-[#1a1a24] transition-all placeholder:text-gray-600"
                            style={{ '--team-color': tc } as React.CSSProperties}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Captcha */}
                    <div className="anim-input flex justify-center py-2 min-h-[65px]" ref={captchaRef}></div>

                    {/* Submit Button */}
                    <div className="anim-input pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative overflow-hidden h-14 bg-white text-black font-black font-cyber tracking-widest text-lg rounded-lg group/btn hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--team-color)] to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" style={{ '--team-color': tc } as React.CSSProperties}></div>

                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {status === 'scanning' ? (
                                    <>
                                        <ScanEye className="animate-pulse" size={20} /> VERIFYING...
                                    </>
                                ) : status === 'success' ? (
                                    <>
                                        <Lock size={20} className="text-green-600" /> UNLOCKED
                                    </>
                                ) : (
                                    <>
                                        INITIATE LINK <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </div>

                </form>

                {/* Footer Decor */}
                <div className="mt-8 flex justify-center gap-4 text-[10px] text-gray-600 font-mono tracking-widest anim-input">
                    <span className="flex items-center gap-2"><Fingerprint size={12} /> BIOMETRIC_REQ</span>
                    <span>•</span>
                    <span className="flex items-center gap-2"><Lock size={12} /> 256-BIT_ENCRYPT</span>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 p-2">
                    <div className="w-2 h-2 border-t border-l border-white/30"></div>
                </div>
                <div className="absolute top-0 right-0 p-2">
                    <div className="w-2 h-2 border-t border-r border-white/30"></div>
                </div>
                <div className="absolute bottom-0 left-0 p-2">
                    <div className="w-2 h-2 border-b border-l border-white/30"></div>
                </div>
                <div className="absolute bottom-0 right-0 p-2">
                    <div className="w-2 h-2 border-b border-r border-white/30"></div>
                </div>

            </div>
        </div>
    );
};

export default LoginView;
