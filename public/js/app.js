window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var Codec = {
  speex: new Speex({quality: 9}),

  encode: function(buffer) {
    var datalen = buffer.length;
    var shorts = new Int16Array(datalen);
    for (var i = 0; i < datalen; i++) {
      shorts[i] = Math.floor(Math.min(1.0, Math.max(-1.0, buffer[i])) * 32767);
    }
    var encoded = Codec.speex.encode(shorts, true);
    return encoded[0];
  },

  decode: function(encoded) {
    return Codec.speex.decode(encoded);
  }
};

var ws = new WebSocket('ws://' + window.location.hostname + ':4000');

var context = new AudioContext();
var bufferSize = 16384;

var reader = new FileReader();
reader.onload = function () {
  var buf = new Uint8Array(this.result);
  var decoded = Codec.decode(buf);
  var offset = decoded.length - bufferSize;

  var audio = new Float32Array(bufferSize);
  for (var i = 0; i < bufferSize; i++) {
    audio[i] = decoded[i + offset];
  }

  window.playNode = context.createBufferSource();
  var playBuffer = context.createBuffer(1, audio.length, context.sampleRate);
  playBuffer.getChannelData(0).set(audio);

  playNode.buffer = playBuffer;

  playNode.connect(context.destination);
  playNode.start(0);
};

ws.onmessage = function (msg) {
  reader.readAsArrayBuffer(msg.data);
};

navigator.getUserMedia({audio: true}, function (stream) {
  window.micNode = context.createMediaStreamSource(stream);
  var recNode = context.createScriptProcessor(bufferSize, 1, 1);

  micNode.connect(recNode);

  recNode.onaudioprocess = function (e) {
    var data = e.inputBuffer.getChannelData(0);
    var msg = Codec.encode(data);
    ws.send(msg);
  };

  recNode.connect(context.destination);
}, function () {});