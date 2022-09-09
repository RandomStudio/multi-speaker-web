import MultiChannelPlayer from "../dist";

console.log("Loaded!");

export const player = new MultiChannelPlayer(2);

player.loadSamples({
  jump: "/jump.mp3",
  land: "/land.mp3",
  ambience: "/ambience.mp3"
});

console.log({ sampleKeys: player.getSampleKeys() });

const buttonRoot = document.getElementById("buttons");

// Hits
player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Hit ${s}`;
  b.onclick = ev => {
    player.play(s, 0);
  };
  buttonRoot.appendChild(b);
});

// // Loops
// player.getSampleKeys().forEach(s => {
//   const b = document.createElement("button");
//   b.innerText = `Loop ${s}`;
//   b.onclick = ev => {
//     player.play(s, 0, { loop: true });
//   };
//   buttonRoot.appendChild(b);
// });

// // Stop
// player.getSampleKeys().forEach(s => {
//   const b = document.createElement("button");
//   b.innerText = `Stop ${s} (1000ms fade)`;
//   b.onclick = ev => {
//     player.stop(s, 1000);
//   };
//   buttonRoot.appendChild(b);
// });
