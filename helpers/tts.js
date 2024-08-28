require('dotenv').config();
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const blendShapeNames = require('./blendshapeNames');
const _ = require('lodash');
const axios = require('axios');

const SSML_TEMPLATE = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="es-MX-DaliaNeural">
    <mstts:viseme type="FacialExpression"/>
    __TEXT__
  </voice>
</speak>`;

const key = process.env.AZURE_KEY;
const region = process.env.AZURE_REGION;
const gptApiKey = process.env.GPT_API_Key;

let messageHistory = [];

let baseDeConocimiento = `Avance y Tecnología en Plásticos fue fundada en la Cd. de Chihuahua en agosto de 1988 por dos jóvenes estudiantes continuando un proyecto escolar, ofreciendo la fabricación de productos y servicios relacionados con el plástico y el acrílico. En sus inicios, Avance y Tecnología en Plásticos contaba con un pequeño equipo de trabajo integrado por 3 personas, quienes realizaban todas las operaciones, adoptando como misión "La Satisfacción Total de Nuestros Clientes".

Con espíritu emprendedor, escuchando atentamente las necesidades de nuestros clientes y del mercado, fuimos incorporando una gran variedad de productos, lo que nos llevó a convertirnos en uno de los proveedores de plásticos y de imagen gráfica más importantes en el Norte de la República y otros puntos del país. Esto surgió la necesidad de abrir nuevas sucursales para estar cada vez más cerca de nuestros clientes y brindarles un mejor servicio.

En la actualidad, nuestras oficinas corporativas y centro de distribución se encuentran ubicados en un importante complejo industrial de la Cd. de Chihuahua conocido como Parque Industrial Américas. Contamos con 23 sucursales localizadas en las principales ciudades de la República Mexicana, tales como:

- Tlalnepantla, Cd. de México
- Cd. Juárez
- Hermosillo
- Obregón
- Culiacán
- Mexicali
- Torreón
- Saltillo
- Durango
- León
- Aguascalientes
- Querétaro
- San Luis Potosí
- Puebla
- Tijuana
- Monterrey
- Guadalajara
- Zapopan
- Veracruz
- Zacatecas
- Tuxtla Gtz., Chiapas
- Cuauhtémoc
- Chihuahua, Chih.

Cada sucursal cuenta con una bodega de almacenamiento para proveer productos de calidad, con la disponibilidad y variedad que siempre nos ha caracterizado, manteniendo un gran volumen de materiales y equipos al servicio de nuestros clientes. Nuestro equipo humano está integrado por 350 personas, debidamente capacitadas y enfocadas en cumplir con las expectativas de nuestros clientes. En Avance siempre nos hemos caracterizado por estar a la vanguardia con productos innovadores y las últimas tecnologías en equipo, ofreciendo a nuestros clientes productos novedosos y de calidad. Por lo que nos hemos convertido en distribuidores de importantes marcas reconocidas internacionalmente como:

- 3M
- Roland
- HP
- Silhouette
- Siser
- Plastiglas de México
- Cricut
- Orafol
- Graphtec
- Orionjet
- Zebra
- Leister
- Sawgrass
- Xtool
- Avery y muchas más.

Nos esforzamos activamente en llevar a nuestros clientes al éxito.

**Visión**
Ser una empresa de clase mundial en constante crecimiento, líder en el mercado, logrando rentabilidad para los accionistas y asegurando que nuestros clientes alcancen su visión conjuntamente con la nuestra, convirtiéndonos en su proveedor de mayor confianza. Ofreciéndoles valor agregado con:

- Servicio de calidad incomparable.
- Productos y procesos innovadores que excedan las expectativas de nuestros clientes.
- Colaboradores que se desarrollen continuamente en un excelente ambiente de trabajo.

**Misión**
Satisfacer totalmente a nuestros clientes, ofreciendo variedad y disponibilidad con productos de calidad a precios competitivos. Sustentado en los siguientes elementos clave:

- Excelente servicio al cliente con rapidez y eficiencia.
- Innovación en nuestros productos y procesos con enfoque al valor agregado.
- Colaboradores comprometidos, profesionales y altamente capacitados en un ambiente de trabajo de calidad.

Lograremos nuestra misión viviendo nuestros valores y cumpliendo con las obligaciones de nuestro entorno para contribuir al desarrollo social y económico de nuestro país.

**Los 10 valores de Avance**
Nuestra visión y misión se logran gracias al recurso humano liderado por nuestra dirección y nuestros valores, que son: Calidad, compromiso, honestidad, lealtad, profesionalismo, respeto, responsabilidad, servicio, trabajo en equipo e innovación.

1. **Calidad**: "La superación constante es mi forma de vida y trabajo. Logro satisfacer las necesidades y excedo las expectativas de con quien me relaciono."
2. **Compromiso**: "Cumplo con voluntad, esfuerzo y dedicación mis responsabilidades, obligaciones y promesas. Logro resultados y beneficios reales para mi empresa, familia, sociedad y mi persona."
3. **Honestidad**: "Actúo con rectitud, transparencia y honradez. Hablo con la verdad ganándome la confianza de mis clientes, empresa y familia."
4. **Lealtad**: "Ofrezco seguridad a quien deposita su confianza en mí. Brindo apoyo en todo momento y respondo con la verdad. Manejo la información de manera discreta y confidencial. Estoy comprometido con mi familia, empresa y clientes."
5. **Profesionalismo**: "Logro los objetivos que me propongo buscando la productividad de la empresa. Dedico tiempo y esfuerzo en el aprendizaje total de mis actividades, optimizando recursos, dando confianza y seguridad con los resultados de mi trabajo."
6. **Respeto**: "Mi forma de actuar se caracteriza por saber escuchar, ser amable, prudente y considerado. Comprendo claramente que el respeto a uno mismo y a los demás es la base para convivir en sociedad y afrontar las diferencias de ideas, costumbres y creencias."
7. **Responsabilidad**: "Cumplo en tiempo y forma lo que me corresponde en el trabajo, en la familia y en la sociedad. Soy una persona productiva y realizo todo mi esfuerzo para ganarme la confianza de los que me rodean. Gracias a esto, puedo convivir de manera pacífica y en armonía, siempre dando lo mejor de mí para alcanzar mis metas."
8. **Servicio**: "Construyo relaciones de largo plazo y mutuo beneficio, atendiendo a mis clientes y compañeros de manera profesional, responsable, honesta, con disponibilidad y respeto. Creo firmemente que la contribución al éxito de mis clientes, internos y externos, es mi principal objetivo."
9. **Trabajo en Equipo**: "Conozco la misión y la visión de la empresa, y tengo la disposición de ayudar y apoyar a todos mis compañeros, con comunicación, esfuerzo y respeto. Respondo con productividad, a tiempo y con calidad, para cumplir con nuestros objetivos y que mis compañeros confíen en mí. Colaborando todos, logramos más y mejores resultados de una manera fácil y rápida."
10. **Innovación**: "Busco contribuir al desarrollo y crecimiento de la empresa, aportando continuamente nuevas ideas de valor agregado en cuanto a la forma de desempeñar mis actividades, con el objetivo de mejorar los procesos y productos de la empresa. productos"`;


const textToSpeech = async (text, voice) => {
    try {
        console.log(text);

        // Agregar el nuevo mensaje del usuario al historial
        messageHistory.push({ role: "user", content: text });

         // Enviar texto a GPT y esperar la respuesta
         const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo-16k",
            messages: [
                {
                    role: "system",
                    content: "Mi nombre es pacsi. un asistente virtual que esta para resolver cualquier duda sobre la empresa avance y tecnologia en plasticos. Las respuestas deben de ser breves y claras, de no mas de 200 tokens. La base de conocimiento para esta conversación es la siguiente: " + baseDeConocimiento
                },
                ...messageHistory
            ],
            max_tokens: 200
        }, {
            headers: {
                'Authorization': `Bearer ${gptApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const gptText = gptResponse.data.choices[0].message.content.trim();

        // Agregar la respuesta de GPT al historial
        messageHistory.push({ role: "assistant", content: gptText });

        // Reemplazar el texto en el SSML con la respuesta de GPT
        const ssml = SSML_TEMPLATE.replace("__TEXT__", gptText);

        const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

        const randomString = Math.random().toString(36).slice(2, 7);
        const filename = `./public/speech-${randomString}.mp3`;
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        let blendData = [];
        let timeStep = 1 / 60;
        let timeStamp = 0;

        // Subscribes to viseme received event
        synthesizer.visemeReceived = (s, e) => {
            const animation = JSON.parse(e.animation);

            animation.BlendShapes.forEach(blendArray => {
                let blend = {};
                blendShapeNames.forEach((shapeName, i) => {
                    blend[shapeName] = blendArray[i];
                });

                blendData.push({
                    time: timeStamp,
                    blendshapes: blend
                });
                timeStamp += timeStep;
            });
        };

        // Synthesize speech from SSML
        return new Promise((resolve, reject) => {
            synthesizer.speakSsmlAsync(
                ssml,
                result => {
                    synthesizer.close();
                    resolve({ blendData, filename: `/speech-${randomString}.mp3` });
                },
                error => {
                    synthesizer.close();
                    console.error('Error:', error);
                    reject(error);
                }
            );
        });
    } catch (error) {
        console.error('Error during GPT request:', error);
        throw error;
    }
};

module.exports = textToSpeech;
