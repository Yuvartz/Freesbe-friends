// Node.js script to analyze swish .wav files for peak time and recommended volume
// Usage: node analyzeSwishes.js

const fs = require('fs');
const path = require('path');
const wav = require('node-wav');

const SWISHES_DIR = path.join(__dirname, '../build/swishes');
const TARGET_PEAK = 0.85; // normalize so loudest is at this volume

function getWavFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.wav'));
}

function analyzeBuffer(buffer) {
  // Returns {peak, peakTime, rms}
  let max = 0;
  let maxIdx = 0;
  let sumSq = 0;
  for (let i = 0; i < buffer.length; i++) {
    const abs = Math.abs(buffer[i]);
    if (abs > max) {
      max = abs;
      maxIdx = i;
    }
    sumSq += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSq / buffer.length);
  return { peak: max, peakIdx: maxIdx, rms };
}

function analyzeFile(filePath) {
  const data = fs.readFileSync(filePath);
  const result = wav.decode(data);
  // Use first channel only
  const channel = result.channelData[0];
  const { peak, peakIdx, rms } = analyzeBuffer(channel);
  const duration = channel.length / result.sampleRate;
  const peakTime = peakIdx / result.sampleRate;
  // Recommend volume to normalize peak to TARGET_PEAK
  const recommendedVolume = Math.min(1, TARGET_PEAK / peak);
  return { peakTime: +peakTime.toFixed(3), recommendedVolume: +recommendedVolume.toFixed(2), duration: +duration.toFixed(3) };
}

function main() {
  const files = getWavFiles(SWISHES_DIR);
  const config = {};
  files.forEach(f => {
    const info = analyzeFile(path.join(SWISHES_DIR, f));
    config[f] = info;
  });
  console.log('// Copy this object to your React app\nconst swishConfig = ' + JSON.stringify(config, null, 2) + ';');
}

main(); 