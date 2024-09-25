from fastapi import FastAPI, File, UploadFile,Form
import uvicorn
import requests
from services.speechToText.speechToText import SpeechToText
from services.summarize.summarize import Summarizer
from typing import Dict

app=FastAPI()

@app.get("/")
def home():
    return {"message":"Hello World"}


@app.post("/file_upload")
async def upload(file: UploadFile = File(...)):
    contents=await file.read()
    transcribed_audio=requests.get("http://127.0.0.1:8000/asr_audio",json={"contents":contents})


@app.post("/transcribe")
def transcibe(user:str=Form(...),speech_diarization:str=Form(...), file: UploadFile = File(...)):
    user=user
    audio_data=file.file.read()
    speech_diarization=True if speech_diarization=="true" else False
    if(audio_data):
        stt = SpeechToText(speech_diarization=speech_diarization)
        conversation=stt.generate(audio_data)   
        return {"user":user,"speech_diarization":speech_diarization,"conversation":conversation}
    else:
        return {"message":"No conversation found"}


@app.post("/summarise")
def summarise(data:dict):
    user=data["user"]
    conversation=data["conversation"]
    fast_output=True if data["fast_output"]=="true" else False
    if(conversation):
        summarizer=Summarizer(fast_output=fast_output)
        summary=summarizer.generate_summary(conversation)
        return {"user":user,"fast_output":fast_output,"summary":summary}
    else:
        return {"message":"No conversation found"}


if __name__ == "__main__":
    uvicorn.run(app)
