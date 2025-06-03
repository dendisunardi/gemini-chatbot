import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

export function useAI() {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (!API_KEY) {
                throw new Error("NEXT_PUBLIC_API_KEY is not set. Please ensure this environment variable is configured in your .env.local file.");
            }
            const genAI = new GoogleGenAI({ apiKey: API_KEY });
            setAi(genAI);
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI:", e);
            const errorMessage = e instanceof Error ? e.message : "API Key might be missing or invalid.";
            setError(`Error: Could not initialize AI. ${errorMessage}`);
        }
    }, []);

    return { ai, error };
}