document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-button');
    const promptInput = document.getElementById('prompt-input');
    const chatBox = document.getElementById('chat-box');
    const loadingIndicator = document.getElementById('loading-indicator');
    const themeToggleButton = document.getElementById('theme-toggle');
    const rightPanel = document.querySelector('.right-panel');

    let initialRooms = []; // Pour garder en mémoire les salles initiales
    let lastResults = []; // Pour garder en mémoire les derniers résultats de recherche
    // URL du serveur backend
    const API_URL = 'http://127.0.0.1:5000/generate';

    const sendMessage = async () => {
        const prompt = promptInput.value.trim();
        if (prompt === '') return;

        // Réinitialiser le panneau de droite à la liste initiale des salles
        rightPanel.innerHTML = `
            <div class="slots-container">
                <h3 class="slots-title">Salles disponibles à Paris</h3>
                <div class="slots-grid"></div>
            </div>
        `;
        renderSlots(initialRooms);

        // Afficher le message de l'utilisateur
        addMessage(prompt, 'user');
        promptInput.value = '';
        
        // Afficher l'indicateur de chargement
        loadingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });

            // Cacher l'indicateur de chargement
            loadingIndicator.classList.add('hidden');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP ! Statut : ${response.status}`);
            }

            const data = await response.json();
            addMessage(data.message, 'gemini');

            if (data.type === 'search_results') {
                lastResults = data.results;
                renderSlots(data.results);
            }
            // Si c'est 'clarification', on ne fait rien de plus que d'afficher le message.

        } catch (error) {
            console.error("Erreur lors de l'appel à l'API:", error);
            addMessage(`Désolé, une erreur est survenue.`, 'gemini');
        }
    };

    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        scrollToBottom();
    };

    const renderSlots = (results) => {
        const slotsGrid = document.querySelector('.slots-grid');
        slotsGrid.innerHTML = ''; // Vider la liste actuelle

        if (results.length === 0) {
            slotsGrid.innerHTML = '<p>Aucun résultat trouvé.</p>';
            return;
        }

        results.forEach(room => {
            const slotElement = document.createElement('div');
            slotElement.classList.add('slot');
            slotElement.id = room.id;
            slotElement.innerHTML = `
                <div class="slot-date">${room.date || ''}</div>
                <div class="slot-details"><span class="slot-surface">${room.surface || ''}</span><span class="slot-tariff">${room.tariff || ''}</span></div>
                <div class="slot-name">${room.name || ''}</div>
                <div class="slot-time">${room.time || ''}</div>
                <div class="slot-equip">${room.equip || ''}</div>
            `;
            slotsGrid.appendChild(slotElement);
        });
    };

    const showRoomDetails = async (room) => {
        let selectedSlots = [];
        const rightPanel = document.querySelector('.right-panel');
        rightPanel.innerHTML = '<div id="loading-indicator" class="room-detail-view"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>'; // Indicateur de chargement
        
        // Si la description n'a pas encore été chargée, on la récupère
        if (!room.description) {
            try {
                const response = await fetch('http://127.0.0.1:5000/generate-description', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ room: room })
                });
                if (response.ok) {
                    const data = await response.json();
                    room.description = data.description; // On sauvegarde la description dans l'objet
                }
            } catch (error) {
                console.error("Erreur lors de la génération de la description:", error);
            }
        }

        rightPanel.innerHTML = `
            <div class="room-detail-view">
                <button class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Retour aux résultats
                </button>
                <h2>${room.name}</h2>
                <div class="equip">${room.equip}</div>
                <div class="schedule-container">
                    <div class="description-container">
                        <h4>Équipement détaillé</h4>
                        <div class="description">${room.description ? room.description.replace(/\n/g, '<br>') : "Aucune description disponible."}</div>
                    </div>

                    <h4>Disponibilités de la journée</h4>
                    <div class="schedule">
                        ${generateScheduleHTML(room.time)}
                    </div>
                    <button id="go-to-booking" class="booking-button" style="display: none;">Réserver les créneaux sélectionnés</button>
                </div>
            </div>
        `;

        const bookingButton = rightPanel.querySelector('#go-to-booking');

        // Attacher les écouteurs d'événements aux nouveaux créneaux horaires
        rightPanel.querySelectorAll('.time-block.available').forEach(block => {
            block.addEventListener('click', () => {
                const time = block.getAttribute('data-time');
                block.classList.toggle('selected');
                if (selectedSlots.includes(time)) {
                    selectedSlots = selectedSlots.filter(t => t !== time);
                } else {
                    selectedSlots.push(time);
                }
                bookingButton.style.display = selectedSlots.length > 0 ? 'block' : 'none';
            });
        });

        bookingButton.addEventListener('click', () => {
            if (selectedSlots.length > 0) {
                showBookingView(room, selectedSlots);
            }
        });
    };

    const generateScheduleHTML = (bookedTime) => {
        const hours = Array.from({length: 14}, (_, i) => 9 + i); // 9h à 22h
        let bookedStart = -1, bookedEnd = -1;

        if (bookedTime) {
            const times = bookedTime.match(/(\d{2}):\d{2}/g);
            if (times && times.length >= 2) {
                bookedStart = parseInt(times[0], 10);
                bookedEnd = parseInt(times[1], 10);
            }
        }

        return hours.map(hour => {
            // Logique corrigée : un créneau est "réservé" (booked) s'il est dans la plage horaire.
            const isBookedSlot = hour >= bookedStart && hour < bookedEnd;
            let timeBlockHTML = `<div class="time-block ${isBookedSlot ? 'booked' : 'available'}"`;
            if (!isBookedSlot) { // Le créneau est donc disponible
                // On ajoute un attribut pour attacher l'événement plus tard
                timeBlockHTML += ` data-time="${hour}:00"`;
            }
            return timeBlockHTML + `>${hour}:00</div>`;
        }).join('');
    };

    const showBookingView = (room, times) => {
        const sortedTimes = times.sort();
        const slotsText = sortedTimes.map(t => `<li>${t} - ${parseInt(t.split(':')[0], 10) + 1}:00</li>`).join('');
        const rightPanel = document.querySelector('.right-panel');
        rightPanel.innerHTML = `
            <div class="booking-view">
                <button class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Retour à la salle
                </button>
                <h2>Confirmation de réservation</h2>
                <div class="booking-info">
                    <p><strong>Salle :</strong> ${room.name}</p>
                    <p><strong>Date :</strong> ${room.date}</p>
                    <p><strong>Créneaux :</strong></p><ul>${slotsText}</ul>
                </div>
                <textarea class="booking-textarea" placeholder="Ajouter un message pour le studio (optionnel)..."></textarea>
                <button id="confirm-booking" class="booking-button">Confirmer la réservation</button>
            </div>
        `;

        rightPanel.querySelector('.back-button').addEventListener('click', () => showRoomDetails(room));
        rightPanel.querySelector('#confirm-booking').addEventListener('click', () => {
            addMessage(`Votre demande de réservation pour ${room.name} a bien été envoyée !`, 'gemini');
            // Pour la maquette, on retourne simplement à la liste des salles
            renderSlots(lastResults);
        });
    };

    const scrollToBottom = () => {
        chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;
    };

    sendButton.addEventListener('click', sendMessage);
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // *** GESTION CENTRALISÉE DES CLICS DANS LE PANNEAU DROIT ***
    rightPanel.addEventListener('click', (event) => {
        const target = event.target;

        // Clic sur une carte de salle
        const slotCard = target.closest('.slot');
        if (slotCard) {
            const roomData = lastResults.find(r => r.id === slotCard.id);
            if (roomData) {
                showRoomDetails(roomData);
            }
            return;
        }

        // Clic sur le bouton "Retour"
        const backButton = target.closest('.back-button');
        if (backButton) {
            rightPanel.innerHTML = `
                <div class="slots-container">
                    <h3 class="slots-title">Salles disponibles à Paris</h3>
                    <div class="slots-grid"></div>
                </div>
            `;
            renderSlots(lastResults);
            return;
        }

    });

    // *** GESTION DU BOUTON DE RÉINITIALISATION ***
    // Note: Cet écouteur est placé ici car le bouton est dans le rightPanel
    // qui est géré par la délégation d'événements.
    const resetButton = document.getElementById('reset-search-button');
    if(resetButton) {
        resetButton.addEventListener('click', () => {
            renderSlots(initialRooms);
            lastResults = initialRooms;
        });
    }

    // Gestion de la rotation des placeholders
    const placeholders = [
        "Ex: une salle de danse pour 2 personnes demain...",
        "Ex: un studio de musique avec batterie pour samedi...",
        "Ex: un plateau de théâtre pour 10 personnes ce soir...",
        "Ex: une salle avec un piano pour le 15 juillet...",
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


    // Gestion du mode sombre/clair
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

    // Appliquer le thème sauvegardé au chargement
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }

    // Sauvegarder l'état initial des salles
    const initialSlotElements = document.querySelectorAll('.slot');
    initialSlotElements.forEach(slot => {
        initialRooms.push({
            id: slot.id,
            name: slot.querySelector('.slot-name').textContent,
            date: slot.querySelector('.slot-date').textContent,
            time: slot.querySelector('.slot-time').textContent,
            surface: slot.querySelector('.slot-surface').textContent,
            tariff: slot.querySelector('.slot-tariff').textContent,
            equip: slot.querySelector('.slot-equip').textContent,
        });
    });
    // La liste initiale est maintenant la liste par défaut
    lastResults = initialRooms;
});
