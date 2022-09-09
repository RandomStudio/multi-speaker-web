import MultiChannelPlayer from "../dist";

console.log("Loaded!");

const NUM_CHANNELS = 2;

export const player = new MultiChannelPlayer(NUM_CHANNELS);

player.loadSamples({
  jump: "/jump.mp3",
  land: "/land.mp3",
  ambience: "/ambience.mp3"
});

console.log({ sampleKeys: player.getSampleKeys() });

for (let channel = 0; channel < NUM_CHANNELS; channel++) {
  // Hits
  const hitRoot = document.getElementById("hits");
  player.getSampleKeys().forEach(s => {
    const b = document.createElement("button");
    b.innerText = `CH# ${channel}: Hit ${s}`;
    b.onclick = _ev => {
      console.log("play on channel", channel);
      player.play(s, channel);
    };
    hitRoot.appendChild(b);
  });

  // Loops (now)
  const loopsNowRoot = document.getElementById("loops-now");
  player.getSampleKeys().forEach(s => {
    const b = document.createElement("button");
    b.innerText = `CH# ${channel}: Loop ${s} (now)`;
    b.onclick = _ev => {
      player.play(s, channel, { loop: true });
    };
    loopsNowRoot.appendChild(b);
  });

  // Loops (now)
  const loopsFadeRoot = document.getElementById("loops-fade");
  player.getSampleKeys().forEach(s => {
    const b = document.createElement("button");
    b.innerText = `CH# ${channel}: Loop ${s} (fade)`;
    b.onclick = _ev => {
      player.play(s, channel, { loop: true, fadeInDuration: 3000 });
    };
    loopsFadeRoot.appendChild(b);
  });
}

// Stop (now)
const stopNowRoot = document.getElementById("stop-now");
player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Stop ${s} (now)`;
  b.onclick = _ev => {
    player.stop(s);
  };
  stopNowRoot.appendChild(b);
});

// Stop (now)
const stopFadeRoot = document.getElementById("stop-fade");
player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Stop ${s} (fade)`;
  b.onclick = _ev => {
    player.stop(s, 2000);
  };
  stopFadeRoot.appendChild(b);
});
