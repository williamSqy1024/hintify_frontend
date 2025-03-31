import { create } from "zustand";

interface WebSocketState {
    message: string | null;
    setMessage: (message: string) => void;
    clearMessage: () => void;
}

const useWebSocketStore = create<WebSocketState>((set) => ({
    message: null,
    setMessage: (message) => {
        console.log("Updating message:", message); // ✅ Debug log
        set({ message });
    },
    clearMessage: () => set({ message: null }),
}));

export default useWebSocketStore;

export {};
