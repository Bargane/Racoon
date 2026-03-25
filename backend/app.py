import os
from google import genai
from google.genai import types
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import json
import re
from datetime import datetime
import smtplib
import ssl
from email.message import EmailMessage

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

MODEL_NAME = "gemini-2.5-flash"

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
    max_output_tokens=2048,
)

def build_search_prompt(user_prompt):
    """Construit le prompt pour filtrer les vrais studios depuis la base de données."""
    system_instruction = (
        "Tu es un assistant expert qui aide des artistes (musiciens, danseurs) à trouver des studios de répétition à Paris.\n"
        "Tu disposes d'une base de données de studios RÉELS. Tu dois UNIQUEMENT utiliser ces studios — n'en invente aucun.\n\n"
        "1. MODE RECHERCHE : Analyse la demande et retourne les studios de la liste qui correspondent le mieux.\n"
        "   - Filtre selon le type (musique/danse), l'équipement, la localisation, le prix.\n"
        "   - Pour chaque studio retourné, inclus tous les champs disponibles de la base + un champ 'relevance_reason'.\n"
        "   - Si aucun studio ne correspond parfaitement, retourne les plus proches en l'expliquant.\n\n"
        "2. MODE CONVERSATION : Si c'est une salutation ou question générale, réponds de manière conversationnelle.\n\n"
        "Le format de ta réponse DOIT être un objet JSON dans un bloc de code.\n\n"
        "Exemple RECHERCHE:\n"
        "```json\n"
        "{\"type\": \"search_results\", \"data\": [{\"name\": \"Studio Bleu\", \"address\": \"...\", \"price_range\": \"...\", \"equip\": \"...\", \"relevance_reason\": \"...\"}]}\n"
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

        # Extraire le JSON d'un bloc de code markdown, c'est plus robuste
        json_match = re.search(r"```json\n(.*?)\n```", response_text, re.DOTALL)
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
        # Gérer les erreurs potentielles de l'API
        return jsonify({"error": str(e)}), 500

@app.route('/send-email', methods=['POST'])
def send_email():
    """
    Envoie un email de contact aux studios sélectionnés.
    """
    if not request.json or 'recipients' not in request.json or 'body' not in request.json:
        return jsonify({"error": "Requête invalide. 'recipients' et 'body' sont manquants."}), 400

    recipients = request.json['recipients']
    body = request.json['body']
    
    gmail_user = os.environ.get("GMAIL_USER")
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")

    if not gmail_user or not gmail_password:
        return jsonify({"error": "Configuration du serveur mail manquante. GMAIL_USER et GMAIL_APP_PASSWORD doivent être définis dans le fichier .env."}), 500

    subject = "Demande de renseignement pour location de studio de répétition"

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(gmail_user, gmail_password)
            for recipient in recipients:
                msg = EmailMessage()
                msg.set_content(body)
                msg['Subject'] = subject
                msg['From'] = gmail_user
                msg['To'] = recipient
                server.send_message(msg)
        return jsonify({"message": "Email envoyé avec succès."})
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email : {e}")
        return jsonify({"error": f"Erreur lors de l'envoi de l'email : {str(e)}"}), 500

@app.route('/generate-contact-message', methods=['POST'])
def generate_contact_message():
    """
    Génère un message de contact personnalisé basé sur le prompt de l'utilisateur.
    """
    if not request.json or 'user_prompt' not in request.json:
        return jsonify({"error": "Requête invalide. 'user_prompt' est manquant."}), 400

    user_prompt = request.json['user_prompt']

    system_instruction = (
        "Tu es un assistant de rédaction pour artistes. Ton but est de rédiger un email de contact professionnel, amical et concis.\n"
        "En te basant sur la demande initiale de l'artiste, rédige un message à envoyer à des studios de répétition.\n"
        "Le message doit :\n"
        "1. Résumer clairement le besoin de l'artiste (type d'activité, équipement recherché, période souhaitée, etc.).\n"
        "2. Se terminer par une question ouverte sur leurs disponibilités et tarifs.\n"
        "3. Être prêt à être copié-collé dans un email.\n\n"
        "Ne commence PAS par 'Bonjour,'. Commence directement par le corps du message. Ne signe PAS le message. Ne termine PAS par 'Cordialement,' ou un nom."
    )

    full_prompt = f"Demande initiale de l'artiste: \"{user_prompt}\"\n\nRédige le message de contact."

    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=[system_instruction, full_prompt], config=generation_config)
        return jsonify({"message": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate-description', methods=['POST'])
def generate_description():
    """
    Génère une description détaillée pour un loueur (lieu).
    """
    if not request.json or 'item' not in request.json:
        return jsonify({"error": "Requête invalide. 'item' est manquant."}), 400

    item = request.json['item']
    
    system_instruction = ("Tu es le gérant d'un lieu de répétition parisien. Le lieu que tu gères possède plusieurs studios.\n"
                          "Décris ton établissement de manière engageante pour un artiste. Commence par inventer un nombre de studios que tu possèdes (ex: 'Notre centre dispose de 8 studios...').\n"
                          "Ensuite, pour l'équipement spécifique mentionné, donne des détails techniques réalistes (marques, modèles) pour le rendre attractif.\n"
                          "Exemple pour 'Ampli, Batterie': '...l'un de nos studios est équipé d'amplis Marshall JCM800 et Fender Twin Reverb, ainsi que d'une batterie Tama Starclassic.'\n"
                          "Rédige une description de 3-4 phrases.")
    
    full_prompt = f"Nom du lieu: {item.get('name')}\nÉquipement principal à détailler: {item.get('equip')}"

    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=[system_instruction, full_prompt], config=generation_config)
        return jsonify({"description": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Lancer le serveur en mode debug sur le port 5000
    app.run(debug=True, port=5000)
