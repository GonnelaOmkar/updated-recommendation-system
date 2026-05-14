import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

print("--- Available Models ---")
for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(m.name)
print("------------------------")

try:
    model_info = genai.get_model('models/gemini-pro-latest')
    if 'generateContent' in model_info.supported_generation_methods:
        print("\n✅ Success! 'gemini-pro' is available and supports generateContent.")
    else:
        print("\n❌ Warning: 'gemini-pro' found, but it does not support generateContent.")
except Exception as e:
    print(f"\n❌ Error: Could not find or verify 'gemini-pro'. Details: {e}")