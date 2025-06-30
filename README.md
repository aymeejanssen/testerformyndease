# Voice Chat App

This simple app demonstrates a voice conversation loop using OpenAI APIs.

## Setup

1. Copy `.env.example` to `.env` and replace `sk-your-key-here` with your actual OpenAI API key. The file should contain a line like `OPENAI_API_KEY=sk-...`.
2. Install dependencies with `npm install`.
3. Start the server with `npm start`.
4. Open your browser at `http://localhost:3000` and click the button.
   The React logic lives in `src/App.tsx` and is compiled to `public/app.js`.

The app will request microphone access and start a conversation using GPT-4, Whisper, and the Nova TTS voice.
