const { useState, useEffect } = React;

function App() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  useEffect(() => {
    greet();
  }, []);

  const greet = async () => {
    await speakText("Hey how are you? Thank you for chatting today how can I help you?");
    await startConversation();
  };

  const startConversation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = e => {
        setAudioChunks(prev => [...prev, e.data]);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioChunks([]);
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

  const transcribe = async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      return data.text;
    }
    return null;
  };

  const chat = async (text) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }]
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices[0].message.content;
    }
    return null;
  };

  const speakText = async (text) => {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    React.createElement('button', { onClick: handleClick }, 'Click Here')
  );
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));
