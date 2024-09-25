from fastapi import FastAPI, File, UploadFile,Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
from services.speechToText.speechToText import SpeechToText
from services.summarize.summarize import Summarizer
from typing import Dict

app=FastAPI()

origins = [
    "http://localhost:3000",  # React app
]

# Add the CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,  # Allow credentials such as cookies
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
def home():
    return {"message":"Hello World"}

@app.post("/transcribe")
def transcibe(user:str=Form(...),speech_diarization:str=Form(...), file: UploadFile = File(...)):
    user=user
    audio_data=file.file.read()
    speech_diarization=True if speech_diarization=="true" else False
    print(speech_diarization)
    if(audio_data):
        stt = SpeechToText(speech_diarization=speech_diarization)
        conversation=stt.generate(audio_data)   
        print(conversation)
        return {"user":user,"speech_diarization":speech_diarization,"conversation":conversation}
    else:
        return {"message":"No conversation found"}


@app.post("/summarise")
def summarise(data:dict):
    user=data["user"]
    conversation=data["conversation"]
    fast_output=True if data["fast_output"]=="true" else False
    print(fast_output)
    if(conversation):
        summarizer=Summarizer(fast_output=fast_output)
        summary=summarizer.generate_summary(conversation)
        print(summary)
        return {"user":user,"fast_output":fast_output,"summary":summary}
    else:
        return {"message":"No conversation found"}


if __name__ == "__main__":
    uvicorn.run(app)
