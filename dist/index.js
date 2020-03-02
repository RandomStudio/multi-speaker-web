"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class MultiChannelPlayer {
    constructor(numSpeakers) {
        this.loadSamples = (sources) => __awaiter(this, void 0, void 0, function* () {
            this.samples = createBufferedSamples(sources, this.audioCtx, this.numSpeakers);
            const requests = Object.keys(this.samples).map((key) => __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    const sample = this.samples[key];
                    console.log("load sample for", sample.src);
                    if (sample) {
                        const request = new XMLHttpRequest();
                        request.onload = () => {
                            // console.log("got file");
                            const audioData = request.response;
                            // console.log("response", request.response);
                            this.audioCtx.decodeAudioData(audioData, buffer => {
                                // console.log(`got audio buffer for sample "${key}"`);
                                sample.bufferData = buffer;
                                resolve();
                            });
                        };
                        request.onerror = err => {
                            reject(err);
                        };
                        request.open("GET", sample.src);
                        request.responseType = "arraybuffer";
                        request.send();
                        console.log(request);
                    }
                });
            }));
            yield Promise.all(requests)
                .then(() => {
                console.info("all samples loaded: ", Object.keys(this.samples));
            })
                .catch(err => {
                console.error("error loading samples:", err);
            });
        });
        this.play = (keySearch, channel, options) => {
            if (Array.isArray(keySearch)) {
                const pick = Math.floor(Math.random() * keySearch.length);
                this.playSample(keySearch[pick], channel, applyDefaults(options));
            }
            else {
                this.playSample(keySearch, channel, applyDefaults(options));
            }
        };
        this.getSampleKeys = () => Object.keys(this.samples);
        this.playSample = (key, channel, options) => {
            const sample = this.samples[key];
            if (sample === undefined) {
                throw Error(`could not find sample with key "${key}" in sample bank ${Object.keys(this.samples)}`);
            }
            // console.log(`found sample "${key}", play on channel #${channel}`);
            if (sample.bufferData === null) {
                throw Error(`buffer not (yet?) loaded on call to play "${key}"`);
            }
            if (options.exclusive && sample.isPlaying) {
                console.warn(`exclusive mode; clip "${key}" already playing`);
            }
            else {
                sample.bufferSourceNode = this.audioCtx.createBufferSource();
                sample.bufferSourceNode.buffer = sample.bufferData;
                connectBuffer(sample, this.audioCtx);
                const volume = remap(1 - Math.random() * options.volumeVariation, 0, 1.0, 0, options.volumeMax);
                const rate = 1 + Math.random() * options.rateVariation - options.rateVariation / 2;
                exclusiveSpeaker(this.audioCtx, sample.speakers, channel, volume);
                sample.bufferSourceNode.playbackRate.value = rate;
                sample.bufferSourceNode.loop = options.loop;
                sample.bufferSourceNode.start(0);
                sample.isPlaying = true;
                sample.bufferSourceNode.onended = () => {
                    sample.isPlaying = false;
                };
            }
        };
        this.getIsPlaying = (key) => {
            const sample = this.samples[key];
            if (sample === undefined) {
                throw Error(`could not find sample with key "${key}" in sample bank ${Object.keys(this.samples)}`);
            }
            return sample.isPlaying;
        };
        this.numSpeakers = numSpeakers;
        this.audioCtx = new window.AudioContext();
        this.audioCtx.destination.channelInterpretation = "discrete";
        const maxChannelCount = this.audioCtx.destination.maxChannelCount;
        this.numSpeakers =
            this.audioCtx.destination.maxChannelCount > 2 ? numSpeakers : 2;
        this.audioCtx.destination.channelCount = maxChannelCount;
        console.log("requested", numSpeakers, "speakers; got", this.audioCtx.destination.channelCount, "channels for output");
        this.samples = {};
    }
} // end class
exports.default = MultiChannelPlayer;
const createBufferedSamples = (sources, ctx, numSpeakers) => Object.keys(sources).reduce((result, key) => (Object.assign(Object.assign({}, result), { [key]: {
        src: sources[key],
        bufferSourceNode: ctx.createBufferSource(),
        bufferData: null,
        speakers: getGainNodes(numSpeakers, ctx),
        mix: ctx.createChannelMerger(numSpeakers),
        isPlaying: false
    } })), {});
const getGainNodes = (numSpeakers, ctx) => {
    const g = [];
    for (let i = 0; i < numSpeakers; i++) {
        const node = ctx.createGain();
        node.channelCountMode = "explicit";
        node.channelCount = 1;
        node.channelInterpretation = "discrete";
        g.push(node);
    }
    return g;
};
const connectBuffer = (sample, ctx) => {
    sample.speakers.forEach((g, index) => {
        sample.bufferSourceNode.connect(g);
        g.connect(sample.mix, 0, index);
    });
    sample.mix.connect(ctx.destination);
};
const exclusiveSpeaker = (ctx, speakers, target, maxVolume = 1) => {
    speakers.forEach((s, index) => {
        if (index === target) {
            s.gain.setValueAtTime(maxVolume, ctx.currentTime);
        }
        else {
            s.gain.setValueAtTime(0, ctx.currentTime);
        }
    });
};
const remap = (value, inMin, inMax, outMin, outMax) => outMin + ((outMax - outMin) / (inMax - inMin)) * (value - inMin);
const applyDefaults = (original) => {
    const defaults = {
        loop: false,
        rateVariation: 0,
        volumeVariation: 0,
        volumeMax: 1,
        exclusive: false
    };
    if (original === undefined) {
        return defaults;
    }
    else {
        const result = original;
        Object.keys(original).forEach(key => {
            result[key] = original[key] === undefined ? defaults[key] : original[key];
        });
        return result;
    }
};
//# sourceMappingURL=index.js.map