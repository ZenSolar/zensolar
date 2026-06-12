import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Press-and-hold voice dictation using the browser's Web Speech API.
 *
 * - `supported`: true when SpeechRecognition exists on this browser.
 * - `recording`: true while we're actively listening.
 * - `start()`: begin a recording session. Resolves nothing; transcripts
 *   stream into `interim` while recording.
 * - `stop()`: end the recording session and return the final transcript
 *   (empty string if nothing was captured).
 *
 * Designed for "press the mic, talk, release to send" UX. Caller drives
 * start/stop via pointer events.
 */
export function useVoiceDictation() {
  const SR =
    typeof window !== "undefined"
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;
  const supported = !!SR;
  const recRef = useRef<any>(null);
  const finalRef = useRef<string>("");
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    if (!supported || recording) return;
    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = navigator.language || "en-US";
      finalRef.current = "";
      setInterim("");
      setError(null);
      rec.onresult = (e: any) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            finalRef.current += res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }
        setInterim(interimText);
      };
      rec.onerror = (e: any) => {
        setError(e?.error ?? "speech-error");
      };
      rec.onend = () => {
        setRecording(false);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e: any) {
      setError(e?.message ?? "start-failed");
      setRecording(false);
    }
  }, [SR, supported, recording]);

  const stop = useCallback((): string => {
    const rec = recRef.current;
    if (rec) {
      try { rec.stop(); } catch { /* ignore */ }
      recRef.current = null;
    }
    setRecording(false);
    const text = (finalRef.current + " " + interim).trim();
    finalRef.current = "";
    setInterim("");
    return text;
  }, [interim]);

  useEffect(() => {
    return () => {
      const rec = recRef.current;
      if (rec) {
        try { rec.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  return { supported, recording, interim, error, start, stop };
}
