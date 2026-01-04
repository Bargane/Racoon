import os
import google.genai as genai
from dotenv import load_dotenv

def test_models():
    """
    Teste une liste de modèles Gemini pour voir s'ils sont accessibles
    et supportent la génération de contenu texte.
    Affiche un résumé clair à la fin.
    """
    print("--- Lancement du test des modèles Gemini ---")
    
    working_models = []
    failed_models = []

    # 1. Charger la clé API
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\nERREUR: Clé API non trouvée. Vérifiez votre fichier .env.")
        return

    try:
        genai.configure(api_key=api_key)
        print("Clé API configurée avec succès.")
    except Exception as e:
        print(f"\nERREUR lors de la configuration de l'API: {e}")
        return

    # 2. Liste des modèles à tester
    models_to_test = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash-tts", # Devrait échouer (Text-to-Speech)
        "gemini-2.5-flash",
        "gemini-3-flash",
        "gemini-robotics-er-1.5-preview",
        "gemma-3-12b",
        "gemma-3-1b",
        "gemma-3-27b",
        "gemma-3-2b",
        "gemma-3-4b",
        "gemini-2.5-flash-native-audio-dialog", # Devrait échouer (Audio)
    ]

    # 3. Boucle de test et collecte des résultats
    for model_name in models_to_test:
        print(f"\n--- Test du modèle : {model_name} ---")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("test", request_options={'timeout': 20})
            if response.text: # Vérifier si la réponse n'est pas vide
                print(f"SUCCÈS : Le modèle '{model_name}' a répondu.")
                working_models.append(model_name)
            else:
                print(f"ÉCHEC : Le modèle '{model_name}' a répondu mais avec un contenu vide.")
                failed_models.append((model_name, "Réponse vide"))
        except Exception as e:
            print(f"ÉCHEC : Le modèle '{model_name}' a retourné une erreur.\n      Raison : {e}")
            failed_models.append((model_name, str(e).split('\n')[0])) # Prend la première ligne de l'erreur

    # 4. Affichage du résumé
    print("\n--- RÉSUMÉ DES TESTS ---")
    print("\nModèles fonctionnels :")
    if working_models:
        for model in working_models:
            print(f"  - {model}")
    else:
        print("  Aucun modèle n'a fonctionné pour la génération de contenu texte.")

    print("\nModèles non fonctionnels :")
    if failed_models:
        for model, reason in failed_models:
            print(f"  - {model} (Raison: {reason})")
    else:
        print("  Tous les modèles testés ont fonctionné.")
    print("\n------------------------")

if __name__ == "__main__":
    test_models()