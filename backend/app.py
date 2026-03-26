import os
from google import genai
from google.genai import types
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import json
import re
from datetime import datetime

# Charger les variables d'environnement du fichier .env
load_dotenv()

# Définir les chemins de manière robuste
# Chemin absolu du dossier où se trouve app.py (le dossier backend)
backend_dir = os.path.dirname(os.path.abspath(__file__))
# Chemin du dossier parent (la racine du projet, Racoon)
project_root = os.path.dirname(backend_dir)
# Chemin du dossier frontend
frontend_dir = os.path.join(project_root, 'frontend')

# Configure Flask pour qu'il trouve les fichiers du frontend.
app = Flask(__name__,
            template_folder=frontend_dir,
            static_folder=frontend_dir,
            static_url_path='')

# Activer CORS pour autoriser les requêtes depuis votre front-end
CORS(app)

# --- Configuration Globale de l'API et du Modèle ---

MODEL_NAME = "gemini-2.0-flash"

def configure_api():
    """Charge la clé API et configure le client genai."""
    try:
        api_key = os.environ["GEMINI_API_KEY"]
        print(f"API Gemini configurée avec succès pour le modèle : {MODEL_NAME}")
        return genai.Client(api_key=api_key)
    except KeyError:
        print("ERREUR : Clé API Gemini non trouvée. Assurez-vous de l'avoir définie dans le fichier .env")
        exit()

client = configure_api()

# Chargement de la base de studios réels au démarrage
studios_path = os.path.join(backend_dir, 'studios.json')
with open(studios_path, 'r', encoding='utf-8') as f:
    STUDIOS_DB = json.load(f)

generation_config = types.GenerateContentConfig(
    temperature=0.9,
    top_p=1,
    top_k=40,
    max_output_tokens=4096,
)

def build_search_prompt(user_prompt):
    """Construit le prompt pour filtrer les vrais studios depuis la base de données."""
    system_instruction = (
        "Tu es un assistant expert qui aide des artistes (musiciens, danseurs) à trouver des studios de répétition à Paris.\n"
        "Tu disposes d'une base de données de studios RÉELS. Tu dois UNIQUEMENT utiliser ces studios — n'en invente aucun.\n\n"
        "1. MODE RECHERCHE : Décompose la demande en critères et filtre les studios correspondants.\n\n"
        "   CRITÈRES À EXTRAIRE ET RESPECTER :\n"
        "   - Équipement : vérifie que le champ 'equip' du studio contient bien ce qui est demandé.\n"
        "   - Nombre de personnes : compare avec 'capacity_max_persons'. Exclus les studios trop petits.\n"
        "   - Horaires : vérifie que le studio est ouvert aux jours et heures demandés (champ 'hours').\n"
        "     Si la demande précise un jour (ex: mercredi, vendredi) ou une heure (ex: 19h), ne retourne que les studios ouverts à ce moment.\n"
        "   - Type d'activité : musique ou danse.\n"
        "   - Localisation / arrondissement si mentionné.\n"
        "   - Budget si mentionné.\n\n"
        "   DISPONIBILITÉ :\n"
        "   Les créneaux exacts ne peuvent pas être vérifiés en temps réel. Dans 'relevance_reason', indique toujours :\n"
        "   - Pourquoi ce studio correspond aux critères.\n"
        "   - Un rappel de contacter le studio ou d'utiliser son lien de réservation pour confirmer la dispo.\n\n"
        "   RÉSULTAT :\n"
        "   - Inclus tous les champs disponibles de la base pour chaque studio retourné.\n"
        "   - Si aucun studio ne correspond parfaitement, retourne les plus proches en expliquant les compromis.\n\n"
        "2. MODE CONVERSATION : Si c'est une salutation ou question générale, réponds de manière conversationnelle.\n\n"
        "Le format de ta réponse DOIT être un objet JSON dans un bloc de code.\n\n"
        "Exemple RECHERCHE:\n"
        "```json\n"
        "{\"type\": \"search_results\", \"data\": [{\"name\": \"Studio Bleu\", \"address\": \"...\", \"price_range\": \"...\", \"equip\": \"...\", \"hours\": \"...\", \"booking_url\": \"...\", \"relevance_reason\": \"Correspond aux critères X et Y. Dispo à confirmer via leur site de réservation.\"}]}\n"
        "```\n\n"
        "Exemple CONVERSATION:\n"
        "```json\n"
        "{\"type\": \"clarification\", \"message\": \"Bonjour ! Que cherchez-vous comme studio aujourd'hui ?\"}\n"
        "```"
    )
    current_date = datetime.now().strftime("%Y-%m-%d")
    studios_context = json.dumps(STUDIOS_DB, ensure_ascii=False, indent=2)
    return (
        f"Date actuelle: {current_date}\n\n"
        f"{system_instruction}\n\n"
        f"BASE DE DONNÉES STUDIOS RÉELS:\n{studios_context}\n\n"
        f"DEMANDE UTILISATEUR (Artiste):\n{user_prompt}"
    )


@app.route('/', methods=['GET'])
def index():
    """Sert la page HTML principale de l'application."""
    return render_template('index.html')


@app.route('/generate', methods=['POST'])
def generate():
    """
    Point de terminaison pour générer du contenu avec l'API Gemini.
    """
    # Vérifier si la requête contient du JSON et la clé 'prompt'
    if not request.json or 'prompt' not in request.json:
        return jsonify({"error": "Requête invalide. 'prompt' est manquant."}), 400

    user_prompt = request.json['prompt']

    full_prompt = build_search_prompt(user_prompt)

    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=full_prompt, config=generation_config)
        response_text = response.text

        # Extraire le JSON d'un bloc de code markdown
        json_match = re.search(r"```json\s*(.*?)\s*```", response_text, re.DOTALL)
        if not json_match:
            # Fallback si l'IA ne retourne pas de JSON formaté
            return jsonify({"type": "clarification", "message": "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre recherche ?"})

        try:
            json_str = json_match.group(1)
            response_data = json.loads(json_str)
            
            if response_data.get("type") == "search_results":
                results = response_data.get("data", [])
                return jsonify({"type": "search_results", "message": "Voici les studios qui correspondent à votre recherche.", "results": results})
            
            # Si c'est une clarification ou un autre type, on le retourne directement
            return jsonify(response_data)

        except json.JSONDecodeError:
            # Si le JSON est malformé, on retourne un message d'erreur clair
            return jsonify({"type": "clarification", "message": "Désolé, une erreur est survenue lors de l'analyse de la réponse. Veuillez réessayer."})

    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            return jsonify({"type": "ai_limit", "message": "🚦 L'assistant IA est temporairement saturé (limite de requêtes atteinte). Réessayez dans quelques minutes — le site fonctionne normalement."}), 429
        if "503" in error_str or "UNAVAILABLE" in error_str:
            return jsonify({"type": "ai_limit", "message": "🚦 L'assistant IA est momentanément indisponible (surcharge Google). Réessayez dans quelques instants — le site fonctionne normalement."}), 503
        return jsonify({"error": error_str}), 500


if __name__ == '__main__':
    # Lancer le serveur en mode debug sur le port 5000
    app.run(debug=True, port=5000)
