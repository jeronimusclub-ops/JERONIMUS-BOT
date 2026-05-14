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
// FUNCIÓN: ENVIAR MENSAJE DE TEXTO
// =====================================

async function sendText(to, body) {
    await axios.post(
        `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body }
        },
        {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        }
    );
}


// =====================================
// FUNCIÓN: ENVIAR MENSAJE CON BOTÓN VOLVER
// =====================================

async function sendTextWithBack(to, body) {
    await axios.post(
        `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: body },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'menu',
                                title: '🏠 Volver al menú'
                            }
                        }
                    ]
                }
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


// =====================================
// FUNCIÓN: ENVIAR MENÚ CON BOTONES
// =====================================

async function sendMenu(to) {
    await axios.post(
        `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text:
`👋🏻 ¡Hola! Gracias por comunicarte con el *Club Jerónimus* 🚴🏻
Soy Natalia y estoy aquí para ayudarte.

Por favor, selecciona una opción:`
                },
                action: {
                    button: '📋 Ver opciones',
                    sections: [
                        {
                            title: 'Menú principal',
                            rows: [
                                { id: '1', title: '📍 Horarios y ubicación' },
                                { id: '2', title: '💳 Precios y planes' },
                                { id: '3', title: '🚵🏻 Categorías' },
                                { id: '4', title: '⭐ Beneficios del club' },
                                { id: '5', title: '🙋🏻‍♀️ Hablar con Natalia' }
                            ]
                        }
                    ]
                }
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


// =====================================
// RECIBIR MENSAJES
// =====================================

app.post('/webhook', async (req, res) => {

    try {

        const body = req.body;

        const message =
            body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (message) {

            const from = message.from;
            const isFirstMessage = !userState[from];

            // Leer texto normal, botón de lista o botón de reply
            const text = message.text?.body?.trim().toLowerCase();
            const buttonId = message.interactive?.list_reply?.id
                || message.interactive?.button_reply?.id;

            console.log('Mensaje:', text || buttonId);


            // =====================================
            // LÓGICA DEL CHATBOT
            // =====================================

            if (isFirstMessage || text === 'hola' || text === 'menu' || text === 'menú' || buttonId === 'menu') {

                userState[from] = { started: true };
                await sendMenu(from);

            } else if (buttonId === '1') {

                await sendTextWithBack(from,
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
Salidas Programadas: sábados 7:00 AM`
                );

            } else if (buttonId === '2') {

                await sendTextWithBack(from,
`💳 Precios y planes

Inscripción: $70.000 (pago único)
Póliza de seguro anual: $60.000

‣ Entrenamiento 1 vez por semana: $100.000/mes
‣ Entrenamiento 2 veces por semana: $140.000/mes
‣ Entrenamiento 3 veces por semana: $160.000/mes

GRUPO DE AVANZADOS:
‣ Entrenamiento 4 veces por semana: $180.000/mes

CLASE INDIVIDUAL: $30.000 por sesión

✨ Todos los pagos realizados al club son soportados con facturación electrónica.`
                );

            } else if (buttonId === '3') {

                await sendTextWithBack(from,
`🚵🏻 Nuestras Categorías

*MINI RIDERS:* 2 a 5 años
Enfocado en la diversión y el desarrollo de habilidades básicas.
Bicicleta sin pedales.

*INICIACIÓN:* 6 a 10 años
Ideal para niños que quieren aprender y mejorar sus habilidades.
Bicicleta con pedales.

*AVANZADOS:* 10 años en adelante
Para niños que buscan un entrenamiento más intenso y competitivo.`
                );

            } else if (buttonId === '4') {

                await sendTextWithBack(from,
`⭐ Beneficios del club

✅ Comunidad exclusiva
✅ Entrenadores certificados
✅ Eventos y competencias
✅ Seguimiento personalizado`
                );

            } else if (buttonId === '5') {

                userState[from].waitingForInfo = true;

                await sendText(from,
`🙋🏻‍♀️ Con gusto te comunicamos con Natalia.

Por favor escríbenos tu *nombre* y tu *consulta* en un solo mensaje y ella te contactará pronto.`
                );

            } else if (userState[from]?.waitingForInfo) {

                userState[from].waitingForInfo = false;
                userState[from].consulta = text;

                await sendTextWithBack(from,
`✅ Listo, hemos recibido tu mensaje.

Natalia se comunicará contigo pronto. 😊`
                );

                // Notificar a Natalia (descomenta y pon el número de Natalia)
                // await sendText('57NUMERODENATALIA', `Nueva consulta de ${from}:\n${text}`);

            } else {

                await sendMenu(from);

            }

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
