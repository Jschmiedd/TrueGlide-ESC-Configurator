/**
 * Firmware integrity (TrueGlide, audit M1).
 *
 * The firmware files are not served with CORS headers by their publishers,
 * so the browser gets them through a proxy run by a third party. Nothing
 * proves that the file that reaches the ESC is the one that was published.
 *
 * The files validated on a real drone are listed below with their SHA-256,
 * computed on the file downloaded directly from its publisher. A listed file
 * is first fetched from the TrueGlide copy (same site as the program, no
 * proxy) and is flashed only when its SHA-256 matches. Files that are not
 * listed can still be flashed, with a warning in the log.
 */

const MIRROR = 'https://jschmiedd.github.io/TrueGlide-ESC-Configurator/firmwares/';

const VALIDATED = [
  {
    // Validated on KarRmen (SpeedyBee F405 Mini, BLS 35A J-H-40), test TGE-P1, 31/10/2026
    url: 'https://github.com/bird-sanctuary/bluejay/releases/download/v0.19.2/J_H_40_24_v0.19.2.hex',
    file: 'bluejay/v0.19.2/J_H_40_24_v0.19.2.hex',
    sha256: '0fbfc67814933fbac41c2430d235da73ed5e666b8df040eec596f4c0db0ff4c2',
  },
  {
    // Same firmware and ESC in 48 kHz, the frequency of the J-H-40 of Mini
    // Pouce (SpeedyBee F405 Mini), added after test M6, 10/11/2026.
    // SHA-256 of the file downloaded from the official release.
    url: 'https://github.com/bird-sanctuary/bluejay/releases/download/v0.19.2/J_H_40_48_v0.19.2.hex',
    file: 'bluejay/v0.19.2/J_H_40_48_v0.19.2.hex',
    sha256: '8731a3570f8f4f3122cbd06d18f44fc06bccb4d27af4885853d5410eb701ac07',
  },
];

function getValidated(url) {
  return VALIDATED.find((item) => item.url === url) || null;
}

function getMirrorUrl(url) {
  const entry = getValidated(url);

  return entry ? `${MIRROR}${entry.file}` : null;
}

async function sha256(text) {
  const subtle = (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) || null;
  if(!subtle) {
    return null;
  }

  const data = new TextEncoder().encode(text);
  const digest = await subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Status of a firmware file:
 * - 'valid': listed and its SHA-256 matches
 * - 'mismatch': listed but altered (or the hash cannot be computed): never flash
 * - 'unlisted': not validated by TrueGlide
 *
 * Without an URL (local file), the file is 'valid' when its content matches
 * one of the validated files.
 */
async function checkFirmware(url, text) {
  const hash = await sha256(text);

  if(url) {
    const entry = getValidated(url);
    if(!entry) {
      return 'unlisted';
    }

    return hash === entry.sha256 ? 'valid' : 'mismatch';
  }

  if(hash && VALIDATED.some((item) => item.sha256 === hash)) {
    return 'valid';
  }

  return 'unlisted';
}

export {
  checkFirmware,
  getMirrorUrl,
  getValidated,
  sha256,
  VALIDATED,
};
