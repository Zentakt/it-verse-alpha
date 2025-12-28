
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Scan, Keyboard, Camera, RefreshCw, X, CheckCircle2, Zap, AlertTriangle, Brain, ArrowRight, ShieldCheck } from 'lucide-react';
import { Team, Challenge } from '../types';
import ChallengeGames from './ChallengeGames';

interface QRScannerProps {
  currentTeam: Team;
  challenges: Challenge[];
}

// --- SHADERS FOR AR HUD (Retained) ---
const RETICLE_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RETICLE_FRAGMENT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uScan; 
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
    float scanline = sin(vUv.y * 50.0 + uTime * 5.0) * 0.5 + 0.5;
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float pulse = sin(angle * 4.0 + uTime * 2.0);
    float beam = smoothstep(0.0, 0.1, abs(vUv.y - uScan));
    vec3 finalColor = uColor * fresnel * 2.0;
    finalColor += uColor * scanline * 0.2;
    finalColor += uColor * pulse * 0.3 * fresnel;
    float alpha = fresnel * 0.8 + 0.2;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const BEAM_FRAGMENT = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;
  void main() {
    float center = 1.0 - abs(vUv.y - 0.5) * 2.0;
    float beam = pow(center, 8.0);
    float noise = sin(vUv.x * 20.0 + uTime * 10.0) * 0.5 + 0.5;
    vec3 col = uColor * beam * 2.0;
    col += uColor * noise * beam * 0.5;
    gl_FragColor = vec4(col, beam * 0.8);
  }
`;

const QRScanner: React.FC<QRScannerProps> = ({ currentTeam, challenges }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Scanning State
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [showGameOverlay, setShowGameOverlay] = useState(false);
  const [challengeSolved, setChallengeSolved] = useState(false);
  
  // UI State
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [answerError, setAnswerError] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<any>(null); 
  const scanIntervalRef = useRef<any>(null);

  const tc = currentTeam.color;

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 } 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsScanning(true);
            setHasPermission(true);
            initBarcodeDetector();
        };
      }
    } catch (err: any) {
      console.error("Camera Error:", err);
      setHasPermission(false);
      setCameraError(err.name === 'NotAllowedError' ? 'Permission Denied' : 'Camera Unavailable');
    }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setIsScanning(false);
  };

  const initBarcodeDetector = () => {
      // @ts-ignore
      if ('BarcodeDetector' in window) {
          // @ts-ignore
          const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
          scanIntervalRef.current = setInterval(async () => {
              if (videoRef.current && !scannedResult && !activeChallenge) {
                  try {
                      const barcodes = await detector.detect(videoRef.current);
                      if (barcodes.length > 0) {
                          handleScanSuccess(barcodes[0].rawValue);
                      }
                  } catch (e) {}
              }
          }, 200);
      } else {
          console.warn("BarcodeDetector not supported. Fallback to manual.");
      }
  };

  const handleScanSuccess = (code: string) => {
      if (scannedResult || activeChallenge) return;
      navigator.vibrate?.(200); 

      // Check if Challenge
      if (code.startsWith('CHALLENGE:')) {
          const id = code.split(':')[1];
          const challenge = challenges.find(c => c.id === id);
          if (challenge) {
              setActiveChallenge(challenge);
              if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
              
              // NEW LOGIC: Check for Mini-Game
              if (challenge.gameType && challenge.gameType !== 'none') {
                  setShowGameOverlay(true);
              } else {
                  // Standard Riddle/Input
                  animateHudLock('#00ffff');
              }
              return;
          }
      }

      // Normal Scan
      setScannedResult(code);
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      animateHudLock('#22c55e'); // Green for success
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(manualCode.trim().length > 0) {
          handleScanSuccess(manualCode);
          setShowManual(false);
      }
  };

  const handleChallengeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeChallenge) return;

      if (userAnswer.trim().toLowerCase() === activeChallenge.answer.toLowerCase()) {
          setChallengeSolved(true);
          setAnswerError(false);
          animateHudLock('#22c55e');
      } else {
          setAnswerError(true);
          navigator.vibrate?.([100, 50, 100]); // Error buzz
          setTimeout(() => setAnswerError(false), 500);
      }
  };

  const handleGameComplete = (success: boolean) => {
      setShowGameOverlay(false);
      if (success) {
          setChallengeSolved(true);
          animateHudLock('#22c55e');
      } else {
          resetScanner();
      }
  };

  const resetScanner = () => {
      setScannedResult(null);
      setActiveChallenge(null);
      setChallengeSolved(false);
      setShowGameOverlay(false);
      setUserAnswer('');
      setManualCode('');
      initBarcodeDetector();
      
      // Reset HUD
      if (hudRef.current) {
          const baseColor = new THREE.Color(tc);
          const { reticleGroup, scanBeam } = hudRef.current;
          reticleGroup.traverse((child: any) => {
              if (child.isMesh && child.material.uniforms) {
                  gsap.to(child.material.uniforms.uColor.value, { r: baseColor.r, g: baseColor.g, b: baseColor.b, duration: 0.5 });
              }
          });
          gsap.to(scanBeam.scale, { y: 1, duration: 0.5 });
      }
  };

  // Helper for HUD animation
  const animateHudLock = (colorHex: string) => {
      if (hudRef.current) {
          const { reticleGroup, scanBeam } = hudRef.current;
          const c = new THREE.Color(colorHex);
          reticleGroup.traverse((child: any) => {
              if (child.isMesh && child.material.uniforms) {
                  gsap.to(child.material.uniforms.uColor.value, { r: c.r, g: c.g, b: c.b, duration: 0.2 });
              }
          });
          gsap.to(reticleGroup.rotation, { z: 0, duration: 0.5, ease: "back.out(2)" });
          gsap.to(reticleGroup.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.3, yoyo: true, repeat: 1 });
          gsap.to(scanBeam.scale, { y: 0, duration: 0.2 });
      }
  };

  // --- THREE.JS AR OVERLAY (Same as before) ---
  useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
      camera.position.z = 5;
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const group = new THREE.Group();
      scene.add(group);
      const colorObj = new THREE.Color(tc);

      const ringGeo = new THREE.TorusGeometry(1.8, 0.05, 16, 64);
      const reticleMat = new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uColor: { value: colorObj }, uScan: { value: 0.5 } },
          vertexShader: RETICLE_VERTEX, fragmentShader: RETICLE_FRAGMENT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, reticleMat);
      group.add(ring);

      const brackets = new THREE.Group();
      const bracketGeo = new THREE.BoxGeometry(0.5, 0.1, 0.1);
      const bracketMat = new THREE.MeshBasicMaterial({ color: tc });
      for (let i = 0; i < 4; i++) {
          const corner = new THREE.Group();
          const h = new THREE.Mesh(bracketGeo, bracketMat);
          const v = new THREE.Mesh(bracketGeo, bracketMat);
          v.rotation.z = Math.PI / 2; v.position.set(-0.2, 0.2, 0); h.position.set(0, 0, 0);
          corner.add(h); corner.add(v);
          corner.position.x = (i === 0 || i === 3) ? -2.2 : 2.2;
          corner.position.y = (i === 0 || i === 1) ? 2.2 : -2.2;
          corner.rotation.z = i * (Math.PI / 2);
          brackets.add(corner);
      }
      group.add(brackets);

      const beamGeo = new THREE.PlaneGeometry(6, 0.4);
      const beamMat = new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uColor: { value: colorObj } },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: BEAM_FRAGMENT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });
      const scanBeam = new THREE.Mesh(beamGeo, beamMat);
      group.add(scanBeam);

      hudRef.current = { reticleGroup: group, scanBeam, material: reticleMat };

      const clock = new THREE.Clock();
      let frameId = 0;
      const animate = () => {
          frameId = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          if (!scannedResult && !activeChallenge) {
              ring.rotation.z = -t * 0.5; ring.rotation.x = Math.sin(t * 0.5) * 0.2;
              brackets.scale.setScalar(1.0 + Math.sin(t * 4.0) * 0.05);
              scanBeam.position.y = Math.sin(t * 2.0) * 2.0;
              reticleMat.uniforms.uTime.value = t; beamMat.uniforms.uTime.value = t;
          } else {
              beamMat.uniforms.uTime.value = t; 
          }
          renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);
      return () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(frameId);
          renderer.dispose();
      };
  }, [tc, scannedResult, activeChallenge]);

  useEffect(() => { return () => stopCamera(); }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_90%)] pointer-events-none z-10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none z-10 opacity-20"></div>

        <div className="relative z-20 flex-1 flex flex-col p-6 md:p-8">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[var(--team-color)] font-mono text-xs font-bold tracking-[0.2em] animate-pulse" style={{ '--team-color': tc } as React.CSSProperties}>
                        <Zap size={14} /> AR UPLINK
                    </div>
                    <h2 className="text-2xl font-black font-cyber text-white tracking-wide drop-shadow-md">DATA SCANNER</h2>
                </div>
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-red-500 animate-[ping_1s_infinite]' : 'bg-gray-500'}`}></div>
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{isScanning ? 'LIVE FEED' : 'OFFLINE'}</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
                {!hasPermission && !cameraError && (
                    <div className="text-center bg-black/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl max-w-sm animate-in zoom-in duration-300">
                        <Camera size={48} className="mx-auto mb-4 text-[var(--team-color)]" style={{ '--team-color': tc } as React.CSSProperties} />
                        <h3 className="text-xl font-bold text-white mb-2 font-cyber">INITIALIZE CAMERA</h3>
                        <p className="text-gray-400 text-sm mb-6 font-ui">Grant permission to access the neural link interface for QR code scanning.</p>
                        <button onClick={startCamera} className="w-full py-4 bg-white text-black font-black font-cyber tracking-widest text-lg rounded hover:bg-gray-200 transition-transform active:scale-95">ACTIVATE</button>
                    </div>
                )}

                {cameraError && (
                    <div className="text-center bg-red-900/90 backdrop-blur-xl p-8 rounded-2xl border border-red-500 shadow-2xl max-w-sm animate-in zoom-in">
                        <AlertTriangle size={48} className="mx-auto mb-4 text-white" />
                        <h3 className="text-xl font-bold text-white mb-2 font-cyber">CONNECTION FAILED</h3>
                        <p className="text-red-200 text-sm mb-6 font-ui">{cameraError}</p>
                        <button onClick={startCamera} className="w-full py-3 bg-white text-red-900 font-bold tracking-widest text-sm rounded hover:bg-gray-200">RETRY CONNECTION</button>
                    </div>
                )}

                {/* --- GAME OVERLAY --- */}
                {showGameOverlay && activeChallenge && (
                    <ChallengeGames 
                        challenge={activeChallenge} 
                        onComplete={handleGameComplete} 
                        onClose={resetScanner}
                    />
                )}

                {/* --- STANDARD CHALLENGE MODE UI (Legacy Input) --- */}
                {activeChallenge && !showGameOverlay && !challengeSolved && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-lg bg-[#0a0a10] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                            <div className="bg-cyan-900/20 p-6 border-b border-cyan-500/20 flex items-start gap-4">
                                <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400"><Brain size={24} /></div>
                                <div>
                                    <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">MISSION DIRECTIVE</div>
                                    <h2 className="text-2xl font-black font-cyber text-white leading-none">{activeChallenge.title}</h2>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <p className="text-gray-400 font-ui text-sm leading-relaxed border-l-2 border-cyan-500/50 pl-4">{activeChallenge.description}</p>
                                
                                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">PROBLEM / RIDDLE</div>
                                    <div className="font-mono text-white text-lg">{activeChallenge.question}</div>
                                </div>

                                <form onSubmit={handleChallengeSubmit} className="space-y-4">
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            placeholder="ENTER SOLUTION..."
                                            className={`w-full bg-[#13131c] border rounded-lg py-4 px-5 text-white font-mono text-lg focus:outline-none transition-all placeholder:text-gray-700 ${answerError ? 'border-red-500 animate-[shake_0.5s]' : 'border-white/10 focus:border-cyan-500'}`}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600 pointer-events-none">NO SPACES</div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button type="button" onClick={resetScanner} className="px-6 py-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-sm transition-colors">ABORT</button>
                                        <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black font-cyber tracking-widest text-lg rounded-lg transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] flex items-center justify-center gap-2">
                                            DECRYPT <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CHALLENGE SUCCESS SCREEN --- */}
                {challengeSolved && (
                    <div className="absolute inset-0 flex items-center justify-center z-[60] bg-green-950/90 backdrop-blur-xl animate-in zoom-in duration-300 p-6">
                        <div className="text-center max-w-lg w-full">
                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-green-500/20 mb-8 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-[ping_2s_infinite] opacity-50"></div>
                                <ShieldCheck size={64} className="text-green-400 relative z-10" />
                            </div>
                            
                            <h2 className="text-5xl md:text-6xl font-black font-cyber text-white mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                                PROBLEM SOLVED
                            </h2>
                            
                            <div className="bg-black/40 border border-green-500/30 p-6 rounded-xl mb-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-[shimmer_2s_infinite]"></div>
                                <p className="text-green-400 font-mono text-lg md:text-xl font-bold leading-relaxed tracking-wide animate-pulse">
                                    APPROACH THE NEAREST <br/> SINCOTECS OFFICER <br/> FOR CHECKING
                                </p>
                            </div>

                            <button 
                                onClick={resetScanner}
                                className="bg-white text-green-900 font-black font-cyber tracking-widest text-xl px-12 py-5 rounded-full hover:scale-105 transition-transform shadow-2xl"
                            >
                                DISMISS
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STANDARD RESULT MODAL (Non-Challenge) --- */}
                {scannedResult && !activeChallenge && !challengeSolved && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 p-6">
                        <div className="w-full max-w-md bg-[#05050a]/95 backdrop-blur-xl border-2 border-green-500 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-in scale-95 duration-200">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-[bounce_1s_infinite]">
                                    <CheckCircle2 size={40} className="text-green-500" />
                                </div>
                            </div>
                            <h3 className="text-center text-2xl font-black font-cyber text-white mb-2">TARGET ACQUIRED</h3>
                            <div className="bg-black/50 p-4 rounded border border-white/10 mb-6 text-center">
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">DECODED SIGNAL</div>
                                <code className="text-green-400 font-mono text-lg break-all">{scannedResult}</code>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full py-4 bg-green-600 text-white font-black font-cyber tracking-widest text-lg rounded hover:bg-green-500 transition-colors" onClick={() => alert("Points added!")}>CLAIM BOUNTY</button>
                                <button onClick={resetScanner} className="w-full py-3 bg-transparent text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-white">SCAN NEXT TARGET</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            {hasPermission && !scannedResult && !activeChallenge && (
                <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex justify-between items-center bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                        <button onClick={() => { setScannedResult(null); startCamera(); }} className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><RefreshCw size={20} /></button>
                        <div className="text-[10px] font-mono text-gray-500 tracking-[0.2em]">AUTO-SCAN ACTIVE</div>
                        <button onClick={() => setShowManual(!showManual)} className={`p-3 rounded-lg transition-colors ${showManual ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}><Keyboard size={20} /></button>
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${showManual ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <form onSubmit={handleManualSubmit} className="bg-[#1a1a24] p-4 rounded-xl border border-white/10 flex gap-2">
                            <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="ENTER OVERRIDE CODE" className="flex-1 bg-black border border-white/10 rounded-lg px-4 text-white font-mono text-sm focus:border-[var(--team-color)] focus:outline-none transition-colors" style={{ '--team-color': tc } as React.CSSProperties} />
                            <button type="submit" className="bg-white text-black font-bold px-6 rounded-lg text-xs uppercase tracking-wider hover:bg-gray-200">Submit</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default QRScanner;
