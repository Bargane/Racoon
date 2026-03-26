import os
import time
from groq import Groq
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import json
import re
from datetime import datetime

load_dotenv()

backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
frontend_dir = os.path.join(project_root, 'frontend')

app = Flask(__name__,
            template_folder=frontend_dir,
            static_folder=frontend_dir,
            static_url_path='')

CORS(app)

MODEL_NAME = "llama-3.3-70b-versatile"
SECRET_PHRASE = "la blanquette est bonne"
MAX_RETRIES = 3
RETRY_DELAY = 5

def configure_api():
    try:
        api_key = os.environ["GROQ_API_KEY"]
        print(f"API Groq configurée avec succès pour le modèle : {MODEL_NAME}")
        return Groq(api_key=api_key)
    except KeyError:
        print("ERREUR : Clé API Groq non trouvée. Assurez-vous de l'avoir définie dans le fichier .env")
        exit()

client = configure_api()

studios_path = os.path.join(backend_dir, 'studios.json')
with open(studios_path, 'r', encoding='utf-8') as f:
    STUDIOS_DB = json.load(f)

def build_search_prompt(user_prompt):
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
    return render_template('index.html')


@app.route('/generate', methods=['POST'])
def generate():
    if not request.json or 'prompt' not in request.json:
        return jsonify({"error": "Requête invalide. 'prompt' est manquant."}), 400

    user_prompt = request.json['prompt']

    # Phrase secrète : affiche tous les studios sans appel API
    if user_prompt.strip().lower() == SECRET_PHRASE:
        results = [
            {**studio, "relevance_reason": "Mode admin — studio inclus depuis la base de données complète."}
            for studio in STUDIOS_DB
        ]
        return jsonify({
            "type": "search_results",
            "message": "Voici tous les studios de la base de données.",
            "results": results
        })

    full_prompt = build_search_prompt(user_prompt)
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.9,
                max_tokens=4096,
            )
            response_text = response.choices[0].message.content

            json_match = re.search(r"```json\s*(.*?)\s*```", response_text, re.DOTALL)
            if not json_match:
                return jsonify({"type": "clarification", "message": "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre recherche ?"})

            try:
                json_str = json_match.group(1)
                response_data = json.loads(json_str)

                if response_data.get("type") == "search_results":
                    results = response_data.get("data", [])
                    return jsonify({"type": "search_results", "message": "Voici les studios qui correspondent à votre recherche.", "results": results})

                return jsonify(response_data)

            except json.JSONDecodeError:
                return jsonify({"type": "clarification", "message": "Désolé, une erreur est survenue lors de l'analyse de la réponse. Veuillez réessayer."})

        except Exception as e:
            error_str = str(e)
            last_error = error_str

            if "429" in error_str or "rate_limit" in error_str.lower():
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                    continue
                return jsonify({"type": "ai_limit", "message": "🚦 L'assistant IA est temporairement saturé (limite de requêtes atteinte). Réessayez dans quelques minutes — le site fonctionne normalement."}), 429

            if "503" in error_str or "unavailable" in error_str.lower():
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                    continue
                return jsonify({"type": "ai_limit", "message": "🚦 L'assistant IA est momentanément indisponible. Réessayez dans quelques instants — le site fonctionne normalement."}), 503

            return jsonify({"error": last_error}), 500

    return jsonify({"error": last_error}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
