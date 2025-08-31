/**
 * Chatbot Widget - Script principale
 * Widget chatbot non invasivo per siti web esistenti
 */

// Configurazione di default
const DEFAULT_CONFIG = {
    welcomeMessage: "Ciao! Come posso aiutarti oggi?",
    position: "bottom-right",
    primaryColor: "#4a90e2",
    title: "Assistente Virtuale"
};

// Stato globale del chatbot
let chatbotState = {
    isOpen: false,
    sessionId: generateSessionId(),
    messages: [],
    bookingData: {
        date: null,
        time: null,
        name: "",
        contact: ""
    },
    bookingMode: false
};

/**
 * Inizializza il chatbot con le configurazioni fornite
 * @param {Object} config - Configurazione personalizzata
 */
function initChatbot(config = {}) {
    // Unisci la configurazione di default con quella personalizzata
    const chatbotConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Crea l'elemento HTML del chatbot
    createChatbotElements(chatbotConfig);
    
    // Aggiungi gli event listener
    setupEventListeners();
    
    // Aggiungi il messaggio di benvenuto
    setTimeout(() => {
        addBotMessage(chatbotConfig.welcomeMessage);
    }, 500);
}

/**
 * Crea gli elementi HTML del chatbot
 * @param {Object} config - Configurazione del chatbot
 */
function createChatbotElements(config) {
    // Crea il container principale
    const chatbotWidget = document.createElement('div');
    chatbotWidget.className = 'chatbot-widget';
    
    // Crea il pulsante per aprire/chiudere il chatbot
    const chatbotButton = document.createElement('div');
    chatbotButton.className = 'chatbot-button';
    chatbotButton.innerHTML = '<span class="chatbot-icon">💬</span>';
    chatbotButton.style.backgroundColor = config.primaryColor;
    
    // Crea il container del chatbot
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    
    // Crea l'header del chatbot
    const chatbotHeader = document.createElement('div');
    chatbotHeader.className = 'chatbot-header';
    chatbotHeader.style.backgroundColor = config.primaryColor;
    chatbotHeader.innerHTML = `
        <div>${config.title}</div>
        <div class="chatbot-close">✕</div>
    `;
    
    // Crea il container dei messaggi
    const chatbotMessages = document.createElement('div');
    chatbotMessages.className = 'chatbot-messages';
    
    // Crea il form di input
    const chatbotInput = document.createElement('div');
    chatbotInput.className = 'chatbot-input';
    chatbotInput.innerHTML = `
        <input type="text" placeholder="Scrivi un messaggio...">
        <button><span>➤</span></button>
    `;
    
    // Assembla gli elementi
    chatbotContainer.appendChild(chatbotHeader);
    chatbotContainer.appendChild(chatbotMessages);
    chatbotContainer.appendChild(chatbotInput);
    
    chatbotWidget.appendChild(chatbotContainer);
    chatbotWidget.appendChild(chatbotButton);
    
    // Aggiungi il widget al body
    document.body.appendChild(chatbotWidget);
}

/**
 * Configura gli event listener per il chatbot
 */
function setupEventListeners() {
    // Pulsante per aprire/chiudere il chatbot
    const chatbotButton = document.querySelector('.chatbot-button');
    chatbotButton.addEventListener('click', toggleChatbot);
    
    // Pulsante di chiusura nell'header
    const chatbotClose = document.querySelector('.chatbot-close');
    chatbotClose.addEventListener('click', closeChatbot);
    
    // Invio del messaggio (pulsante)
    const sendButton = document.querySelector('.chatbot-input button');
    sendButton.addEventListener('click', sendMessage);
    
    // Invio del messaggio (tasto Invio)
    const inputField = document.querySelector('.chatbot-input input');
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

/**
 * Apre o chiude il chatbot
 */
function toggleChatbot() {
    const chatbotContainer = document.querySelector('.chatbot-container');
    chatbotState.isOpen = !chatbotState.isOpen;
    
    if (chatbotState.isOpen) {
        chatbotContainer.classList.add('active');
        // Focalizza l'input quando si apre il chatbot
        setTimeout(() => {
            document.querySelector('.chatbot-input input').focus();
        }, 300);
    } else {
        chatbotContainer.classList.remove('active');
    }
}

/**
 * Chiude il chatbot
 */
function closeChatbot() {
    const chatbotContainer = document.querySelector('.chatbot-container');
    chatbotContainer.classList.remove('active');
    chatbotState.isOpen = false;
}

/**
 * Invia un messaggio dell'utente
 */
function sendMessage() {
    const inputField = document.querySelector('.chatbot-input input');
    const message = inputField.value.trim();
    
    if (message === '') return;
    
    // Aggiungi il messaggio dell'utente alla chat
    addUserMessage(message);
    
    // Pulisci il campo di input
    inputField.value = '';
    
    // Se siamo in modalità prenotazione, gestiamo il flusso di prenotazione
    if (chatbotState.bookingMode) {
        handleBookingFlow(message);
    } else {
        // Altrimenti, invia il messaggio al server per elaborazione
        processMessage(message);
    }
}

/**
 * Aggiunge un messaggio dell'utente alla chat
 * @param {string} message - Il messaggio da aggiungere
 */
function addUserMessage(message) {
    const messagesContainer = document.querySelector('.chatbot-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message user';
    messageElement.textContent = message;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
    
    // Aggiungi il messaggio allo stato
    chatbotState.messages.push({
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString()
    });
}

/**
 * Aggiunge un messaggio del bot alla chat
 * @param {string} message - Il messaggio da aggiungere
 */
function addBotMessage(message) {
    const messagesContainer = document.querySelector('.chatbot-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot';
    messageElement.innerHTML = message;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
    
    // Aggiungi il messaggio allo stato
    chatbotState.messages.push({
        sender: 'bot',
        text: message,
        timestamp: new Date().toISOString()
    });
}

/**
 * Fa scorrere la chat verso il basso per mostrare i messaggi più recenti
 */
function scrollToBottom() {
    const messagesContainer = document.querySelector('.chatbot-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Elabora il messaggio dell'utente e ottiene una risposta dal server
 * @param {string} message - Il messaggio dell'utente
 */
async function processMessage(message) {
    // Mostra un indicatore di caricamento
    showTypingIndicator();
    
    try {
        // Controlla se il messaggio contiene parole chiave per la prenotazione
        if (message.toLowerCase().includes('prenotare') || 
            message.toLowerCase().includes('appuntamento') || 
            message.toLowerCase().includes('prenota')) {
            
            // Inizia il flusso di prenotazione
            hideTypingIndicator();
            startBookingFlow();
            return;
        }
        
        // Invia il messaggio al server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                sessionId: chatbotState.sessionId
            })
        });
        
        const data = await response.json();
        
        // Nascondi l'indicatore di caricamento
        hideTypingIndicator();
        
        // Aggiungi la risposta del bot
        addBotMessage(data.response);
        
    } catch (error) {
        console.error('Errore durante l\'elaborazione del messaggio:', error);
        hideTypingIndicator();
        addBotMessage('Mi dispiace, si è verificato un errore. Riprova più tardi.');
    }
}

/**
 * Mostra un indicatore di digitazione
 */
function showTypingIndicator() {
    const messagesContainer = document.querySelector('.chatbot-messages');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot typing-indicator';
    typingIndicator.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}

/**
 * Nasconde l'indicatore di digitazione
 */
function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Inizia il flusso di prenotazione
 */
function startBookingFlow() {
    chatbotState.bookingMode = true;
    
    // Mostra il calendario per selezionare la data
    addBotMessage('Vorrei aiutarti a prenotare un appuntamento. Per prima cosa, seleziona una data:');
    
    // Crea un semplice selettore di data
    const today = new Date();
    const datePickerHTML = createDatePicker(today);
    
    addBotMessage(datePickerHTML);
    
    // Aggiungi event listener per la selezione della data
    setTimeout(() => {
        const dateInput = document.querySelector('.date-picker input');
        dateInput.addEventListener('change', handleDateSelection);
    }, 100);
}

/**
 * Crea un selettore di data HTML
 * @param {Date} startDate - La data di inizio
 * @returns {string} - HTML del selettore di data
 */
function createDatePicker(startDate) {
    const minDate = startDate.toISOString().split('T')[0];
    
    return `
        <div class="booking-calendar">
            <h3>Seleziona una data</h3>
            <div class="date-picker">
                <input type="date" min="${minDate}" value="${minDate}">
            </div>
        </div>
    `;
}

/**
 * Gestisce la selezione della data
 * @param {Event} e - L'evento di cambio data
 */
function handleDateSelection(e) {
    const selectedDate = e.target.value;
    chatbotState.bookingData.date = selectedDate;
    
    // Mostra gli slot orari disponibili
    showTimeSlots(selectedDate);
}

/**
 * Mostra gli slot orari disponibili per la data selezionata
 * @param {string} date - La data selezionata
 */
async function showTimeSlots(date) {
    addBotMessage(`Hai selezionato la data: ${formatDate(date)}. Verifico gli orari disponibili...`);
    
    try {
        // Recupera gli orari disponibili dal server
        const response = await fetch(`/api/available-slots?date=${date}`);
        const data = await response.json();
        
        if (!data.availableSlots || data.availableSlots.length === 0) {
            addBotMessage(`Mi dispiace, non ci sono orari disponibili per la data selezionata. Prova a scegliere un'altra data.`);
            
            // Mostra nuovamente il selettore di data
            const today = new Date();
            const datePickerHTML = createDatePicker(today);
            addBotMessage(datePickerHTML);
            
            // Aggiungi event listener per la selezione della data
            setTimeout(() => {
                const dateInput = document.querySelector('.date-picker input');
                dateInput.addEventListener('change', handleDateSelection);
            }, 100);
            
            return;
        }
        
        addBotMessage(`Ora scegli un orario disponibile:`);
        
        const timeSlotsHTML = `
            <div class="booking-calendar">
                <h3>Orari disponibili</h3>
                <div class="time-slots">
                    ${data.availableSlots.map(slot => `
                        <div class="time-slot" data-time="${slot}">${slot}</div>
                    `).join('')}
                </div>
            </div>
        `;
        
        addBotMessage(timeSlotsHTML);
        
        // Aggiungi event listener per la selezione dell'orario
        setTimeout(() => {
            const timeSlots = document.querySelectorAll('.time-slot');
            timeSlots.forEach(slot => {
                slot.addEventListener('click', (e) => {
                    // Rimuovi la selezione precedente
                    timeSlots.forEach(s => s.classList.remove('selected'));
                    // Seleziona lo slot corrente
                    e.target.classList.add('selected');
                    
                    // Salva l'orario selezionato
                    const selectedTime = e.target.getAttribute('data-time');
                    handleTimeSelection(selectedTime);
                });
            });
        }, 100);
    } catch (error) {
        console.error('Errore nel recupero degli orari disponibili:', error);
        addBotMessage('Mi dispiace, si è verificato un errore nel recupero degli orari disponibili. Riprova più tardi.');
    }
}


/**
 * Gestisce la selezione dell'orario
 * @param {string} time - L'orario selezionato
 */
function handleTimeSelection(time) {
    chatbotState.bookingData.time = time;
    
    addBotMessage(`Hai selezionato l'orario: ${time}. Per completare la prenotazione, inserisci i tuoi dati:`);
    
    // Mostra il form per i dati personali
    const formHTML = `
        <div class="booking-calendar">
            <h3>Dati personali</h3>
            <div class="booking-form">
                <input type="text" placeholder="Nome e cognome" class="booking-name">
                <input type="text" placeholder="Email o telefono" class="booking-contact">
                <button class="booking-submit">Conferma prenotazione</button>
            </div>
        </div>
    `;
    
    addBotMessage(formHTML);
    
    // Aggiungi event listener per l'invio del form
    setTimeout(() => {
        const submitButton = document.querySelector('.booking-submit');
        submitButton.addEventListener('click', handleBookingSubmission);
    }, 100);
}

/**
 * Gestisce l'invio del form di prenotazione
 */
async function handleBookingSubmission() {
    const nameInput = document.querySelector('.booking-name');
    const contactInput = document.querySelector('.booking-contact');
    
    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();
    
    if (!name || !contact) {
        addBotMessage('Per favore, compila tutti i campi.');
        return;
    }
    
    chatbotState.bookingData.name = name;
    chatbotState.bookingData.contact = contact;
    
    // Mostra un indicatore di caricamento
    showTypingIndicator();
    
    try {
        // Invia la prenotazione al server
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                contact,
                date: chatbotState.bookingData.date,
                time: chatbotState.bookingData.time
            })
        });
        
        const data = await response.json();
        
        // Nascondi l'indicatore di caricamento
        hideTypingIndicator();
        
        if (response.ok) {
            // Prenotazione riuscita
            addBotMessage(`
                <p>Grazie ${name}! La tua prenotazione è stata confermata.</p>
                <p><strong>Data:</strong> ${formatDate(chatbotState.bookingData.date)}</p>
                <p><strong>Ora:</strong> ${chatbotState.bookingData.time}</p>
                <p>Riceverai una conferma via email o telefono.</p>
            `);
            
            // Resetta lo stato di prenotazione
            chatbotState.bookingMode = false;
            chatbotState.bookingData = {
                date: null,
                time: null,
                name: "",
                contact: ""
            };
        } else {
            // Errore nella prenotazione
            addBotMessage(`Mi dispiace, si è verificato un errore: ${data.error}`);
        }
    } catch (error) {
        console.error('Errore durante la prenotazione:', error);
        hideTypingIndicator();
        addBotMessage('Mi dispiace, si è verificato un errore. Riprova più tardi.');
    }
}

/**
 * Gestisce il flusso di prenotazione in base al messaggio dell'utente
 * @param {string} message - Il messaggio dell'utente
 */
function handleBookingFlow(message) {
    // Questa funzione può essere espansa per gestire risposte specifiche
    // durante il flusso di prenotazione, se necessario
}

/**
 * Formatta una data in formato leggibile
 * @param {string} dateString - La data in formato ISO
 * @returns {string} - La data formattata
 */
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', options);
}

/**
 * Genera un ID di sessione univoco
 * @returns {string} - L'ID di sessione
 */
function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15);
}

// Esponi la funzione di inizializzazione globalmente
window.initChatbot = initChatbot;