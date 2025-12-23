import os
import google.generativeai as genai
from dotenv import load_dotenv

# Charger la clé API depuis le fichier .env
load_dotenv()
try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError:
    print("Erreur : La clé API Gemini n'a pas été trouvée.")
    exit()

print("--- Modèles disponibles supportant 'generateContent' ---")

# Parcourir tous les modèles et n'afficher que ceux qui sont pertinents
for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(f"- {m.name}")

print("----------------------------------------------------")