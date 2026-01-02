
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Volume2, Radio, X, Loader2, PlayCircle, MessageSquare, Sparkles } from 'lucide-react';
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

  const SUGGESTIONS = [
    "How do I add a new student?",
    "Show me how to manage academic sessions.",
    "Help me configure student ID rules.",
    "Explain the exam term settings."
  ];

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
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-[550px]">
        
        {/* Left Side: Interaction Zone */}
        <div className="flex-1 bg-slate-900 p-8 flex flex-col items-center justify-center relative">
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {status === 'active' ? 'Live Link Active' : status === 'connecting' ? 'Establishing Tunnel' : 'AI Ready'}
            </span>
          </div>

          {/* Visualizer Area */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            {isActive ? (
                <>
                    {/* Pulsing circles when speaking */}
                    {isSpeaking && (
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping"></div>
                    )}
                    <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl shadow-blue-500/20 ${isSpeaking ? 'bg-blue-600 scale-110' : 'bg-slate-800'}`}>
                        {isSpeaking ? <Volume2 size={56} className="text-white animate-bounce" /> : <Mic size={56} className="text-blue-500" />}
                    </div>
                </>
            ) : (
                <div className="w-36 h-36 rounded-full bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-700">
                    <Radio size={48} className="text-slate-700" />
                </div>
            )}
          </div>

          <div className="mt-12 text-center w-full px-8">
            {status === 'idle' && (
                <button 
                  onClick={startSession}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/40 flex items-center gap-3 transition-all active:scale-95 mx-auto"
                >
                  <PlayCircle size={20} /> Initialize Voice Session
                </button>
            )}
            {status === 'connecting' && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-blue-500 animate-spin" />
                    <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Calling Gemini...</span>
                </div>
            )}
            {status === 'active' && (
                <button 
                  onClick={stopSession}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all mx-auto"
                >
                  <X size={20} /> Disconnect
                </button>
            )}
            
            {/* Quick Suggestions at the bottom of the active zone */}
            <div className="mt-10 pt-8 border-t border-slate-800/50 w-full overflow-x-auto no-scrollbar pb-2">
               <div className="flex gap-3 justify-center min-w-max">
                 {SUGGESTIONS.map((s, idx) => (
                    <button key={idx} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold border border-slate-700 transition-all active:scale-95 flex items-center gap-2">
                       <Sparkles size={12} className="text-blue-500" /> {s}
                    </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Transcript/Status */}
        <div className="w-full md:w-96 bg-white border-l border-slate-100 p-8 flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <MessageSquare size={16} className="text-blue-600" /> AI Log History
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-5 scrollbar-thin pr-2">
                {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center px-6">
                        <div className="p-4 bg-slate-50 rounded-3xl mb-4"><Loader2 size={40} className="opacity-10" /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Awaiting Interaction</p>
                    </div>
                ) : (
                    transcript.map((line, i) => (
                        <div key={i} className={`p-5 rounded-[2rem] text-sm animate-in slide-in-from-right-4 ${line.startsWith('AI:') ? 'bg-blue-50 text-blue-900 border border-blue-100' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                            <span className="font-black text-[9px] block mb-2 uppercase tracking-widest opacity-40">
                                {line.startsWith('AI:') ? 'Easy School AI' : 'System Administrator'}
                            </span>
                            <p className="leading-relaxed">{line.replace('AI: ', '')}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-200">
                        <Mic size={20} />
                    </div>
                    <div className="flex-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mic Status</span>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">System Optimized</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-5 transition-transform hover:-translate-y-1">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><Sparkles size={24} /></div>
            <div>
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Real-time Advice</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">Ask about school policies or record management workflows.</p>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-5 transition-transform hover:-translate-y-1">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><MicOff size={24} /></div>
            <div>
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Secure Audio</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">Processing is local and session-based for your security.</p>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-5 transition-transform hover:-translate-y-1">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner"><Volume2 size={24} /></div>
            <div>
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Voice Guidance</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">Human-like spoken responses for a natural administrative assistant.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
