/* eslint-env es6 */
// some helper functions, in the style of less

function hslTriple2hexString(h, s, l) {
  const h6 = h * 6;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(h6 % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h6 < 1) {
    [r, g, b] = [c, x, 0];
  } else if (h6 < 2) {
    [r, g, b] = [x, c, 0];
  } else if (h6 < 3) {
    [r, g, b] = [0, c, x];
  } else if (h6 < 4) {
    [r, g, b] = [0, x, c];
  } else if (h6 < 5) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  const rgb = [r, g, b].map(c => Math.round((c + m) * 255));
  return `#${rgb.map(c => c.toString(16)).map((s) => {
    return (s.length === 1) ? '0' + s : s;
  }).join('')}`;
}

function hexString2rgbTriple(string) {
  if (string.length === 4 || string.length === 7) {
    string = string.slice(1);
  }
  let stringTriple;
  if (string.length === 3) {
    stringTriple = string.split('').map( c => c + c );
  } else if (string.length === 6) {
    stringTriple = [string.slice(0, 2),
                    string.slice(2, 4),
                    string.slice(4, 6)];
  } else {
    throw new Error('malformed input rgb string');
  }
  return stringTriple.map( c => parseInt(c, 16) / 255 );
}

function rgbTriple2hslTriple([r, g, b]) {
  const max = (r > g && r > b) ? r : ((g > b) ? g : b);
  const min = (r < g && r < b) ? r : ((g < b) ? g : b);
  const l = (max + min) / 2;
  const deltaMax = max - min;
  if (deltaMax === 0) return [0, 0, 1]; // achromatic
  const s = (l < 0.5) ? (deltaMax / (max + min)) : deltaMax / (2 - max - min);
  let h;
  switch(max) {
      case r: h = (g - b) / deltaMax + (g < b ? 6 : 0); break;
      case g: h = (b - r) / deltaMax + 2; break;
      case b: h = (r - g) / deltaMax + 4; break;
  }
  h /= 6;
  return [h, s, l];
}

export function lighten(rgbHexString, percent) {
  const [h, s, l] = rgbTriple2hslTriple(hexString2rgbTriple(rgbHexString));
  let lightened = l + percent / 100;
  lightened = (lightened > 1.0) ? 1.0 : lightened;
  return hslTriple2hexString(h, s, lightened);
}

export function darken(rgbHexString, percent) {
  const [h, s, l] = rgbTriple2hslTriple(hexString2rgbTriple(rgbHexString));
  let darkened = l - percent / 100;
  darkened = (darkened < 0) ? 0 : darkened;
  return hslTriple2hexString(h, s, darkened);
}
