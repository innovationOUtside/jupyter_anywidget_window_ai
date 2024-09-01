export function generateUUID() {
  // Generate a UUIDv4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function add_html(el, html, _headless = false) {
  let el2 = document.createElement("div");
  el2.innerHTML = html;
  const uuid = generateUUID();
  el2.id = uuid;
  // For the headless version,
  // just suppress the visible display of the widget UI
  if (_headless) {
    el2.style = "display: none; visibility: hidden;";
  }
  el.appendChild(el2);
}

// Generate a tone using the AudioContext object.
export function playTone(
  tone = true,
  message = null, // optional message
  // Tone paramters;
  frequency = 440, // default frequency in Hz
  durationMs = 1000, // default duration in milliseconds
  volume = 0.1, // default volume level
  type = "sine", // default wave type

) {
  if (tone) {
    // Create a new AudioContext
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Create an OscillatorNode
    const oscillator = audioContext.createOscillator();

    // Create a GainNode
    const gain = audioContext.createGain();

    // Set the volume
    gain.gain.value = volume;

    // Set the type of the oscillator
    oscillator.type = type;

    // Set the frequency of the oscillator
    oscillator.frequency.value = frequency;

    // Connect the oscillator to the gain node
    oscillator.connect(gain);

    // Connect the gain node to the audio context's destination (the speakers)
    gain.connect(audioContext.destination);

    // Start the oscillator immediately
    oscillator.start();

    // Set the gain envelope
    gain.gain.exponentialRampToValueAtTime(
      0.00001, // very low value to fade out
      audioContext.currentTime + durationMs / 1000 // duration in seconds
    );

    // Stop the oscillator after the specified duration
    setTimeout(() => {
      oscillator.stop();
      if (message) {
        setTimeout(() => {
          // Replace this function with your own implementation to handle the message
          say(message);
        }, 100);
      }
    }, durationMs);
  } else if (message) say(message)
}

export const say = (message) => {
  if (message) {
    let utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
  }
};
