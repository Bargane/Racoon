document.addEventListener('DOMContentLoaded', () => {
    try {
    const sendButton = document.getElementById('send-button');
    const promptInput = document.getElementById('prompt-input');
    const chatBox = document.getElementById('chat-box');
    const loadingIndicator = document.getElementById('loading-indicator');
    const themeToggleButton = document.getElementById('theme-toggle');
    const rightPanel = document.querySelector('.right-panel');

    if (!sendButton || !promptInput || !chatBox || !rightPanel) {
        console.error("Erreur critique: Les éléments de chat principaux sont manquants dans le HTML.");
        return;
    }

    let lastResults = [];
    let lastUserPrompt = '';
    const API_BASE_URL = window.RACOON_API_URL || 'http://127.0.0.1:5000';

    const sendMessage = async () => {
        const prompt = promptInput.value.trim();
        if (prompt === '') return;

        rightPanel.innerHTML = `
            <div class="slots-container">
                <h3 class="slots-title">Recherche de lieux...</h3>
                <div class="slots-grid"></div>
            </div>
        `;

        addMessage(prompt, 'user');
        promptInput.value = '';
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (loadingIndicator) loadingIndicator.classList.add('hidden');

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.type === 'ai_limit') {
                    addMessage(errorData.message, 'gemini ai-limit');
                    rightPanel.querySelector('.slots-title').textContent = 'Assistant indisponible';
                    rightPanel.querySelector('.slots-grid').innerHTML = '';
                    return;
                }
                throw new Error(errorData.error || `Erreur HTTP ! Statut : ${response.status}`);
            }

            const data = await response.json();

            if (data.type === 'search_results') {
                addMessage(data.message || "Voici les résultats correspondants.", 'gemini');
                lastResults = data.results;
                lastUserPrompt = prompt;
                renderStudios(data.results);
            } else if (data.type === 'ai_limit') {
                addMessage(data.message, 'gemini ai-limit');
                rightPanel.querySelector('.slots-title').textContent = 'Assistant indisponible';
                rightPanel.querySelector('.slots-grid').innerHTML = '';
            } else if (data.type === 'clarification') {
                addMessage(data.message, 'gemini');
                rightPanel.querySelector('.slots-title').textContent = 'Conversation';
                rightPanel.querySelector('.slots-grid').innerHTML = '';
            }

        } catch (error) {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            console.error("Erreur lors de l'appel à l'API:", error);
            if (error instanceof TypeError) {
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
        slotsGrid.innerHTML = '';

        if (results.length === 0) {
            slotsTitle.textContent = "Aucun lieu trouvé";
            slotsGrid.innerHTML = '<p>Aucun résultat trouvé.</p>';
            return;
        }

        slotsTitle.textContent = `${results.length} studio${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`;
        results.forEach(studio => {
            studio.id = studio.id || studio.name.replace(/\s+/g, '-').toLowerCase();

            const slotElement = document.createElement('div');
            slotElement.classList.add('slot');
            slotElement.dataset.studioId = studio.id;

            const hasBooking = !!studio.booking_url;
            const hasEmail = !!studio.email;

            slotElement.innerHTML = `
                <div class="slot-name">${studio.name || ''}</div>
                <div class="studio-info"><strong>Adresse :</strong> ${studio.address || 'Non trouvé'}</div>
                <div class="studio-info"><strong>Horaires :</strong> ${studio.hours || 'Non précisé'}</div>
                <div class="studio-info"><strong>Prix :</strong> ${studio.price_range || 'Non trouvé'}</div>
                <div class="studio-info"><strong>Équipement :</strong> ${studio.equip || 'Non spécifié'}</div>
                <div class="studio-relevance">${studio.relevance_reason || ''}</div>
                <div class="slot-actions">
                    ${hasEmail ? `<button class="action-btn email-btn" data-studio-id="${studio.id}">✉️ Email</button>` : ''}
                    ${hasBooking ? `<a class="action-btn booking-btn" href="${studio.booking_url}" target="_blank" rel="noopener noreferrer">📅 Réserver</a>` : '<span class="action-btn booking-btn disabled">📅 Pas de résa en ligne</span>'}
                </div>
            `;
            slotsGrid.appendChild(slotElement);
        });
    };

    const buildEmailTemplate = (studio, userPrompt) => {
        const subject = `Demande de renseignement — location de studio de répétition`;
        const body = `Bonjour,

Je suis à la recherche d'un studio de répétition et votre établissement semble correspondre à mes besoins.

Ma demande : ${userPrompt}

Pourriez-vous me confirmer vos disponibilités et tarifs pour cette période ?

Merci d'avance,`;
        return { subject, body };
    };

    const showEmailView = (studio) => {
        const { subject, body } = buildEmailTemplate(studio, lastUserPrompt);

        rightPanel.innerHTML = `
            <div class="contact-view">
                <button class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Retour
                </button>
                <h2>Contacter ${studio.name}</h2>
                <div class="email-field">
                    <label>Destinataire</label>
                    <input type="email" class="email-to" value="${studio.email}" readonly>
                </div>
                <div class="email-field">
                    <label>Objet</label>
                    <input type="text" class="email-subject" value="${subject}">
                </div>
                <div class="email-field">
                    <label>Message</label>
                    <textarea class="contact-textarea" rows="9">${body}</textarea>
                </div>
                <button id="copy-email-btn" class="contact-button">📋 Copier le message</button>
            </div>
        `;

        rightPanel.querySelector('#copy-email-btn').addEventListener('click', () => {
            const btn = rightPanel.querySelector('#copy-email-btn');
            const bodyText = rightPanel.querySelector('.contact-textarea').value;
            navigator.clipboard.writeText(bodyText).then(() => {
                btn.textContent = '✅ Copié !';
                setTimeout(() => { btn.textContent = '📋 Copier le message'; }, 2000);
            });
        });
    };

    const scrollToBottom = () => {
        chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;
    };

    sendButton.addEventListener('click', sendMessage);
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Gestion centralisée des clics dans le panneau droit
    rightPanel.addEventListener('click', (event) => {
        const target = event.target;

        // Bouton Email
        if (target.classList.contains('email-btn')) {
            const studioId = target.dataset.studioId;
            const studio = lastResults.find(s => s.id === studioId);
            if (studio) showEmailView(studio);
            return;
        }

        // Bouton Retour
        if (target.closest('.back-button')) {
            rightPanel.innerHTML = `
                <div class="slots-container">
                    <h3 class="slots-title"></h3>
                    <div class="slots-grid"></div>
                </div>
            `;
            renderStudios(lastResults);
            return;
        }
    });

    // Rotation des placeholders
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
        }, 500);
    };

    promptInput.addEventListener('focus', () => { clearInterval(placeholderInterval); placeholderInterval = null; });
    promptInput.addEventListener('blur', () => { if (!placeholderInterval) placeholderInterval = setInterval(rotatePlaceholder, 4000); });
    placeholderInterval = setInterval(rotatePlaceholder, 4000);

    // Thème sombre/clair
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

    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }

    rightPanel.innerHTML = `
        <div class="slots-container">
            <h3 class="slots-title">Bienvenue !</h3>
            <div class="slots-grid"></div>
        </div>`;
    } catch (error) {
        console.error("Une erreur fatale est survenue lors de l'initialisation de la page:", error);
        alert(`Une erreur critique a empêché le site de fonctionner. \n\nMessage: ${error.message}`);
    }
});
