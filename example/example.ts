import MultiChannelPlayer from "../dist";

const player = new MultiChannelPlayer(2);

player.loadSamples({
  jump: "/clips/jump.mp3",
  land: "/clips/land.mp3"
});
