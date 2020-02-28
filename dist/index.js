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
                            console.log("response", request.response);
                            this.audioCtx.decodeAudioData(audioData, buffer => {
                                // logger.debug("got audio buffer");
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
                console.log("all samples loaded");
            })
                .catch(err => {
                console.error("error loading samples:", err);
            });
        });
        this.play = (key, channel) => {
            const sample = this.samples[key];
            if (sample) {
                console.log("found sample with key", key);
                sample.bufferSourceNode = this.audioCtx.createBufferSource();
                sample.bufferSourceNode.buffer = sample.bufferData;
                connectBuffer(sample, this.audioCtx);
                sample.bufferSourceNode.start(0);
                sample.isPlaying = true;
                sample.bufferSourceNode.onended = () => {
                    sample.isPlaying = false;
                };
            }
            else {
                console.error("could not find sample with key", key, "in sample bank: ", Object.keys(this.samples));
            }
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
//# sourceMappingURL=index.js.map