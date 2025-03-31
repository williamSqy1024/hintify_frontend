import React, { useState, useRef, useEffect } from "react";
import useWebSocketStore from "../redux/WebSocketStore";

const ConversationContainer: React.FC = () => {
    const message = useWebSocketStore((state: any) => state.message);
    console.log('message', message);
    useEffect(() => {
        console.log("Current message in component:", message); // ✅ Debugging
    }, [message]);
    return (
        <div>
        <h2>Latest Message from Python:</h2>
        <p>{message || "Waiting for message..."}</p>
    </div>
    )
}

export default ConversationContainer;