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
player.getSampleKeys().forEach(s => {
  const b = document.createElement("button");
  b.innerText = `Play ${s}`;
  b.onclick = ev => {
    console.log("clicked; play", s);
    player.play(s);
  };
  buttonRoot.appendChild(b);
});
