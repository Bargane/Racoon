import os
import google.generativeai as genai
from dotenv import load_dotenv

print("--- Lancement du test de l'API Gemini ---")

# 1. Charger la clé API
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("\nERREUR: Clé API non trouvée dans le fichier .env.")
    print("Veuillez vérifier votre fichier backend/.env")
    exit()

try:
    genai.configure(api_key=api_key)
    print("Clé API chargée et configurée.")
except Exception as e:
    print(f"\nERREUR lors de la configuration de l'API: {e}")
    exit()

# 2. Initialiser le modèle
try:
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    print("Modèle 'gemini-2.5-flash-lite' initialisé.")
except Exception as e:
    print(f"\nERREUR lors de l'initialisation du modèle: {e}")
    exit()

# 3. Envoyer un prompt simple
try:
    print("\nEnvoi d'un prompt simple ('Quelle est la capitale de la France ?')...")
    response = model.generate_content("Quelle est la capitale de la France ?")
    
    print("\n--- RÉPONSE DE L'API ---")
    print(response.text)
    print("------------------------")
    print("\nSUCCÈS : La communication avec l'API Gemini fonctionne !")

except Exception as e:
    print(f"\nERREUR lors de la génération de contenu: {e}")
    print("\nÉCHEC : La communication avec l'API a échoué.")

print("\n--- Fin du test ---")