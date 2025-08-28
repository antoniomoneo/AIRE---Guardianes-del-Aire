import lamejs from 'lamejs';

export function exportToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i = 0;
    let sample = 0;
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit audio
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++; // next source sample
    }

    return new Blob([view], { type: 'audio/wav' });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

// Encodes an AudioBuffer into an MP3 file blob.
export async function exportToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
    const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);
    const samplesLeft = audioBuffer.getChannelData(0);
    const samplesRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : samplesLeft;
    
    const sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier
    const mp3Data: Int8Array[] = [];

    for (let i = 0; i < samplesLeft.length; i += sampleBlockSize) {
        const leftChunk = convertTo16Bit(samplesLeft.subarray(i, i + sampleBlockSize));
        const rightChunk = convertTo16Bit(samplesRight.subarray(i, i + sampleBlockSize));
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }
    
    return new Blob(mp3Data, { type: 'audio/mpeg' });
}

function convertTo16Bit(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const val = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
    }
    return int16Array;
}
