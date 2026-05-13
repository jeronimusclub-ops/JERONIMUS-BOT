require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const userState = {};

app.use(express.json());

const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


// =====================================
// VERIFICAR WEBHOOK
// =====================================

app.get('/webhook', (req, res) => {

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log('Webhook verificado');
        return res.status(200).send(challenge);
    }

    res.sendStatus(403);
});


// =====================================
// RECIBIR MENSAJES
// =====================================

app.post('/webhook', async (req, res) => {

    try {

        const body = req.body;

        console.log(JSON.stringify(body, null, 2));

        const message =
            body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (message) {

            const from = message.from;
            const isFirstMessage = !userState[from];

            const text =
                message.text?.body?.trim().toLowerCase();

            console.log('Mensaje:', text);


            // =====================================
            // LÓGICA DEL CHATBOT
            // =====================================

            let reply = '';

            if (isFirstMessage) {

                userState[from] = { started: true };

                reply =
`👋🏻 ¡Hola! Gracias por comunicarte con el *Club Jerónimus* 🚴🏻
Soy Natalia y estoy aquí para ayudarte.

Por favor, selecciona una opción:

🔹 1. Horarios y ubicación
🔹 2. Precios y planes
🔹 3. Información sobre categorias
🔹 4. Beneficios del club
🔹 5. Hablar con Natalia`;

            } else if (text === '1') {

                reply =
`📍 Horarios y ubicación

Estamos ubicados en:
*PARQUE LAGO DE LA PRADERA, DOSQUEBRADAS*

Horarios:

MINI RIDERS:
Miércoles: 4:30 PM - 5:45 PM
Sábados: 10:30 AM - 11:45 AM

INICIACIÓN:
Lunes: 4:30 PM - 6:00 PM
Viernes: 3:00 PM - 4:30 PM
Sábados: 9:00 AM - 10:30 AM y 3:30 PM - 5:00 PM

AVANZADOS:
Martes, jueves y viernes: 4:00 PM - 6:00 PM
Sábados: 8:00 AM - 9:30 AM
Salidas Programadas: sábados 7:00 AM
`;

            } else if (text === '2') {

                reply =
`💳 Precios y planes

Tenemos varios planes disponibles.

Inscripción: $70.000 (pago único)
Póliza de seguro anual: $60.000

‣ Entrenamiento 1 vez por semana: $100.000/mes
‣ Entrenamiento 2 veces por semana: $140.000/mes
‣ Entrenamiento 3 veces por semana: $160.000/mes

GRUPO DE AVANZADOS:
‣ Entrenamiento 4 veces por semana: $180.000/mes

CLASE INDIVIDUAL: $30.000 por sesión

✨ Todos los pagos realizados al club son soportados con facturación electrónica.`;

            } else if (text === '3') {

                reply =
`🚵🏻 Nuestras Categorías

*MINI RIDERS:* 2 a 5 años
Enfocado en la diversión y el desarrollo de habilidades básicas.
Bicicleta sin pedales.

*INICIACIÓN:* 6 a 10 años
Ideal para niños que quieren aprender y mejorar sus habilidades.
Bicicleta con pedales.

*AVANZADOS:* 10 años en adelante
Para niños que buscan un entrenamiento más intenso y competitivo.`;

            } else if (text === '4') {

                reply =
`⭐ Beneficios del club

✅ Comunidad exclusiva
✅ Entrenadores
✅ Eventos
✅ Seguimiento`;

            } else if (text === '5') {

                reply =
`🙋🏻‍♀️ Natalia se comunicará contigo pronto.

Déjanos tu nombre y consulta.`;

            } else {

                reply =
`😅 No entendí tu mensaje.
Elige una opción del menú o escribe "5" para hablar con Natalia.`;

            }


            // =====================================
            // RESPUESTA AUTOMÁTICA
            // =====================================

            await axios.post(
                `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: from,
                    text: {
                        body: reply
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

        }

        res.sendStatus(200);

    } catch (error) {
        console.log(error.response?.data || error.message);
        res.sendStatus(500);
    }

});


// =====================================
// INICIAR SERVIDOR
// =====================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});