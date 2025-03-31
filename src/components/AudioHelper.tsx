import React, { useState, useRef, useEffect } from "react";
import useWebSocketStore from "../redux/WebSocketStore";
import './css/AudioHelper.css';
const AudioHelper: React.FC = () => {
    const { setMessage } = useWebSocketStore();
    const [isStreaming, setIsStreaming] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recordedChunks = useRef<Float32Array[]>([]);

    useEffect(() => {
        return () => stopStreaming();
    }, []);

    const startMicrophoneCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000, // ✅ Match Java backend
                    channelCount: 1,   // ✅ Mono
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                }
            });

            mediaStreamRef.current = stream;
            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setPermissionError("Microphone access denied.");
            return false;
        }
    };

    const startStreaming = async () => {
        if (isStreaming) return;

        const hasPermission = await startMicrophoneCapture();
        if (!hasPermission) return;

        ws.current = new WebSocket("ws://localhost:8080/audio"); // ✅ Ensure backend is running

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsStreaming(true);
            startRecording();
        };

        ws.current.onmessage = (event: MessageEvent) => {
            if (event.data instanceof Blob) {
                playReceivedAudio(event.data);
            } else {
                setMessage(event.data); // ✅ Store message in Zustand
                console.log("Server message:", event.data);
            }
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
            setIsStreaming(false);
            stopMicrophoneCapture();
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            stopStreaming();
        };
    };

    const startRecording = () => {
        if (!mediaStreamRef.current) return;
    
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
    
        const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    
        scriptProcessor.onaudioprocess = (event) => {
            const float32Data = event.inputBuffer.getChannelData(0); // ✅ Float32Array
            const pcm16Data = convertFloat32ToPCM16(float32Data); // ✅ Convert to PCM16
            
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(pcm16Data); // ✅ Send PCM16 to server
            }
        };
    
        source.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
    };
    
    
    const convertFloat32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
        const pcm16Array = new Int16Array(float32Array.length);
    
        for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i])); // Clamp values
            pcm16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; // Scale to PCM16
        }
    
        return pcm16Array.buffer; // ✅ Correctly return as ArrayBuffer
    };
    

    const stopStreaming = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.close();
        }
        setIsStreaming(false);
        stopMicrophoneCapture();
    };

    const stopMicrophoneCapture = () => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
    
        if (audioContextRef.current) {
            if (audioContextRef.current.state !== "closed") {
                audioContextRef.current.close().then(() => {
                    console.log("✅ AudioContext closed.");
                }).catch((err) => {
                    console.warn("⚠️ Error closing AudioContext:", err);
                });
            }
            audioContextRef.current = null;
        }
    
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
    
        processAndSendWav(); // Process and send WAV after stopping capture
    };
    

    const processAndSendWav = () => {
        if (recordedChunks.current.length === 0) return;

        const wavBlob = encodeWav(recordedChunks.current, 16000);
        recordedChunks.current = [];

        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(wavBlob); // ✅ Send WAV file to backend
        }
    };

    const encodeWav = (audioData: Float32Array[], sampleRate: number) => {
        const numSamples = audioData.reduce((sum, chunk) => sum + chunk.length, 0);
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);

        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        // WAV file header
        writeString(0, "RIFF");
        view.setUint32(4, 36 + numSamples * 2, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, "data");
        view.setUint32(40, numSamples * 2, true);

        let offset = 44;
        for (const chunk of audioData) {
            for (let i = 0; i < chunk.length; i++) {
                const sample = Math.max(-1, Math.min(1, chunk[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([view], { type: "audio/wav" });
    };

    const playReceivedAudio = (blob: Blob) => {
        const audioUrl = URL.createObjectURL(blob);
        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
        }
    };

    return (
        <div className="audio-content-container">
            <div className="title">Hintify</div>
            <div className="button-container">
                <button className='button' onClick={startStreaming} disabled={isStreaming}>Start</button>
                <button className='button' onClick={stopStreaming} disabled={!isStreaming}>Stop</button>
            </div>
        </div>
    );
};

export default AudioHelper;
