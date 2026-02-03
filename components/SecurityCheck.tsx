import React, { useEffect, useRef, useState } from 'react';

interface SecurityCheckProps {
    onVerified: () => void;
}

const SecurityCheck: React.FC<SecurityCheckProps> = ({ onVerified }) => {
    const captchaRef = useRef<HTMLDivElement>(null);
    const [rayId] = useState(() => Math.random().toString(16).substr(2, 16));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Define global callback
        (window as any).turnstileCallback = () => {
            if (captchaRef.current && (window as any).turnstile) {
                try {
                    (window as any).turnstile.render(captchaRef.current, {
                        sitekey: '0x4AAAAAAACXVzz9vq7YbFpi',
                        theme: 'dark',
                        callback: (token: string) => {
                            setTimeout(onVerified, 800);
                        },
                        'error-callback': () => {
                            setError("Connection validation failed. Please refresh.");
                        }
                    });
                } catch (e) {
                    console.error("Turnstile render error", e);
                }
            }
        };

        // Inject script dynamically
        const scriptId = 'turnstile-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=turnstileCallback";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        } else if ((window as any).turnstile) {
            // Already loaded, trigger manually
            (window as any).turnstileCallback();
        }

        return () => {
            // Cleanup if needed, but usually scripts persist
            delete (window as any).turnstileCallback;
        };
    }, [onVerified]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#1a1a1a] text-[#d9d9d9] font-sans flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif' }}>
            <div className="max-w-screen-md w-full">

                {/* Header */}
                <h1 className="text-4xl font-medium mb-2 text-white">itverse.site</h1>
                <h2 className="text-2xl font-normal mb-6 text-[#d9d9d9]">Performing security verification</h2>

                {/* Description */}
                <p className="text-base mb-8 leading-relaxed max-w-2xl">
                    This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.
                </p>

                {/* Captcha Widget */}
                <div className="mb-12 min-h-[65px] flex flex-col justify-center">
                    <div ref={captchaRef} id="turnstile-widget"></div>
                    <div className="mt-2 text-sm text-red-400">{error}</div>
                </div>

            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full p-6 border-t border-white/5 bg-[#1a1a1a]">
                <div className="max-w-screen-md mx-auto flex flex-col md:flex-row justify-between items-start md:items-center text-gray-500 text-xs gap-2">
                    <div className="font-mono">Ray ID: <span className="text-gray-400">{rayId}</span></div>
                    <div>
                        Performance & Security by <a href="#" className="underline hover:text-gray-300">Cloudflare</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityCheck;
