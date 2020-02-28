import MultiChannelPlayer from "../dist";
import "./clips/jump.mp3";
import "./clips/land.mp3";

const player = new MultiChannelPlayer(2);

player.loadSamples({
  jump: "/clips/jump.mp3",
  land: "/clips/land.mp3"
});
