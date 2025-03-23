import React, { useState, ChangeEvent, useRef } from 'react';

const AudioHelper: React.FC = () => {
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const ws = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startStreaming = () => {
        if(!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            ws.current = new WebSocket('ws://localhost:8080/audio');
            ws.current.onopen = () => {
                console.log('Websocket connected!');
                ws.current?.send('start');
                setIsStreaming(true);
            }
            ws.current.onmessage = (event: MessageEvent) => {
                // Handle incoming audio data
                const audioBlob = new Blob([event.data], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsStreaming(false);
            };
        }
    }

    const stopStreaming = () => {
        if(ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send('stop');
            ws.current.close();
            setIsStreaming(false);
        }
    }
    return (
        <div>
            <h1>Real-Time Audio Streaming</h1>
            <button onClick={startStreaming} disabled={isStreaming}>
                Start Streaming
            </button>
            <button onClick={stopStreaming} disabled={!isStreaming}>
                Stop Streaming
            </button>
            <audio ref={audioRef} controls autoPlay />
        </div>
    )
}

export default AudioHelper;
