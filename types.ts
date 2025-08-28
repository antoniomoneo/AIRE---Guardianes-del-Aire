
import type { ReactNode } from 'react';
import type p5 from 'p5';
import type * as THREE from 'three';

export enum Character {
  AIRE = "A.I.R.E.",
  Player = "Tú",
  System = "System",
}

export interface Dialogue {
  character: Character;
  text: string | ReactNode | ((name: string) => string);
  image?: string;
}

export interface QuizOption {
    id: string;
    text: string;
}
  
export interface QuizData {
    question: string;
    options: QuizOption[];
    correctAnswerId: string;
    feedback: {
        correct: string;
        incorrect: string;
    };
}

export interface SceneData {
  id: number;
  title: string;
  backgroundImage: string;
  videoBackground?: string;
  dialogues: Dialogue[];
  startYear?: number;
  endYear?: number;
  quiz?: QuizData;
  chatEnabled?: boolean;
}

export interface AirQualityRecord {
  MES: number;
  ANO: number;
  ESTACION: number;
  NO2: number | null;
  PM2_5: number | null;
  PM10: number | null;
  O3: number | null;
  SO2: number | null;
}

export type ProcessedData = { year: number; NO2: number }[];

export enum Pollutant {
  NO2 = 'NO2',
  PM2_5 = 'PM2_5',
  PM10 = 'PM10',
  O3 = 'O3',
  SO2 = 'SO2',
}

export type DashboardDataPoint = {
  date: string; // "YYYY" or "YYYY-MM"
  value: number;
};

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// --- Creation Studio Types ---

export interface VisualizationSketchOptions {
    speed: number;
}

export type P5Sketch = (p: p5) => { setup: () => void; draw: () => void; };
export type P5SketchFunction = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => P5Sketch;

export interface VisualizationOption {
    id: string;
    name: string;
    sketch: P5SketchFunction;
}


export type Instrument = 'synthPad' | 'crystalPluck' | 'rhythmicKit';
export type Rhythm = 'sustained' | 'arpUp' | 'arpDown';
export type Key = 'major' | 'minor';

export interface TrackOptions {
  id: string;
  pollutant: Pollutant;
  instrument: Instrument;
  octave: number;
  rhythm: Rhythm;
  filterRange: { min: number; max: number };
  volume: number;
  isMuted: boolean;
}

export interface SonificationOptions {
  tracks: TrackOptions[];
  key: Key;
  stepDuration: number;
}

// --- 3D Studio Types ---
export interface Visualization3DOptions {
    heightMultiplier: number;
    colorScheme: 'pollutant' | 'terrain';
}

export type Visualization3DGenerator = (
    scene: THREE.Scene, 
    data: DashboardDataPoint[], 
    options: Visualization3DOptions
) => () => void; // Returns a cleanup function

export interface Visualization3DOption {
    id: string;
    name: string;
    generator: Visualization3DGenerator;
}

// --- Gallery Types ---

export interface GalleryItemBase {
    id: string;
    author: string;
    title: string;
    createdAt: string; // ISO date string
    votes: number;
    type: 'audio-viz' | '3d-model' | 'insight';
}

export interface AudioVizGalleryItem extends GalleryItemBase {
    type: 'audio-viz';
    videoDataUrl: string; // Base64 data URL
    config: {
        title: string;
        visualPollutant: Pollutant;
        selectedVizId: string;
        startYear: number;
        endYear: number;
        sonificationOptions: SonificationOptions;
    }
}

export interface Model3DGalleryItem extends GalleryItemBase {
    type: '3d-model';
    imageDataUrl: string; // Base64 data URL
    config: {
        title: string;
        selectedPollutant: Pollutant;
        selectedVizId: string;
        startYear: number;
        endYear: number;
        heightMultiplier: number;
        colorScheme: 'pollutant' | 'terrain';
    }
}

export interface InsightGalleryItem extends GalleryItemBase {
    type: 'insight';
    conclusion: string;
    recommendation: string;
    config: {
        pollutant: Pollutant;
        aggregation: 'annual' | 'monthly';
    }
}

export type GalleryItem = AudioVizGalleryItem | Model3DGalleryItem | InsightGalleryItem;

// --- Ranking/Scoring Types ---
export interface User {
    name: string;
    score: number;
}
