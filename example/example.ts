import BufferedSample from "../src/BufferedSample";
import MultiChannelPlayer from "../src/MultiChannelPlayer";

console.log("Loaded!");

const NUM_CHANNELS = 2;

export const player = MultiChannelPlayer.setup(2);

interface SampleMap {
  [key: string]: null | BufferedSample;
}

const samples: SampleMap = {
  jump: null,
  land: null,
  ambience: null
  // jump: player.createSample("/jump.mp3"),
  // land: player.createSample("/land.mp3"),
  // ambience: player.createSample("/ambience.mp3")
};

player.loadSample("/jump.mp3").then(s => {
  samples.jump = s;
});
player.loadSample("/land.mp3").then(s => {
  samples.land = s;
});
player.loadSample("/ambience.mp3").then(s => {
  samples.ambience = s;
});

for (let channel = 0; channel < NUM_CHANNELS; channel++) {
  // Hits
  const hitRoot = document.getElementById("hits");
  Object.keys(samples).forEach(key => {
    const b = document.createElement("button");
    b.innerText = `CH# ${channel}: Hit ${key}`;
    b.onclick = _ev => {
      console.log("play on channel", channel);
      samples[key]?.playOnChannel(channel);
    };
    hitRoot?.appendChild(b);
  });

  // Loops (now)
  const loopsNowRoot = document.getElementById("loops-now");
  Object.keys(samples).forEach(key => {
    const b = document.createElement("button");
    b.innerText = `CH# ${channel}: Loop ${key} (now)`;
    b.onclick = _ev => {
      // player.play(key, channel, { loop: true });
      samples[key]?.playOnChannel(channel, { loop: true });
    };
    loopsNowRoot?.appendChild(b);
  });

  // Loops (fade in)
  const loopsFadeRoot = document.getElementById("loops-fade");
  Object.keys(samples).forEach(key => {
    const b = document.createElement("button");
    b.innerText = `CH# ${channel}: Loop ${key} (fade)`;
    b.onclick = _ev => {
      // player.play(s, channel, { loop: true, fadeInDuration: 3000 });
      samples[key]?.playOnChannel(channel, {
        loop: true,
        fadeInDuration: 3000
      });
    };
    loopsFadeRoot?.appendChild(b);
  });
}

// Stop (now)
const stopNowRoot = document.getElementById("stop-now");
Object.keys(samples).forEach(key => {
  const b = document.createElement("button");
  b.innerText = `Stop ${key} (now)`;
  b.onclick = _ev => {
    // player.stop(key);
    samples[key]?.stop();
  };
  stopNowRoot?.appendChild(b);
});

// Stop (fade out)
const stopFadeRoot = document.getElementById("stop-fade");
Object.keys(samples).forEach(key => {
  const b = document.createElement("button");
  b.innerText = `Stop ${key} (fade)`;
  b.onclick = _ev => {
    // player.stop(key, 2000);
    samples[key]?.stop({ fadeOutDuration: 2000 });
  };
  stopFadeRoot?.appendChild(b);
});

// Clip states
const stateRoot = document.getElementById("clip-states");
Object.keys(samples).forEach(key => {
  const info = document.createElement("div");
  setInterval(() => {
    const sample = samples[key];
    if (sample) {
      const playing = sample.getIsPlaying();
      const progress = sample.getProgressNormalised();
      info.innerText = `${key}: ${
        playing ? "PLAYING" : "STOPPED"
      } :: progress = ${progress.toFixed(
        2
      )} ; volume = ${sample.getVolume().toFixed(2)}`;
    }
  }, 100);
  stateRoot?.appendChild(info);
});
