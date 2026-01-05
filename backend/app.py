import os
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import json
import re
from datetime import datetime

# Charger les variables d'environnement du fichier .env
load_dotenv()

# Configure Flask pour qu'il trouve les fichiers du frontend.
# - 'template_folder' pointe vers le dossier contenant index.html.
# - 'static_folder' pointe vers le dossier contenant css/ et js/.
# - 'static_url_path' est défini à '' pour que les fichiers (css, js) soient servis depuis la racine (ex: /css/style.css).
app = Flask(__name__, template_folder='../frontend', static_folder='../frontend', static_url_path='')

# Activer CORS pour autoriser les requêtes depuis votre front-end
CORS(app)

# --- Configuration Globale de l'API et du Modèle ---

MODEL_NAME = "gemini-2.5-flash" # Modèle centralisé

def configure_api():
    """Charge la clé API et configure le client genai."""
    try:
        api_key = os.environ["GEMINI_API_KEY"]
        genai.configure(api_key=api_key)
        print(f"API Gemini configurée avec succès pour le modèle : {MODEL_NAME}")
    except KeyError:
        print("ERREUR : Clé API Gemini non trouvée. Assurez-vous de l'avoir définie dans le fichier .env")
        exit()

configure_api()

# Configuration pour la génération de contenu
# Note: top_k=1 est très restrictif. Considérez d'augmenter cette valeur pour plus de créativité.
# Configuration pour la génération de contenu
generation_config = {
    "temperature": 0.9,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 2048,
}

# Initialisation du modèle une seule fois au démarrage de l'application
model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    generation_config=generation_config
)

# Base de données fictive des salles
ROOMS_DB = [
    { "id": "studio-a", "name": "Studio de la Cité (Danse)", "date": "Aujourd'hui", "time": "10:00 - 12:00", "equip": "💃 Miroirs, 🔊 Son", "surface": "60m²", "tariff": "40€/h", "tags": ["danse", "miroirs", "son", "aujourd'hui"] },
    { "id": "salle-b", "name": "Le Local Répétition (Musique)", "date": "Aujourd'hui", "time": "14:00 - 16:00", "equip": "🎸 Amplis, 🥁 Batterie", "surface": "30m²", "tariff": "35€/h", "tags": ["musique", "amplis", "batterie", "aujourd'hui"] },
    { "id": "plateau-c", "name": "Théâtre de l'Atelier (Scène)", "date": "Demain", "time": "15:00 - 18:00", "equip": "💡 Lumières, 🎭 Scène", "surface": "100m²", "tariff": "60€/h", "tags": ["théâtre", "lumières", "scène", "dix personnes", "demain"] },
    { "id": "studio-d", "name": "Le Bœuf sur le Toit (Musique)", "date": "Demain", "time": "19:00 - 21:00", "equip": "🎹 Piano, 🎤 Micros", "surface": "25m²", "tariff": "30€/h", "tags": ["musique", "piano", "micros", "demain"] },
    { "id": "studio-e", "name": "L'Espace Sonore (Enregistrement)", "date": "Aujourd'hui", "time": "18:00 - 20:00", "equip": "🎤 Micros, 🎧 Casques", "surface": "20m²", "tariff": "45€/h", "tags": ["musique", "micros", "casques", "enregistrement", "aujourd'hui"] },
    { "id": "studio-f", "name": "La Scène Ouverte (Théâtre)", "date": "Ce soir", "time": "20:00 - 23:00", "equip": "🎭 Scène, 🪑 Chaises", "surface": "70m²", "tariff": "50€/h", "tags": ["théâtre", "scène", "ce soir"] },
    { "id": "studio-g", "name": "Le Parquet Flottant (Danse)", "date": "Demain", "time": "09:00 - 11:00", "equip": "💃 Miroirs, 🩰 Barre", "surface": "50m²", "tariff": "35€/h", "tags": ["danse", "miroirs", "barre", "demain"] },
    { "id": "studio-h", "name": "Le Studio Luna-Rossa (Musique)", "date": "Demain", "time": "11:00 - 13:00", "equip": "🎸 Amplis, 🎹 Piano", "surface": "35m²", "tariff": "40€/h", "tags": ["musique", "amplis", "piano", "demain"] },
    { "id": "studio-i", "name": "Le Loft Créatif (Mixte)", "date": "Après-demain", "time": "10:00 - 14:00", "equip": "📽️ Projecteur, 🎨 Espace vide", "surface": "80m²", "tariff": "55€/h", "tags": ["mixte", "projecteur", "créatif", "après-demain"] },
    { "id": "studio-j", "name": "La Cave à Jazz (Musique)", "date": "Après-demain", "time": "21:00 - 00:00", "equip": "🎷 Saxophone, 🎹 Piano, 🥁 Batterie", "surface": "40m²", "tariff": "40€/h", "tags": ["musique", "jazz", "piano", "batterie", "après-demain"] }
]

def get_rooms_as_text():
    """Convertit la liste des salles en une chaîne de caractères pour l'IA."""
    return json.dumps(ROOMS_DB)

def build_search_prompt(user_prompt):
    """Construit le prompt complet pour la recherche de salles."""
    system_instruction = (
        "Tu es un assistant de réservation intelligent pour des salles de répétition à Paris. Ton rôle est d'aider l'utilisateur. "
        "Analyse la demande de l'utilisateur. Tu as deux modes de réponse possibles :\n"
        "1. MODE RECHERCHE : Si la demande est une recherche claire de salle (ex: 'salle de danse', 'studio avec batterie'), retourne un objet JSON avec `\"type\": \"search_results\"` et une clé `\"data\"` contenant les résultats. Si tu ne trouves aucune salle existante, génères-en 2 nouvelles.\n"
        "2. MODE CONVERSATION : Si la demande est une salutation, une question générale ou une demande qui n'est pas une recherche (ex: 'bonjour', 'qui es-tu ?'), retourne un objet JSON avec `\"type\": \"clarification\"` et une clé `\"message\"` contenant ta réponse conversationnelle. Les salles générées doivent inclure les champs 'surface' et 'tariff'.\n"
        "Exemple MODE RECHERCHE: ```json\n{\"type\": \"search_results\", \"data\": {\"matched_ids\": [\"salle-b\"], \"generated_rooms\": []}}\n```\n"
        "Exemple MODE CONVERSATION: ```json\n{\"type\": \"clarification\", \"message\": \"Bonjour ! Je suis un assistant virtuel. Comment puis-je vous aider à trouver une salle ?\"}\n```\n"
    )
    current_date = datetime.now().strftime("%Y-%m-%d")
    return (
        f"Date actuelle: {current_date}\n\n"
        f"{system_instruction}\n\n"
        f"LISTE DES SALLES:\n{get_rooms_as_text()}\n\n"
        f"DEMANDE UTILISATEUR:\n{user_prompt}"
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
        response = model.generate_content(full_prompt)
        response_text = response.text

        # Extraire le JSON d'un bloc de code markdown, c'est plus robuste
        json_match = re.search(r"```json\n(.*?)\n```", response_text, re.DOTALL)
        if not json_match:
            # Fallback si l'IA ne retourne pas de JSON formaté
            return jsonify({"type": "clarification", "message": "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre recherche ?"})

        try:
            json_str = json_match.group(1)
            response_data = json.loads(json_str)
            
            if response_data.get("type") == "search_results":
                search_data = response_data.get("data", {})
                matched_ids = search_data.get("matched_ids", [])
                matched_rooms = [room for room in ROOMS_DB if room["id"] in matched_ids]
                all_results = matched_rooms + search_data.get("generated_rooms", [])
                return jsonify({"type": "search_results", "message": "Voici les créneaux qui correspondent à votre recherche.", "results": all_results})
            
            # Si c'est une clarification ou un autre type, on le retourne directement
            return jsonify(response_data)

        except json.JSONDecodeError:
            # Si le JSON est malformé, on retourne un message d'erreur clair
            return jsonify({"type": "clarification", "message": "Désolé, une erreur est survenue lors de l'analyse de la réponse. Veuillez réessayer."})

    except Exception as e:
        # Gérer les erreurs potentielles de l'API
        return jsonify({"error": str(e)}), 500

@app.route('/generate-description', methods=['POST'])
def generate_description():
    """
    Génère une description détaillée pour une salle spécifique.
    """
    if not request.json or 'room' not in request.json:
        return jsonify({"error": "Requête invalide. 'room' est manquant."}), 400

    room = request.json['room']
    
    system_instruction = (
        "Tu es un assistant technique qui liste l'équipement d'un studio. Pour le studio suivant, fournis une liste sobre et détaillée de l'équipement disponible. "
        "Invente des marques et modèles réalistes et spécifiques pour chaque élément. "
        "Exemple pour 'Ampli': 'Ampli Guitare: Marshall JCM800, Fender Twin Reverb'. Pour 'Batterie': 'Batterie: Tama Starclassic Maple (22\", 10\", 12\", 16\")'. "
        "Ne rédige pas de phrases marketing, contente-toi de lister l'équipement."
    )
    
    full_prompt = f"Studio: {room['name']}\nÉquipement: {room['equip']}"

    try:
        # Utilise le même modèle global, mais sans la config de génération spécifique si non nécessaire
        response = model.generate_content([system_instruction, full_prompt])
        return jsonify({"description": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Lancer le serveur en mode debug sur le port 5000
    app.run(debug=True, port=5000)
