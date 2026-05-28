import { Mic, Square } from "lucide-react";
import { useRef, useState } from "react";
import IconButton from "../ui/IconButton";

export default function VoiceRecorder({ onSend, disabled = false }) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach((track) => track.stop());

      if (blob.size > 0) onSend?.({ blob });
      setRecording(false);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  return (
    <IconButton
      title={recording ? "Stop recording" : "Record voice"}
      onClick={recording ? stopRecording : startRecording}
      disabled={disabled}
      className={recording ? "bg-rose-500/20 text-rose-100" : ""}
    >
      {recording ? <Square size={18} /> : <Mic size={19} />}
    </IconButton>
  );
}
