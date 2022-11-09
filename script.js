// https://www.voicerss.org/sdk/javascript.aspx

function test() {
  VoiceRSS.speech({
    key: "c8454a56e97d4a069865e070aa2b5aa4",
    src: "Hello, world!",
    hl: "en-us",
    v: "Linda",
    r: 0,
    c: "mp3",
    f: "44khz_16bit_stereo",
    ssml: false,
  });
}

test();
