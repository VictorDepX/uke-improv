import { ChordTracker, computeChroma, matchChord } from './chroma';
import { magnitudeSpectrum } from './fft';
import { PitchTracker } from './pitch';

export interface RecordingEvent {
  time: number;
  kind: 'note' | 'chord';
  midi?: number;
  symbol?: string;
}

const PITCH_SIZE = 2048;
const PITCH_HOP = 1024;
const FFT_SIZE = 8192;
const CHROMA_HOP = 2048;

/**
 * Analisa uma gravação inteira com os mesmos detectores do microfone.
 * Alternativa quando o navegador não libera o microfone (ex.: dentro de um iframe).
 */
export function analyzeRecording(
  samples: Float32Array,
  sampleRate: number,
  chordCandidates: readonly string[],
): RecordingEvent[] {
  const events: RecordingEvent[] = [];
  const pitch = new PitchTracker();
  for (let end = PITCH_SIZE; end <= samples.length; end += PITCH_HOP) {
    for (const e of pitch.process(samples.subarray(end - PITCH_SIZE, end), sampleRate).events) {
      if (e.type === 'noteOn') events.push({ time: end / sampleRate, kind: 'note', midi: e.midi });
    }
  }
  const chords = new ChordTracker();
  for (let end = FFT_SIZE; end <= samples.length; end += CHROMA_HOP) {
    const frame = samples.subarray(end - FFT_SIZE, end);
    let energy = 0;
    for (let i = 0; i < frame.length; i += 8) energy += frame[i]! * frame[i]!;
    if (Math.sqrt(energy / (frame.length / 8)) < 0.01) {
      chords.process(undefined);
      continue;
    }
    const hit = chords.process(
      matchChord(computeChroma(magnitudeSpectrum(frame), sampleRate), chordCandidates)[0],
    );
    if (hit) events.push({ time: end / sampleRate, kind: 'chord', symbol: hit.symbol });
  }
  return events.sort((a, b) => a.time - b.time);
}

/** Mistura os canais em mono. */
export function toMono(buffer: {
  numberOfChannels: number;
  length: number;
  getChannelData(i: number): Float32Array;
}): Float32Array {
  const out = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < out.length; i++) out[i]! += data[i]! / buffer.numberOfChannels;
  }
  return out;
}
