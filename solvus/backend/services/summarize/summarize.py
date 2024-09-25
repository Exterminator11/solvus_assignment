from ollama import generate
import numpy as np
from transformers import pipeline
import torch

class Summarizer():
    def __init__(self,fast_output=True):
        self.fast_output=fast_output
        if torch.cuda.is_available():
            self.device = torch.device("cuda")  # NVIDIA CUDA
            print("Using GPU (CUDA):", torch.cuda.get_device_name(0))
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")  # Apple Metal (MPS)
            print("Using GPU (MPS/Metal)")
        else:
            self.device = torch.device("cpu")  # Default to CPU
            print("Using CPU")
        if(self.fast_output):
            self.pipeline =pipeline(
                "summarization",
                model="philschmid/bart-large-cnn-samsum",
                device=self.device,
            )

    def generate_summary(self,conversation):
        if(self.fast_output):
            return self.pipeline(conversation)[0]["summary_text"]
        else:
            prompt = f"""
            You are a transcriber and need to summarise a conversation between a doctor and a patient.
            {conversation} 
            """

            # Generate a summary of the conversation
            summary = generate(model="mistral:latest", prompt=prompt)
            return summary["response"]

if __name__ == "__main__":
    summarizer=Summarizer(fast_output=False)
    conversation = """
Speaker 1:Good morning.
Speaker 2:Good morning, Doctor.
Speaker 1:Hello.
Speaker 2:May I come in?
Speaker 1:You do look quite pale this morning.
Speaker 2:Yes, Doctor.
Speaker 1:Okay, let me check.
Speaker 2:I've not been feeling well for the past few days.
Speaker 1:Apply pressure on the stomach and check for pain. Does it hurt here?
Speaker 2:I've been having a stomach ache for a few days and feeling a bit dizzy since yesterday.
Speaker 1:While we were suffering from a stomach infection, that's the reason we were having a stomach ache and also getting busy. Did you change your diet recently or have something unhealthy?
Speaker 2:Yes, Doctor. The pain may as a sharpest.
Speaker 1:Okay, so you're probably suffering from food poisoning. Since the food stalls and fares are quite unhygienic, there's a high chance those uncovered food might have caused food poisoning.
Speaker 2:Actually, I went to a fair last week and ate food from the snail cell.
Speaker 1:That's good.
Speaker 2:I think I will never eat from any unhygienic place in the future.
Speaker 1:I'm prescribing some medicines, have them for one week and come back for a checkup next week, and please try to avoid spicy and fried foods for now.
Speaker 2:Okay doctor, thank you.
Speaker 1:Let's go!
    """
    print(summarizer.generate_summary(conversation))
