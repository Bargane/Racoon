document.addEventListener('DOMContentLoaded', () => {
    try {
    const sendButton = document.getElementById('send-button');
    const promptInput = document.getElementById('prompt-input');
    const chatBox = document.getElementById('chat-box');
    const loadingIndicator = document.getElementById('loading-indicator');
    const themeToggleButton = document.getElementById('theme-toggle');
    const rightPanel = document.querySelector('.right-panel');

    // Vérification des éléments critiques sans lesquels l'application ne peut pas fonctionner.
    if (!sendButton || !promptInput || !chatBox || !rightPanel) {
        console.error("Erreur critique: Les éléments de chat principaux sont manquants dans le HTML.");
        return;
    }

    let lastResults = []; // Pour garder en mémoire les derniers résultats de recherche
    let selectedStudios = []; // Pour garder en mémoire les studios sélectionnés
    let lastUserPrompt = ''; // Pour garder en mémoire le dernier prompt de recherche
    // URL du serveur backend
    const API_BASE_URL = 'http://127.0.0.1:5000';

    const sendMessage = async () => {
        const prompt = promptInput.value.trim();
        if (prompt === '') return;

        // Afficher un message d'attente dans le panneau de droite
        rightPanel.innerHTML = `
            <div class="slots-container">
                <h3 class="slots-title">Recherche de lieux...</h3>
                <div class="slots-grid"></div>
            </div>
        `;

        // Afficher le message de l'utilisateur
        addMessage(prompt, 'user');
        promptInput.value = '';
        
        // Afficher l'indicateur de chargement
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });

            // Cacher l'indicateur de chargement
            if (loadingIndicator) loadingIndicator.classList.add('hidden');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP ! Statut : ${response.status}`);
            }

            const data = await response.json();
            
            if (data.type === 'search_results') {
                addMessage(data.message || "Voici les résultats correspondants.", 'gemini');
                lastResults = data.results;
                lastUserPrompt = prompt; // Sauvegarder le prompt pour la fonction de contact
                renderStudios(data.results);
            } else if (data.type === 'clarification') {
                addMessage(data.message, 'gemini');
                // Si c'est une conversation, on change le titre et on vide la grille.
                rightPanel.querySelector('.slots-title').textContent = 'Conversation';
                rightPanel.querySelector('.slots-grid').innerHTML = '';
            }

        } catch (error) {
            console.error("Erreur lors de l'appel à l'API:", error);
            if (error instanceof TypeError) { // Souvent une erreur réseau (serveur éteint)
                addMessage(`Désolé, je n'arrive pas à contacter le serveur. Vérifiez qu'il est bien démarré.`, 'gemini');
            } else {
                addMessage(`Désolé, une erreur est survenue: ${error.message}`, 'gemini');
            }
        }
    };

    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        scrollToBottom();
    };

    const renderStudios = (results) => {
        const slotsGrid = document.querySelector('.slots-grid');
        const slotsTitle = document.querySelector('.slots-title');
        slotsGrid.innerHTML = ''; // Vider la liste actuelle

        if (results.length === 0) {
            slotsTitle.textContent = "Aucun lieu trouvé";
            slotsGrid.innerHTML = '<p>Aucun résultat trouvé.</p>';
            return;
        }

        slotsTitle.textContent = "Studios correspondants";
        results.forEach(studio => {
            // L'IA ne retourne pas d'ID, on en crée un simple pour le suivi
            studio.id = studio.id || studio.name.replace(/\s+/g, '-').toLowerCase();
            const isSelected = selectedStudios.includes(studio.id);

            const slotElement = document.createElement('div');
            slotElement.classList.add('slot');
            if (isSelected) slotElement.classList.add('selected');
            slotElement.dataset.studioId = studio.id;

            slotElement.innerHTML = `
                <div class="slot-name">${studio.name || ''}</div>
                <div class="studio-info"><strong>Adresse:</strong> ${studio.address || 'Non trouvé'}</div>
                <div class="studio-info"><strong>Prix:</strong> ${studio.price_range || 'Non trouvé'}</div>
                <div class="studio-info"><strong>Équipement:</strong> ${studio.equip || 'Non spécifié'}</div>
                <div class="studio-relevance">${studio.relevance_reason || ''}</div>
                <button class="details-button">Voir les détails</button>
            `;
            slotsGrid.appendChild(slotElement);
        });
        updateContactButton();
    };

    const updateContactButton = () => {
        let container = document.getElementById('contact-button-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'contact-button-container';
            rightPanel.querySelector('.slots-container').appendChild(container);
        }

        if (selectedStudios.length > 0) {
            container.innerHTML = `<button id="main-contact-button" class="contact-button">Contacter les ${selectedStudios.length} studios sélectionnés</button>`;
            document.getElementById('main-contact-button').addEventListener('click', () => {
                const studiosToContact = lastResults.filter(studio => selectedStudios.includes(studio.id));
                showContactView(studiosToContact, lastUserPrompt);
            });
        } else {
            container.innerHTML = '';
        }
    };

    const showStudioDetails = async (studio) => {
        const rightPanel = document.querySelector('.right-panel');
        rightPanel.innerHTML = '<div id="loading-indicator" class="room-detail-view"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>'; // Indicateur de chargement
        
        // Si la description n'a pas encore été chargée, on la récupère
        if (!studio.description) {
            try {
                const response = await fetch(`${API_BASE_URL}/generate-description`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item: studio })
                });
                if (response.ok) {
                    const data = await response.json();
                    studio.description = data.description; // On sauvegarde la description dans l'objet
                }
            } catch (error) {
                console.error("Erreur lors de la génération de la description:", error);
                studio.description = "La description détaillée n'a pas pu être chargée.";
            }
        }

        rightPanel.innerHTML = `
            <div class="room-detail-view">
                <button class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Retour aux studios
                </button>
                <h2>${studio.name}</h2>
                <div class="equip">
                    <div><strong>Adresse :</strong> ${studio.address || 'Non trouvé'}</div>
                    <div><strong>Contact :</strong> ${studio.phone || studio.email || 'Non trouvé'}</div>
                </div>
                <div class="description-container">
                    <h4>Description</h4>
                    <div class="description">${studio.description ? studio.description.replace(/\n/g, '<br>') : "Aucune description disponible."}</div>
                </div>
                <button class="contact-button">Contacter ce studio</button>
            </div>
        `;

        rightPanel.querySelector('.contact-button').addEventListener('click', () => {
            showContactView([studio], lastUserPrompt);
        });
    };

    const showContactView = async (studios, prompt) => {
        const rightPanel = document.querySelector('.right-panel');
        const studioNames = studios.map(s => s.name).join(', ');
    
        rightPanel.innerHTML = `
            <div class="contact-view">
                <button class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Retour
                </button>
                <h2>Contacter les studios</h2>
                <div class="contact-info">
                    <p><strong>Studios :</strong> ${studioNames}</p>
                </div>
                <textarea class="contact-textarea" rows="10" placeholder="Génération du message..."></textarea>
                <button id="send-contact-message" class="contact-button">Envoyer le message</button>
            </div>
        `;
    
        // On récupère les références aux éléments de la nouvelle vue
        const contactTextarea = rightPanel.querySelector('.contact-textarea');
        const sendButton = rightPanel.querySelector('#send-contact-message');

        // On attache immédiatement l'écouteur pour l'envoi du message
        sendButton.addEventListener('click', async () => {
            const messageBody = contactTextarea.value;
            const recipientEmails = studios.map(s => s.email).filter(Boolean);

            if (recipientEmails.length === 0) {
                addMessage('Aucune adresse e-mail de contact trouvée pour ces studios.', 'gemini');
                return;
            }

            sendButton.textContent = 'Envoi en cours...';
            sendButton.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipients: recipientEmails, body: messageBody })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Erreur inconnue lors de l'envoi.');
                
                addMessage(`Message envoyé avec succès à : ${studioNames}.`, 'gemini');
                
                if (recipientEmails.some(email => email.includes('raccon.contact'))) {
                    addMessage(`(Test) Vous devriez recevoir une copie dans votre boîte mail raccon.contact@gmail.com.`, 'gemini');
                }

            } catch (error) {
                console.error("Erreur lors de l'envoi de l'email:", error);
                addMessage(`L'envoi de l'e-mail a échoué. Vérifiez la configuration du serveur et les logs.`, 'gemini');
            } finally {
                // Retour à l'accueil après un court délai
                setTimeout(() => {
                    rightPanel.innerHTML = `<div class="slots-container"><h3 class="slots-title">Bienvenue !</h3><div class="slots-grid"></div></div>`;
                }, 2500);
            }
        });

        // Pendant que l'écouteur est prêt, on lance la génération du message
        try {
            const response = await fetch(`${API_BASE_URL}/generate-contact-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_prompt: prompt })
            });
            if (!response.ok) throw new Error('Failed to generate message');
            const data = await response.json();
            // On vérifie si la vue de contact est toujours affichée avant de la modifier
            if (rightPanel.contains(contactTextarea)) {
                contactTextarea.value = `Bonjour,\n\n${data.message}\n\nCordialement,`;
            }
        } catch (error) {
            console.error("Erreur lors de la génération du message de contact:", error);
            // On vérifie aussi ici si la vue est toujours présente
            if (rightPanel.contains(contactTextarea)) {
                contactTextarea.value = "La génération du message a échoué. Vous pouvez rédiger votre message manuellement.";
                contactTextarea.placeholder = "";
            }
        }
    };    

    const scrollToBottom = () => {
        chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;
    };

    // --- Attachement des écouteurs d'événements de manière sécurisée ---

    if (sendButton) sendButton.addEventListener('click', sendMessage);
    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // *** GESTION CENTRALISÉE DES CLICS DANS LE PANNEAU DROIT ***
    if (rightPanel) {
        rightPanel.addEventListener('click', (event) => {
        const target = event.target;

        // Clic sur le bouton "Voir les détails"
        if (target.classList.contains('details-button')) {
            const slotCard = target.closest('.slot');
            const studioId = slotCard.dataset.studioId;
            const studioData = lastResults.find(s => s.id === studioId);
            if (studioData) {
                showStudioDetails(studioData);
            }
            return;
        }

        // Clic sur une carte pour la sélectionner/désélectionner
        const slotCard = target.closest('.slot');
        if (slotCard) {
            const studioId = slotCard.dataset.studioId;
            const index = selectedStudios.indexOf(studioId);
            if (index > -1) {
                selectedStudios.splice(index, 1);
            } else {
                selectedStudios.push(studioId);
            }
            slotCard.classList.toggle('selected');
            updateContactButton();
            return;
        }

        // Clic sur le bouton "Retour"
        const backButton = target.closest('.back-button');
        if (backButton) {
            selectedStudios = []; // On réinitialise la sélection en revenant à la liste
            rightPanel.innerHTML = `
                <div class="slots-container">
                    <h3 class="slots-title">Studios correspondants</h3>
                    <div class="slots-grid"></div>
                </div>
            `;
            renderStudios(lastResults);
            return;
        }
        });
    }

    // Gestion de la rotation des placeholders
    if (promptInput) {
        const placeholders = [
            "Ex: un studio de répétition avec une batterie...",
            "Ex: une salle de répèt pas chère dans le 11ème...",
            "Ex: un studio avec un piano à queue pour ce week-end...",
        ];
        let placeholderIndex = 0;
        let placeholderInterval;

        const rotatePlaceholder = () => {
            promptInput.style.opacity = '0';
            setTimeout(() => {
                placeholderIndex = (placeholderIndex + 1) % placeholders.length;
                promptInput.placeholder = placeholders[placeholderIndex];
                promptInput.style.opacity = '1';
            }, 500); // Attend la fin du fade-out
        };

        const startPlaceholderRotation = () => {
            if (!placeholderInterval) {
                placeholderInterval = setInterval(rotatePlaceholder, 4000);
            }
        };

        const stopPlaceholderRotation = () => {
            clearInterval(placeholderInterval);
            placeholderInterval = null;
        };

        promptInput.addEventListener('focus', stopPlaceholderRotation);
        promptInput.addEventListener('blur', startPlaceholderRotation);
        startPlaceholderRotation(); // Lancement initial
    }


    // Gestion du mode sombre/clair
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.removeItem('theme');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Appliquer le thème sauvegardé au chargement
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }

    // Affichage initial
    rightPanel.innerHTML = `
        <div class="slots-container">
            <h3 class="slots-title">Bienvenue !</h3>
            <div class="slots-grid"></div>
        </div>`;
    } catch (error) {
        console.error("Une erreur fatale est survenue lors de l'initialisation de la page:", error);
        alert(`Une erreur critique a empêché le site de fonctionner. \n\nMessage: ${error.message}\n\nVeuillez vérifier la console (F12) pour plus de détails.`);
    }
});
