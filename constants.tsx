
import React from 'react';
import type { SceneData } from './types';
import { Character, Pollutant } from './types';
import { AIR_QUALITY_REPORT_TEXT } from './data/report';

export const POLLUTANT_NAMES: Record<Pollutant, string> = {
  [Pollutant.NO2]: "Dióxido de Nitrógeno (NO₂)",
  [Pollutant.PM25]: "Partículas < 2.5µm (PM₂.₅)",
  [Pollutant.PM10]: "Partículas < 10µm (PM₁₀)",
  [Pollutant.O3]: "Ozono (O₃)",
  [Pollutant.SO2]: "Dióxido de Azufre (SO₂)",
};

export const AI_KNOWLEDGE_BASE = AIR_QUALITY_REPORT_TEXT;

export const SCENES: SceneData[] = [
  {
    id: 1,
    title: "Misión: Guardián del Aire",
    backgroundImage: "https://images.unsplash.com/photo-1598535342412-4d7514d355bd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoBackground: "https://videos.pexels.com/video-files/3209223/3209223-hd_1920_1080_25fps.mp4",
    dialogues: [
      { character: Character.AIRE, text: "Iniciando simulación... ¡Hola! Soy A.I.R.E., tu Asistente de Inteligencia para la Remediación Ecológica." },
      { character: Character.AIRE, text: (name: string) => `Tu misión, ${name}, si decides aceptarla, es convertirte en un Guardián o Guardiana del Aire. Viajarás en el tiempo para entender cómo ha cambiado el aire que respiramos en Madrid.` },
      { character: Character.Player, text: "¿Viajar en el tiempo? Suena increíble. ¿Por dónde empezamos?" },
      { character: Character.AIRE, text: "Por el principio de nuestro registro de datos. Prepárate, nuestro primer salto nos lleva a los primeros años del siglo XXI. ¡Allá vamos!" }
    ],
  },
  {
    id: 2,
    title: "2001-2007: Años de Humo y Crecimiento",
    backgroundImage: "https://images.unsplash.com/photo-1620583340539-75878839ed04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoBackground: "https://videos.pexels.com/video-files/853870/853870-hd_1920_1080_30fps.mp4",
    startYear: 2001,
    endYear: 2007,
    dialogues: [
      { character: Character.AIRE, text: "Hemos llegado a la primera década de los 2000. El país vivía un boom económico, y eso se notaba en las calles... y en los pulmones." },
      { character: Character.AIRE, text: "Mira el gráfico. El nivel de NO₂, un gas muy dañino, se mantuvo muy alto, casi siempre por encima del límite legal que se haría obligatorio años después." },
      { character: Character.Player, text: "La línea está casi plana y muy arriba. ¿Qué lo causaba?" },
      { character: Character.AIRE, text: "El tráfico. Cada vez había más coches, sobre todo diésel, y las medidas para controlar sus humos eran muy básicas. La ciudad crecía, pero el aire sufría." }
    ],
    quiz: {
      question: "Según los datos, ¿cuál fue el principal motor de la alta contaminación en Madrid entre 2001 y 2007?",
      options: [
        { id: 'a', text: 'El crecimiento del tráfico, especialmente de vehículos diésel.' },
        { id: 'b', text: 'Las pocas lluvias de esos años.' },
        { id: 'c', text: 'La contaminación que venía de las afueras de la ciudad.' },
      ],
      correctAnswerId: 'a',
      feedback: {
        correct: '¡Exacto! El auge económico disparó el número de coches, y esa fue la causa principal.',
        incorrect: 'No exactamente. La clave de ese período fue el enorme aumento del tráfico por el crecimiento económico.'
      }
    }
  },
  {
    id: 3,
    title: "2008-2010: La Crisis y el Primer Respiro",
    backgroundImage: "https://images.unsplash.com/photo-1582239489254-47176a7e286c?q=80&w=1974&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoBackground: "https://videos.pexels.com/video-files/7578278/7578278-hd_1920_1080_25fps.mp4",
    startYear: 2001,
    endYear: 2010,
    dialogues: [
      { character: Character.Player, text: "¡Oye, la línea del gráfico empieza a bajar! ¿Qué pasó a partir de 2008?" },
      { character: Character.AIRE, text: "Observas bien. Ocurrieron dos cosas importantes. Primero, la crisis económica de 2008 frenó la actividad y redujo el tráfico. Menos coches, menos contaminación." },
      { character: Character.AIRE, text: "Segundo, entró en vigor una nueva ley europea más estricta que obligaba a las ciudades a cumplir límites de contaminación para 2010. Fue una llamada de atención." },
    ],
    quiz: {
        question: "¿Qué dos factores clave provocaron el primer descenso de la contaminación a partir de 2008?",
        options: [
          { id: 'a', text: 'Más gente usando la bici y la plantación masiva de árboles.' },
          { id: 'b', text: 'La crisis económica y las nuevas leyes europeas más exigentes.' },
          { id: 'c', text: 'El uso de combustibles más limpios y el cierre de fábricas.' },
        ],
        correctAnswerId: 'b',
        feedback: {
          correct: '¡Correcto! La combinación de la recesión y la presión legal europea marcó el inicio del cambio.',
          incorrect: 'Casi, pero no. Los factores determinantes fueron la crisis económica, que redujo el tráfico, y la nueva directiva europea.'
        }
      }
  },
    {
    id: 4,
    title: "2015-2019: Madrid Central, una Medida Valiente",
    backgroundImage: "https://images.unsplash.com/photo-1578328334237-6d1ad1e3f421?q=80&w=2071&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoBackground: "https://videos.pexels.com/video-files/3058097/3058097-hd_1920_1080_25fps.mp4",
    startYear: 2011,
    endYear: 2019,
    dialogues: [
      { character: Character.AIRE, text: "Avanzamos a un período clave. Después de unos años de mejora lenta, en 2017 la contaminación repuntó con fuerza. La economía se recuperaba y el tráfico volvía a las andadas." },
      { character: Character.Player, text: "Se ve claramente ese pico en el gráfico. ¿Y esa caída tan brusca justo después?" },
      { character: Character.AIRE, text: "Esa es la clave. A finales de 2018 se implementó 'Madrid Central', una gran área del centro donde se prohibió circular a los coches más contaminantes. Fue una medida muy discutida, pero mira el resultado." }
    ],
    quiz: {
      question: "¿Qué medida, implementada a finales de 2018, fue decisiva para reducir drásticamente los niveles de NO₂ en el centro de Madrid?",
      options: [
        { id: 'a', text: 'La renovación de todos los autobuses.' },
        { id: 'b', text: 'Madrid Central, la Zona de Bajas Emisiones.' },
        { id: 'c', text: 'La limitación de velocidad en la M-30.' },
      ],
      correctAnswerId: 'b',
      feedback: {
        correct: '¡Muy bien! Madrid Central demostró que restringir el tráfico en zonas clave tiene un impacto directo y muy positivo.',
        incorrect: 'Esa no fue la medida principal. La acción más impactante de ese periodo fue la creación de Madrid Central.'
      }
    }
  },
  {
    id: 5,
    title: "2020: El Mundo se Detiene",
    backgroundImage: "https://images.unsplash.com/photo-1585252422039-44f25f14e5a2?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoBackground: "https://videos.pexels.com/video-files/4060846/4060846-hd_1920_1080_25fps.mp4",
    startYear: 2015,
    endYear: 2020,
    dialogues: [
        { character: Character.Player, text: "¡Wow! ¿Qué es esa caída en picado en 2020? Es la más grande de todas." },
        { character: Character.AIRE, text: "Estás viendo el efecto de la pandemia de COVID-19. Durante meses, el confinamiento vació las calles de coches. Fue un experimento a escala real." },
        { character: Character.AIRE, text: "Los niveles de NO₂ se desplomaron más de un 50%. Por primera vez en la historia reciente, Madrid respiró un aire realmente limpio. Nos demostró de forma innegable la relación entre tráfico y polución." },
    ],
    quiz: {
        question: "El drástico descenso de la contaminación en 2020 fue un 'experimento involuntario' que demostró que...",
        options: [
            { id: 'a', text: '...el clima tiene el mayor impacto en la calidad del aire.' },
            { id: 'b', text: '...reducir el tráfico de forma masiva tiene un efecto inmediato y enorme en la limpieza del aire.' },
            { id: 'c', text: '...las calefacciones contaminan más que los coches.' },
        ],
        correctAnswerId: 'b',
        feedback: {
            correct: '¡En el clavo! La pandemia dejó claro que la principal palanca para mejorar el aire de la ciudad es gestionar el tráfico.',
            incorrect: 'Piénsalo otra vez. El cambio más radical de 2020 fue la ausencia de coches, que provocó la histórica caída de la contaminación.'
        }
    }
  },
  {
    id: 6,
    title: "2021-2024: Hacia un Futuro Sostenible",
    backgroundImage: "https://images.unsplash.com/photo-1620649197304-837a34615967?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoBackground: "https://videos.pexels.com/video-files/4388915/4388915-uhd_3840_2160_25fps.mp4",
    startYear: 2001,
    endYear: 2024,
    dialogues: [
        { character: Character.AIRE, text: "Y llegamos a la actualidad. Tras la pandemia, el tráfico volvió, pero no toda la contaminación. Las Zonas de Bajas Emisiones se extendieron a toda la ciudad con la estrategia 'Madrid 360'." },
        { character: Character.Player, text: "Entonces, ¿las medidas funcionaron a largo plazo?" },
        { character: Character.AIRE, text: "Sí. Como ves en el gráfico completo, desde 2022 Madrid ha cumplido por fin con la normativa europea de NO₂ de forma constante, alcanzando en 2024 los niveles más bajos de la historia. Pero... ha surgido un nuevo enemigo." },
        { character: Character.Player, text: "¿Otro? ¿Cuál?" },
        { character: Character.AIRE, text: "El ozono (O₃). Con veranos cada vez más calurosos por el cambio climático, este contaminante está aumentando. La lucha por un aire limpio nunca termina." },
    ],
    quiz: {
        question: "En el periodo 2021-2024, Madrid logró cumplir la normativa de NO₂, pero ¿qué contaminante se convirtió en un nuevo reto por el aumento de las temperaturas?",
        options: [
            { id: 'a', text: 'El Dióxido de Azufre (SO₂)' },
            { id: 'b', text: 'Las partículas PM10' },
            { id: 'c', text: 'El ozono (O₃)' },
        ],
        correctAnswerId: 'c',
        feedback: {
            correct: '¡Muy bien! El ozono es un contaminante secundario que se agrava con el calor, y es el nuevo gran desafío.',
            incorrect: 'No, ese no fue el principal. El calor extremo de los últimos veranos ha disparado los niveles de ozono (O₃).'
        }
    }
  },
  {
    id: 7,
    title: "Tu Misión Continúa",
    backgroundImage: "https://images.unsplash.com/photo-1593859982869-09f1e1419a4a?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoBackground: "https://videos.pexels.com/video-files/3843336/3843336-hd_1920_1080_25fps.mp4",
    dialogues: [
       { character: Character.AIRE, text: "Has completado tu viaje por la historia del aire de Madrid. Has visto cómo las decisiones, las crisis y la tecnología han moldeado el aire que respiramos." },
       { character: Character.AIRE, text: (name: string) => `Ahora tienes el conocimiento, ${name}. La base de datos histórica está a tu disposición. Pregúntame lo que quieras para profundizar y seguir aprendiendo. La misión de un Guardián o Guardiana del Aire nunca termina.` },
    ],
    chatEnabled: true
  }
];