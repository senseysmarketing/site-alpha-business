import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SpeechRecognitionCtor = new () => any;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

interface Options {
  lang?: string;
  onTranscript: (chunk: { interim: string; final: string }) => void;
}

export function useSpeechRecognition({ lang = "pt-BR", onTranscript }: Options) {
  const [isSupported] = useState<boolean>(() => !!getCtor());
  const [isRecording, setIsRecording] = useState(false);
  const recRef = useRef<any>(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  const start = useCallback(async () => {
    const Ctor = getCtor();
    if (!Ctor) {
      toast.error("Seu navegador não suporta gravação por voz. Tente Chrome ou Edge.");
      return;
    }
    if (recRef.current) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      cbRef.current({ interim, final });
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Permissão de microfone negada.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error("Erro ao gravar. Tente novamente.");
      }
    };
    rec.onend = () => {
      recRef.current = null;
      setIsRecording(false);
    };

    try {
      rec.start();
      recRef.current = rec;
      setIsRecording(true);
    } catch {
      toast.error("Não foi possível iniciar a gravação.");
    }
  }, [lang]);

  useEffect(() => () => {
    try {
      recRef.current?.abort();
    } catch {
      /* noop */
    }
  }, []);

  return { isSupported, isRecording, start, stop };
}
