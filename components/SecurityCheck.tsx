import React, { useEffect, useRef, useState } from 'react';

interface SecurityCheckProps {
    onVerified: () => void;
}

const SecurityCheck: React.FC<SecurityCheckProps> = ({ onVerified }) => {
    const captchaRef = useRef<HTMLDivElement>(null);
    const [rayId] = useState(() => Math.random().toString(16).substr(2, 16));

    useEffect(() => {
        // Double-check if Turnstile script is loaded
        const checkTurnstile = setInterval(() => {
            if ((window as any).turnstile) {
                clearInterval(checkTurnstile);

                try {
                    if (captchaRef.current) captchaRef.current.innerHTML = '';

                    (window as any).turnstile.render(captchaRef.current, {
                        sitekey: '0x4AAAAAAACXVzz9vq7YbFpi', // Production Key
                        theme: 'dark',
                        callback: (token: string) => {
                            setTimeout(onVerified, 500);
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
        <div className="fixed inset-0 z-[9999] bg-black text-white font-sans flex flex-col items-center justify-center p-4">
            <div className="max-w-screen-md w-full">

                {/* Header */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4">itverse.site</h1>
                <h2 className="text-2xl md:text-3xl font-medium mb-8">Performing security verification</h2>

                {/* Description */}
                <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed max-w-2xl">
                    This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.
                </p>

                {/* Captcha Widget */}
                <div className="mb-12" style={{ minHeight: '65px' }}>
                    <div ref={captchaRef}></div>
                </div>

            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full p-6 border-t border-white/10 bg-black">
                <div className="max-w-screen-md mx-auto flex flex-col md:flex-row justify-between items-start md:items-center text-gray-500 text-xs gap-2">
                    <div className="font-mono">Ray ID: <span className="text-gray-300">{rayId}</span></div>
                    <div>
                        Performance & Security by <a href="#" className="underline hover:text-gray-300">Cloudflare</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityCheck;
