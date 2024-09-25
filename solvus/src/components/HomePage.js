import React, { useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import './HomePage.css';

const HomePage = ({ onLogout }) => {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [memoryOption, setMemoryOption] = useState(false);
  const [diarizationOption, setDiarizationOption] = useState(false);
  const [file, setFile] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Function to handle audio recording
  const handleAudioRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const wavBlob = await convertBlobToWav(audioBlob);
        audioChunksRef.current = [];
        setRecordedAudio(URL.createObjectURL(wavBlob)); // Set URL for playback
        setFile(wavBlob); // Set the recorded file for uploading
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const convertBlobToWav = async (audioBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const byteLength = audioBuffer.length * numChannels * 2 + 44; // 44 bytes for WAV header
    const wavBuffer = new ArrayBuffer(byteLength);
    const view = new DataView(wavBuffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, byteLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
    view.setUint16(32, numChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, byteLength - 44, true); // Data chunk size

    // Write PCM samples
    let offset = 44; // Start after header
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        view.setInt16(offset, channelData[i] * 32767, true); // Convert float to PCM
        offset += 2;
      }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Function to handle file upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile.name.endsWith('.wav')) {
      setFile(uploadedFile);
      setRecordedAudio(URL.createObjectURL(uploadedFile));
    } else {
      console.log('Please upload a valid WAV file.');
    }
  };

  // Remove the uploaded or recorded file
  const handleRemoveFile = () => {
    setFile(null);
    setRecordedAudio(null);
  };

  // Function to handle transcription and summarization
  const handleTranscribe = async () => {
    if (!file) {
      alert("Please upload or record an audio file.");
      return;
    }

    setIsTranscribing(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', 'test_user');
    formData.append('speech_diarization', diarizationOption.toString());

    try {
      const transcribeResponse = await fetch('http://127.0.0.1:8000/transcribe', {
        method: 'POST',
        body: formData,
      });
      const transcribeData = await transcribeResponse.json();

      setIsTranscribing(false);

      if (transcribeData.conversation) {
        setIsSummarizing(true);

        const summaryData = {
          user: 'test_user',
          conversation: transcribeData.conversation,
          fast_output: memoryOption.toString(),
        };

        const summariseResponse = await fetch('http://127.0.0.1:8000/summarise', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(summaryData),
        });

        const summariseData = await summariseResponse.json();
        setTranscription(summariseData.summary);
      } else {
        alert('No conversation found in the audio.');
      }
    } catch (error) {
      console.error('Error in transcription:', error);
    } finally {
      setIsTranscribing(false);
      setIsSummarizing(false);
    }
  };

  // Handle memory option change
  const handleMemoryOptionChange = (e) => {
    setMemoryOption(e.target.checked);
  };

  // Handle diarization option change
  const handleDiarizationOptionChange = (e) => {
    setDiarizationOption(e.target.checked);
  };

  // Handle focus event to change text color to black
  const handleTextFocus = (e) => {
    e.target.style.color = 'white';
  };

  return (
    <div className="home-page">
      <header className="header">
        <h1 className="logo">Mediscribe</h1>
        <Button onClick={onLogout} className="logout-button">
          Logout
        </Button>
      </header>
      <main className="main-content">
        <div className="container">
          <div className="row">
            {/* Left Column: Record Audio and Upload WAV */}
            <div className="col-md-4 record-upload-section">
              <h3>Record Audio</h3>
              <Button
                onClick={handleAudioRecord}
                className={`record-button mb-3 ${isRecording ? 'recording' : ''}`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>

              {recordedAudio && (
                <div>
                  <h5>Recorded Audio:</h5>
                  <audio controls src={recordedAudio} />
                </div>
              )}

              <h3>OR</h3>
              <h3 className="mt-4">Upload WAV File</h3>
              <input
                type="file"
                accept=".wav"
                onChange={handleFileUpload}
                className="upload-input"
              />

              {file && (
                <div className="mt-3">
                  <p><strong>Uploaded File:</strong> {file.name || 'Recorded Audio'}</p>
                  <Button variant="danger" onClick={handleRemoveFile}>
                    Remove File
                  </Button>
                </div>
              )}
            </div>

            {/* Middle Column: Transcribe Button */}
            <div className="col-md-4 d-flex flex-column align-items-center justify-content-center">
              <Button onClick={handleTranscribe} className="transcribe-button mb-4" disabled={isTranscribing || isSummarizing}>
                {isTranscribing ? 'Transcribing...' : isSummarizing ? 'Summarizing...' : 'Transcribe and Summarize'}
              </Button>

              {/* Radio Buttons for Options */}
              <div className="transcribe-options">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="lessMemory"
                    onChange={handleMemoryOptionChange}
                  />
                  <label className="form-check-label" htmlFor="lessMemory">
                    User smaller model
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="diarization"
                    onChange={handleDiarizationOptionChange}
                  />
                  <label className="form-check-label" htmlFor="diarization">
                    Speech Diarization
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Transcription Result */}
            <div className="col-md-4 transcription-result">
              <h3>Transcription Result</h3>
              <div
                className="transcription-box"
                onFocus={handleTextFocus}
                contentEditable={true}
                dangerouslySetInnerHTML={{ __html: transcription }}
                style={{ minHeight: '200px', border: '1px solid #ccc', padding: '10px' }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
