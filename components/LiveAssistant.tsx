
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Volume2, Radio, X, Loader2, PlayCircle, MessageSquare } from 'lucide-react';
import { SchoolProfile } from '../types';

interface LiveAssistantProps {
  schoolProfile: SchoolProfile;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ schoolProfile }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Manual encode/decode implementation as required
  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('active');
            setIsActive(true);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }

            if (message.serverContent?.modelTurn?.parts[0]?.text) {
                const text = message.serverContent.modelTurn.parts[0].text;
                setTranscript(prev => [...prev.slice(-4), `AI: ${text}`]);
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            setStatus('error');
          },
          onclose: () => {
            stopSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are the Easy School AI Assistant for ${schoolProfile.name}. Help administrators with student records, school management advice, and educational workflows. Be professional and supportive.`,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setStatus('error');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
    setIsSpeaking(false);
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-[500px]">
        
        {/* Left Side: Interaction Zone */}
        <div className="flex-1 bg-slate-900 p-8 flex flex-col items-center justify-center relative">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {status === 'active' ? 'Live Connection Active' : status === 'connecting' ? 'Establishing Secure Link' : 'System Ready'}
            </span>
          </div>

          {/* Visualizer Area */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {isActive ? (
                <>
                    {/* Pulsing circles when speaking */}
                    {isSpeaking && (
                        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                    )}
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl shadow-blue-500/20 ${isSpeaking ? 'bg-blue-600 scale-110' : 'bg-slate-800'}`}>
                        {isSpeaking ? <Volume2 size={48} className="text-white animate-bounce" /> : <Mic size={48} className="text-blue-500" />}
                    </div>
                </>
            ) : (
                <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-700">
                    <Radio size={40} className="text-slate-600" />
                </div>
            )}
          </div>

          <div className="mt-12 text-center">
            {status === 'idle' && (
                <button 
                  onClick={startSession}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-xl shadow-blue-900/20 flex items-center gap-3 transition-transform active:scale-95"
                >
                  <PlayCircle size={24} /> Start Live Session
                </button>
            )}
            {status === 'connecting' && (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                    <span className="text-slate-400 font-medium">Connecting to Gemini...</span>
                </div>
            )}
            {status === 'active' && (
                <button 
                  onClick={stopSession}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-8 py-3 rounded-full font-bold flex items-center gap-3 transition-all"
                >
                  <X size={24} /> End Session
                </button>
            )}
            {status === 'error' && (
                <div className="space-y-4">
                    <p className="text-red-400 font-medium">Unable to establish connection.</p>
                    <button onClick={startSession} className="text-blue-400 underline font-bold">Try Again</button>
                </div>
            )}
          </div>
        </div>

        {/* Right Side: Transcript/Status */}
        <div className="w-full md:w-80 bg-white border-l border-slate-100 p-6 flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <MessageSquare size={16} /> Recent Activity
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
                {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center px-4">
                        <Loader2 size={32} className="opacity-10 mb-2" />
                        <p className="text-xs italic">Start a session to see real-time interaction logs</p>
                    </div>
                ) : (
                    transcript.map((line, i) => (
                        <div key={i} className={`p-3 rounded-2xl text-xs ${line.startsWith('AI:') ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'}`}>
                            <span className="font-bold block mb-1 opacity-50 uppercase tracking-tighter">
                                {line.startsWith('AI:') ? 'Assistant' : 'You'}
                            </span>
                            {line.replace('AI: ', '')}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Mic size={16} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Input Device</span>
                        <p className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">Default Microphone</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Loader2 size={24} className="animate-spin-slow" /></div>
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Low Latency</h4>
                <p className="text-xs text-slate-500 mt-1">Talk naturally without waiting for standard text generation.</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><MicOff size={24} /></div>
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Privacy Controlled</h4>
                <p className="text-xs text-slate-500 mt-1">Your microphone is only active when the session is started.</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Volume2 size={24} /></div>
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Voice Output</h4>
                <p className="text-xs text-slate-500 mt-1">Receive spoken guidance from a friendly AI school consultant.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
