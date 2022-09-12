# Multi Channel Web Audio

Provides a convenient system for the browser-based Web Audio API, for routing sounds to specific speakers in a multi-channel environment. It works for 2 speakers (stereo) but becomes much more useful for environments with more channels.

The idea is to facilitate mono audio sources in multi-channel setups without having to pre/re mix anything for standard "surround sound" systems.

## Setup

Install

```
npm i multi-channel-web-audio
```

Import the player, specifying the number of channels you intend to output to:

```
import MultiChannelPlayer from "multi-channel-web-audio";
const player = MultiChannelPlayer.setup(4);
```

Load a sample so it's ready for playback and control (async):

```
const mySample = await player.loadSample("/someSampleURL.mp3");
```

### Play samples on specific channel

Call `.playOnChannel()` for any sample already loaded, e.g:

```
mysample.playOnChannel(2); // plays out of speaker index 2 (third speaker) ONLY
```

### Optional playback configuration

You can pass a third parameter to any of the `play` functions if you like: a `PlaybackOptions` object, specifying any or all of the following:

- `loop` boolean (default: `false`) - whether to loop the sample or play just once through
- `rate`: number (default `1.0`) - playback speed multiplier (affects pitch)
- `volume`: number (default `1.0`) - target "full" volume, from 0 (silence) to full volume (1.0)
- `fadeInDuration`: number (default `0`) - how long (in ms) to fade in; only applies for play/start operations
- `fadeOutDuration`: number (default `0`) - how long (in ms) to fade out; only applies for stop operations

## Example

You can run a small browser demo to test again, with `npm run example`

This example uses just 2 channels, to suit most test environments. Two channels obviously doesn't demonstrate the full potential of this library but does show you how to use it.

## Development

The library is written in TypeScript so compiles with `npm run build`

## TODO

- [x] Remove all random picking, random variations (outside the scope of this library; should be handled by client library/application)
- [x] Revisit "applyDefaults" mechanism / types
- [x] Create a class for Sample (BufferedSample) which keeps track of its own state
- [ ] Check that progress/duration is accurate when rate is not 1.0
- [ ] It should be possible to play sample multiple times simultaneously (currently, "exclusive" mode prevents strange issues)
- [ ] Should be possible to play sample via multiple channels (same volume)
- [ ] Should be possible to play sample with custom "panning" between multiple channels (pseudo-spatialised audio)
