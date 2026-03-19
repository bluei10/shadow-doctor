import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-pro")
response = model.generate_content("Say hello in one sentence.")
print("Gemini response:", response.text)
print("API key works correctly!")