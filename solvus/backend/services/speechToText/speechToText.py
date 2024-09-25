from transformers import WhisperProcessor, WhisperForConditionalGeneration
from pydub import AudioSegment
from pyannote.audio import Pipeline
from dotenv import load_dotenv
import os
import whisper
import numpy as np
import torch
from io import BytesIO

load_dotenv("/Users/rachitdas/Desktop/solvus_assignment/solvus/backend/.env.local")
token = os.getenv("HUGGING_FACE_TOKEN")

class SpeechToText():
    def __init__(self,speech_diarization=False):
        self.model = whisper.load_model("small")
        # self.model.config.forced_decoder_ids = None
        self.speech_diarization = speech_diarization
        self.conversation=None
        self.new_sampling_rate = 16000
        if(speech_diarization):
            self.pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=token,
            )
            self.speaker_transcriptions = {
                "SPEAKER_00": [],
                "SPEAKER_01": [],
            }

    def transcribe_audio(self, voice_data=None,audio_segment=None):
        if(not self.speech_diarization):
            audio = BytesIO(voice_data)
            audio = AudioSegment.from_file(audio, format="wav")
            audio_segment = audio.set_frame_rate(self.new_sampling_rate)

        # Convert pydub audio segment to raw data in NumPy format
        samples = np.array(audio_segment.get_array_of_samples())

        # Normalize audio to float32 format (expected by Whisper)
        samples = samples.astype(np.float32) / np.iinfo(samples.dtype).max

        # Ensure it's a mono audio (required by Whisper)
        if audio_segment.channels > 1:
            samples = samples.reshape((-1, audio_segment.channels)).mean(axis=1)
        if(self.speech_diarization):

            # Convert to a tensor and prepare for Whisper
            audio_tensor = torch.from_numpy(samples).to(torch.float32)

            # Use Whisper's helper to pad/trim and transcribe
            if(self.speech_diarization):
                audio_tensor = whisper.pad_or_trim(audio_tensor)
            mel = whisper.log_mel_spectrogram(audio_tensor).to(self.model.device)

            # Transcribe the preprocessed audio
            options = whisper.DecodingOptions(
                language="en", fp16=False
            )  # Customize options if needed
            result = whisper.decode(self.model, mel, options)

            # Extract text from the result
            transcription = result.text
            return transcription
        else:
            samples = samples.astype(np.float32)

            # Transcribe the audio data using Whisper's built-in transcribe function
            result = self.model.transcribe(samples)
            return result["text"]

    def make_conversation(self):
        speaker1_transcription_1 = self.speaker_transcriptions.get("SPEAKER_00", [])
        speaker2_transcription_2 = self.speaker_transcriptions.get("SPEAKER_01", [])
        conversation=""
        while speaker1_transcription_1 or speaker2_transcription_2:
            if speaker1_transcription_1:
                conversation +="Doctor:" + speaker1_transcription_1.pop(0) + "\n"
            if speaker2_transcription_2:
                conversation +="Patient:" + speaker2_transcription_2.pop(0) + "\n"
        return conversation

    def generate(self,voice_data):
        if(self.speech_diarization):
            audio = BytesIO(voice_data)
            diarization = self.pipeline(audio)
            audio=AudioSegment.from_file(audio,format="wav")
            audio = audio.set_frame_rate(self.new_sampling_rate)
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                samples = audio[turn.start * 1000 : turn.end * 1000]

                # Transcribe the audio segment using Whisper
                transcription = self.transcribe_audio(audio_segment=samples)

                # Store the transcriptions for different speakers
                if speaker in self.speaker_transcriptions:
                    self.speaker_transcriptions[speaker].append(transcription)
                else:
                    self.speaker_transcriptions[speaker].append(transcription)
            self.conversation=self.make_conversation()
        else:
            self.conversation=self.transcribe_audio(voice_data=voice_data)
        return self.conversation


# if __name__ == "__main__":
#     stt = SpeechToText(speech_diarization=True)
#     with open("/Users/rachitdas/Desktop/solvus_assignment/Play.ht - Good Morning, doctor. May I come in?.wav", "rb") as f:
#         voice_data = f.read()
#     print(stt.generate(voice_data))
