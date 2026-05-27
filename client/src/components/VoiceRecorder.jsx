import React, { useState, useRef } from "react";

export default function VoiceRecorder({ from, to, socket, onSend }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        // send file back to parent
        onSend({
          mediaUrl: url,
          mediaType: "audio/webm",
          blob,
        });
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="voice-box">
      {!recording && !audioURL && (
        <button className="mic-btn" onClick={startRecording}>
          🎤
        </button>
      )}

      {recording && (
        <button className="stop-btn" onClick={stopRecording}>
          ⏹ Stop
        </button>
      )}

      {audioURL && (
        <div className="voice-preview">
          <audio controls src={audioURL}></audio>
          <button className="send-voice" onClick={() => setAudioURL(null)}>
            ✔ Sent
          </button>
        </div>
      )}
    </div>
  );
}

