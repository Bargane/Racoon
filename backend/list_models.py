import os
import google.generativeai as genai
from dotenv import load_dotenv
import google.api_core.exceptions

# Charger la clé API depuis le fichier .env
load_dotenv()

try:
    # On configure l'API avec la clé depuis les variables d'environnement
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    print("Client Gemini initialisé avec succès.")
except KeyError:
    print("Erreur : La clé API Gemini n'a pas été trouvée. Assurez-vous de l'avoir définie dans le fichier .env")
    print("Veuillez vérifier votre clé API et la configuration de votre environnement.")
    exit()

working_models = []
failed_models = []

print("--- Test de la génération de contenu pour les modèles disponibles ---")

# Parcourir tous les modèles qui supportent la génération de contenu
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"\nTest du modèle : {m.name}...")
        try:
            model = genai.GenerativeModel(m.name)
            response = model.generate_content("Bonjour !", request_options={'timeout': 10})
            if response.text:
                print("  -> SUCCÈS !")
                working_models.append(m.name)
            else:
                print("  -> ÉCHEC : Réponse vide.")
                failed_models.append((m.name, "Réponse vide"))
        except Exception as e:
            print(f"  -> ÉCHEC : {type(e).__name__} - {e}")
            failed_models.append((m.name, str(e).split('\n')[0])) # Prend la première ligne de l'erreur

print("\n\n--- RÉSUMÉ DES TESTS ---")
print("\n✅ Modèles fonctionnels :")
if working_models:
    for model in working_models:
        print(f"  - {model}")
else:
    print("  Aucun modèle n'a fonctionné pour la génération de contenu texte.")

print("\n❌ Modèles en échec :")
if failed_models:
    for model, reason in failed_models:
        print(f"  - {model} (Raison: {reason})")
else:
    print("  Tous les modèles testés ont fonctionné.")
print("\n------------------------")