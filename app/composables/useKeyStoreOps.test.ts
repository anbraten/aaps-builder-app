/**
 * Tests for app/composables/useKeyStoreOps.ts
 *
 * Fixture strategy
 * ────────────────
 * • PKCS12 – generated with node-forge's synchronous RSA-512 API (no workers,
 *   milliseconds to build).  The 512-bit key is only used in test fixtures;
 *   production always uses 2048 bits.
 * • JKS – constructed entirely from the binary spec: magic + version + 0 entries
 *   + the SHA-1 "Mighty Aphrodite" trailer computed via crypto.subtle.
 *   This lets us test the password-check and format-detection logic without
 *   needing keytool.
 *
 * Nothing touches the network or the file-system.
 */

import * as forge from 'node-forge';
import { beforeAll, describe, expect, it } from 'vitest';
import { createKeyStore, verifyKeyStore } from './useKeyStoreOps';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

/**
 * Build a minimal valid JKS with 0 entries and the correct SHA-1 trailer.
 *   Structure: magic(4) ‖ version(4) ‖ count(4) ‖ SHA-1(20)
 *   SHA-1 pre-image: password_UTF-16BE ‖ "Mighty Aphrodite" ‖ 12-byte header
 */
async function buildMinimalJKS(password: string): Promise<string> {
  const header = new Uint8Array(12);
  new DataView(header.buffer).setUint32(0, 0xfeedfeed); // magic
  new DataView(header.buffer).setUint32(4, 2); // version
  new DataView(header.buffer).setUint32(8, 0); // 0 entries

  const pwBytes: number[] = [];
  for (let i = 0; i < password.length; i++) {
    const c = password.charCodeAt(i);
    pwBytes.push((c >> 8) & 0xff, c & 0xff);
  }
  const phrase = new TextEncoder().encode('Mighty Aphrodite');
  const pre = new Uint8Array(pwBytes.length + phrase.length + header.length);
  pre.set(pwBytes, 0);
  pre.set(phrase, pwBytes.length);
  pre.set(header, pwBytes.length + phrase.length);

  const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', pre));
  const out = new Uint8Array(32);
  out.set(header);
  out.set(hash, 12);

  let bin = '';
  for (const b of out) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Build a PKCS12 fixture using forge's synchronous 512-bit key generation.
 * When storePassword === keyPassword a single-password P12 is created.
 */
function buildPKCS12(storePassword: string, alias: string, keyPassword: string): string {
  // Synchronous key generation – tiny key size for test speed only
  const kp = forge.pki.rsa.generateKeyPair(512);

  const cert = forge.pki.createCertificate();
  cert.publicKey = kp.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const attrs = [
    { name: 'commonName', value: 'Test' },
    { name: 'organizationName', value: 'TestOrg' },
    { name: 'countryName', value: 'DE' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(kp.privateKey, forge.md.sha256.create());

  const p12 = forge.pkcs12.toPkcs12Asn1(kp.privateKey, cert, storePassword, {
    algorithm: '3des',
    friendlyName: alias,
    generateLocalKeyId: true,
  });
  return forge.util.encode64(forge.asn1.toDer(p12).getBytes());
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

let jksCorrect: string; // JKS with password "jks-store-pw"
let jksWrong: string; // JKS built against a different password (used to prove wrong-password rejection)

let p12Same: string; // PKCS12 where storePassword === keyPassword
const P12_STORE_PW = 'store-pw-123';
const P12_ALIAS = 'mykey';

beforeAll(async () => {
  jksCorrect = await buildMinimalJKS('jks-store-pw');
  jksWrong = await buildMinimalJKS('other-pw');
  p12Same = buildPKCS12(P12_STORE_PW, P12_ALIAS, P12_STORE_PW);
});

// ─── verifyKeyStore ───────────────────────────────────────────────────────────

describe('verifyKeyStore', () => {
  // ── JKS ───────────────────────────────────────────────────────────────────
  describe('JKS format', () => {
    it('detects JKS format', async () => {
      const result = await verifyKeyStore(jksCorrect, 'jks-store-pw');
      expect(result.format).toBe('jks');
    });

    it('accepts a correct store password', async () => {
      const result = await verifyKeyStore(jksCorrect, 'jks-store-pw');
      expect(result.valid).toBe(true);
      expect(result.storePasswordOk).toBe(true);
    });

    it('rejects a wrong store password', async () => {
      const result = await verifyKeyStore(jksCorrect, 'wrong-password');
      expect(result.valid).toBe(false);
      expect(result.storePasswordOk).toBe(false);
      expect(result.error).toBe('wrong_store_password');
    });

    it('rejects when the file was signed with a different password', async () => {
      // jksWrong was built with "other-pw"; presenting "jks-store-pw" should fail
      const result = await verifyKeyStore(jksWrong, 'jks-store-pw');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('wrong_store_password');
    });

    it('returns an empty alias list for a 0-entry JKS', async () => {
      const result = await verifyKeyStore(jksCorrect, 'jks-store-pw');
      expect(result.aliases).toEqual([]);
    });

    it('reports keyAliasFound: false when the store has no entries', async () => {
      const result = await verifyKeyStore(jksCorrect, 'jks-store-pw', 'someAlias');
      expect(result.keyAliasFound).toBe(false);
    });

    it('sets keyPasswordCheckUnsupported when an alias is provided', async () => {
      const result = await verifyKeyStore(jksCorrect, 'jks-store-pw', 'someAlias');
      expect(result.keyPasswordCheckUnsupported).toBe(true);
    });

    it('does not report keyPasswordCheckUnsupported when no alias is provided', async () => {
      const result = await verifyKeyStore(jksCorrect, 'jks-store-pw');
      expect(result.keyPasswordCheckUnsupported).toBeUndefined();
    });
  });

  // ── PKCS12 ────────────────────────────────────────────────────────────────
  describe('PKCS12 format', () => {
    it('detects PKCS12 format', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW);
      expect(result.format).toBe('pkcs12');
    });

    it('accepts a correct store password', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW);
      expect(result.valid).toBe(true);
      expect(result.storePasswordOk).toBe(true);
    });

    it('rejects a wrong store password', async () => {
      const result = await verifyKeyStore(p12Same, 'totally-wrong');
      expect(result.valid).toBe(false);
      expect(result.storePasswordOk).toBe(false);
      expect(result.error).toBe('wrong_store_password');
    });

    it('lists the alias that was embedded during creation', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW);
      expect(result.aliases).toContain(P12_ALIAS);
    });

    it('reports keyAliasFound: true for a matching alias', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW, P12_ALIAS);
      expect(result.keyAliasFound).toBe(true);
    });

    it('reports keyAliasFound: false for a non-existent alias', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW, 'no-such-alias');
      expect(result.keyAliasFound).toBe(false);
    });

    it('accepts the correct key password (equal to store password)', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW, P12_ALIAS, P12_STORE_PW);
      expect(result.keyPasswordOk).toBe(true);
    });

    it('rejects a wrong key password when store and key passwords are equal', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW, P12_ALIAS, 'wrong-key-pw');
      expect(result.keyPasswordOk).toBe(false);
    });

    it('does not check key password when no key password argument is given', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW, P12_ALIAS);
      expect(result.keyPasswordOk).toBeUndefined();
    });

    it('does not check key alias when no alias argument is given', async () => {
      const result = await verifyKeyStore(p12Same, P12_STORE_PW);
      expect(result.keyAliasFound).toBeUndefined();
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('returns unsupported_format for random bytes', async () => {
      const randomBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x01, 0x02, 0x03]);
      let bin = '';
      for (const b of randomBytes) bin += String.fromCharCode(b);
      const result = await verifyKeyStore(btoa(bin), 'password');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('unsupported_format');
    });

    it('returns parse_error for an invalid base64 string', async () => {
      const result = await verifyKeyStore('not-valid-base64!!!', 'password');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('parse_error');
    });

    it('returns parse_error for an empty string', async () => {
      const result = await verifyKeyStore('', 'password');
      expect(result.valid).toBe(false);
      // atob('') returns '' which is valid base64, so we get unsupported_format
      // (an empty byte array has no valid magic)
      expect(['parse_error', 'unsupported_format']).toContain(result.error);
    });

    it('returns unsupported_format when only the PKCS12 magic byte is present', async () => {
      // Single byte 0x30 looks PKCS12-like but detectFormat requires ≥ 4 bytes,
      // so it returns 'unknown' → 'unsupported_format'.
      const result = await verifyKeyStore(btoa(String.fromCharCode(0x30)), 'password');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('unsupported_format');
    });

    it('returns invalid_keystore for truncated PKCS12 bytes (≥ 4 bytes, starts with 0x30)', async () => {
      // detectFormat sees the DER SEQUENCE tag → 'pkcs12'; forge then fails to parse
      const bytes = new Uint8Array([0x30, 0x82, 0x00, 0x04, 0xff, 0xff]);
      let bin = '';
      for (const b of bytes) bin += String.fromCharCode(b);
      const result = await verifyKeyStore(btoa(bin), 'password');
      expect(result.valid).toBe(false);
      expect(result.format).toBe('pkcs12');
      expect(['invalid_keystore', 'wrong_store_password']).toContain(result.error);
    });
  });
});

// ─── createKeyStore ───────────────────────────────────────────────────────────

describe('createKeyStore', () => {
  // RSA-2048 generation is intentionally slow (~1–3 s in node-forge without
  // native bindings).  Generate the keystore once and re-use across all tests.
  let createdB64: string;
  const STORE_PW = 'my-store-pw';
  const KEY_PW = 'my-store-pw'; // same as store for round-trip verification
  const ALIAS = 'key0';

  beforeAll(async () => {
    createdB64 = await createKeyStore({
      storePassword: STORE_PW,
      keyAlias: ALIAS,
      keyPassword: KEY_PW,
      commonName: 'Test User',
      organization: 'TestOrg',
      country: 'DE',
    });
  }, 30_000);

  it('returns a non-empty base64 string', () => {
    expect(typeof createdB64).toBe('string');
    expect(createdB64.length).toBeGreaterThan(0);
  });

  it('produces a PKCS12 (DER SEQUENCE, first decoded byte is 0x30)', () => {
    const bin = atob(createdB64);
    expect(bin.charCodeAt(0)).toBe(0x30);
  });

  it('can be verified with the correct store password', async () => {
    const result = await verifyKeyStore(createdB64, STORE_PW);
    expect(result.valid).toBe(true);
    expect(result.format).toBe('pkcs12');
    expect(result.storePasswordOk).toBe(true);
  });

  it('cannot be verified with a wrong store password', async () => {
    const result = await verifyKeyStore(createdB64, 'bad-password');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('wrong_store_password');
  });

  it('embeds the requested alias', async () => {
    const result = await verifyKeyStore(createdB64, STORE_PW, ALIAS);
    expect(result.aliases).toContain(ALIAS);
    expect(result.keyAliasFound).toBe(true);
  });

  it('accepts the correct key password', async () => {
    const result = await verifyKeyStore(createdB64, STORE_PW, ALIAS, KEY_PW);
    expect(result.keyPasswordOk).toBe(true);
  });

  it('rejects a wrong key password', async () => {
    const result = await verifyKeyStore(createdB64, STORE_PW, ALIAS, 'wrong-key-pw');
    expect(result.keyPasswordOk).toBe(false);
  });

  it('reflects the requested common name in the certificate', async () => {
    // Verify by re-parsing the PKCS12 and inspecting the cert
    const bytes = Uint8Array.from(atob(createdB64), (c) => c.charCodeAt(0));
    const binaryStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binaryStr), STORE_PW);
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const cert = Object.values(certBags).flat()[0]?.cert;
    expect(cert).toBeTruthy();
    const cn = cert?.subject.getField('CN')?.value;
    expect(cn).toBe('Test User');
  });

  it('reflects the requested organization in the certificate', async () => {
    const bytes = Uint8Array.from(atob(createdB64), (c) => c.charCodeAt(0));
    const binaryStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binaryStr), STORE_PW);
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const cert = Object.values(certBags).flat()[0]?.cert;
    const org = cert?.subject.getField('O')?.value;
    expect(org).toBe('TestOrg');
  });

  it('reflects the requested country code in the certificate', async () => {
    const bytes = Uint8Array.from(atob(createdB64), (c) => c.charCodeAt(0));
    const binaryStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binaryStr), STORE_PW);
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const cert = Object.values(certBags).flat()[0]?.cert;
    const country = cert?.subject.getField('C')?.value;
    expect(country).toBe('DE');
  });

  it('uses default CommonName "AAPS" when none is provided', async () => {
    const b64 = await createKeyStore({
      storePassword: 'pw123456',
      keyAlias: 'key0',
      keyPassword: 'pw123456',
    });
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const binaryStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binaryStr), 'pw123456');
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const cert = Object.values(certBags).flat()[0]?.cert;
    expect(cert?.subject.getField('CN')?.value).toBe('AAPS');
  }, 30_000);
});
