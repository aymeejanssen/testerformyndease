import { useState, useEffect, useRef } from 'react';

export default function App() {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    greet();
  }, []);

  const greet = async () => {
    await speakText('Hey how are you? Thank you for chatting today how can I help you?');
    await startConversation();
  };

  const startConversation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        const transcript = await transcribe(blob);
        if (transcript) {
          const reply = await chat(transcript);
          if (reply) {
            await speakText(reply);
          }
        }
        recorder.start();
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone error', err);
    }
  };

  const transcribe = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.text as string;
    }
    return null;
  };

  const chat = async (text: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply as string;
    }
    return null;
  };

  const speakText = async (text: string) => {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    }
  };

  const handleClick = async () => {
    if (!recording) {
      await greet();
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  return <button onClick={handleClick}>Click Here</button>;
}
