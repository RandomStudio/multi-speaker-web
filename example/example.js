import MultiChannelPlayer from "../dist";

console.log("Loaded!");

export const player = new MultiChannelPlayer(2);

player.loadSamples({
  jump: "/jump.mp3",
  land: "/land.mp3",
  ambience: "/ambience.mp3"
});

console.log({ sampleKeys: player.getSampleKeys() });

// Hits
const hitRoot = document.getElementById("hits");
player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Hit ${s}`;
  b.onclick = ev => {
    player.play(s, 0);
  };
  hitRoot.appendChild(b);
});

// Loops
const loopRoot = document.getElementById("loops");

player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Loop ${s}`;
  b.onclick = ev => {
    player.play(s, 0, { loop: true });
  };
  loopRoot.appendChild(b);
});

// Stop (now)
const stopNowRoot = document.getElementById("stop-now");
player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Stop ${s} (now)`;
  b.onclick = ev => {
    player.stop(s);
  };
  stopNowRoot.appendChild(b);
});

// Stop (now)
const stopFadeRoot = document.getElementById("stop-fade");

player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Stop ${s} (fade)`;
  b.onclick = ev => {
    player.stop(s, 2000);
  };
  stopFadeRoot.appendChild(b);
});
