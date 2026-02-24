/**
 * Client-side KeyStore operations.
 *
 * - JKS  : password verified via the SHA-1 "Mighty Aphrodite" HMAC appended at
 *           the end of every JKS file.  Alias names are extracted by walking the
 *           binary entry list.  Key-password verification is NOT possible without
 *           re-implementing Oracle's proprietary Sun key-protection algorithm.
 *
 * - PKCS12: verified and created with node-forge (pure JS, browser-safe).
 *           Both store-password (MAC check) and key-password (bag decryption)
 *           can be verified.
 *
 * Nothing is sent to a server.
 */
import * as forge from 'node-forge';

// ─── Public types ─────────────────────────────────────────────────────────────

export type KeyStoreFormat = 'jks' | 'pkcs12' | 'unknown';

export interface VerifyResult {
  valid: boolean;
  format: KeyStoreFormat;
  aliases: string[];
  storePasswordOk?: boolean;
  keyAliasFound?: boolean;
  /** Undefined = not checked */
  keyPasswordOk?: boolean;
  /** Key-password check is not possible for this format (JKS) */
  keyPasswordCheckUnsupported?: boolean;
  error?: 'wrong_store_password' | 'invalid_keystore' | 'unsupported_format' | 'parse_error';
}

export interface CreateOpts {
  storePassword: string;
  keyAlias: string;
  keyPassword: string;
  commonName?: string;
  organization?: string;
  country?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function r32(d: Uint8Array, o: number): number {
  return ((d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]) >>> 0;
}

function r16(d: Uint8Array, o: number): number {
  return (d[o] << 8) | d[o + 1];
}

/** Read a Java DataOutputStream.writeUTF string: 2-byte length + CESU-8 bytes */
function readJUTF(data: Uint8Array, o: number): { value: string; next: number } {
  const len = r16(data, o);
  const value = new TextDecoder('utf-8').decode(data.subarray(o + 2, o + 2 + len));
  return { value, next: o + 2 + len };
}

function detectFormat(bytes: Uint8Array): KeyStoreFormat {
  if (bytes.length < 4) return 'unknown';
  const magic = r32(bytes, 0);
  if (magic === 0xfeedfeed) return 'jks';
  if (bytes[0] === 0x30) return 'pkcs12'; // DER SEQUENCE
  return 'unknown';
}

// ─── JKS ──────────────────────────────────────────────────────────────────────

/** Verify JKS store password using the SHA-1 trailer appended to every JKS file.
 *  pre-image = password_UTF16BE || "Mighty Aphrodite" || all_bytes_except_last_20 */
async function jksCheckPassword(bytes: Uint8Array, password: string): Promise<boolean> {
  if (bytes.length < 24) return false;

  const payload = bytes.subarray(0, bytes.length - 20);
  const stored = bytes.subarray(bytes.length - 20);

  // Password as UTF-16BE byte sequence
  const pwBytes: number[] = [];
  for (let i = 0; i < password.length; i++) {
    const c = password.charCodeAt(i);
    pwBytes.push((c >> 8) & 0xff, c & 0xff);
  }
  const phrase = new TextEncoder().encode('Mighty Aphrodite');

  const pre = new Uint8Array(pwBytes.length + phrase.length + payload.length);
  pre.set(pwBytes, 0);
  pre.set(phrase, pwBytes.length);
  pre.set(payload, pwBytes.length + phrase.length);

  const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', pre));
  return hash.every((b, i) => b === stored[i]);
}

/** Walk the JKS binary structure and collect alias names. */
function jksAliases(bytes: Uint8Array): string[] {
  const count = r32(bytes, 8);
  const aliases: string[] = [];
  let o = 12;

  for (let i = 0; i < count && o < bytes.length - 20; i++) {
    const tag = r32(bytes, o);
    o += 4;

    const { value: alias, next: afterAlias } = readJUTF(bytes, o);
    aliases.push(alias);
    o = afterAlias + 8; // skip 8-byte timestamp

    if (tag === 1) {
      // private-key entry
      const ekLen = r32(bytes, o);
      o += 4 + ekLen;
      const chainLen = r32(bytes, o);
      o += 4;
      for (let j = 0; j < chainLen; j++) {
        const { next: afterType } = readJUTF(bytes, o);
        o = afterType;
        const certLen = r32(bytes, o);
        o += 4 + certLen;
      }
    } else if (tag === 2) {
      // trusted-cert entry
      const { next: afterType } = readJUTF(bytes, o);
      o = afterType;
      const certLen = r32(bytes, o);
      o += 4 + certLen;
    } else {
      break; // unknown tag – stop to avoid garbage reads
    }
  }

  return aliases;
}

// ─── PKCS12 ───────────────────────────────────────────────────────────────────

function pkcs12Verify(
  bytes: Uint8Array,
  storePassword: string,
  keyAlias?: string,
  keyPassword?: string,
): Omit<VerifyResult, 'format'> {
  try {
    // forge.util.createBuffer expects a binary string or ByteStringBuffer
    const binaryStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    const asn1 = forge.asn1.fromDer(binaryStr);

    // Throws on wrong store password (MAC verification failure)
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, storePassword);

    // Collect aliases from all bag types
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const aliasSet = new Set<string>();
    for (const bags of [...Object.values(certBags), ...Object.values(keyBags)]) {
      for (const bag of bags ?? []) {
        const fn = bag?.attributes?.friendlyName?.[0];
        if (fn) aliasSet.add(fn);
      }
    }

    const result: Omit<VerifyResult, 'format'> = {
      valid: true,
      storePasswordOk: true,
      aliases: [...aliasSet],
    };

    if (keyAlias !== undefined) {
      const keyBagList = Object.values(keyBags).flat();
      const matched = keyBagList.find((b) => b?.attributes?.friendlyName?.[0] === keyAlias);
      result.keyAliasFound = !!matched;

      if (matched && keyPassword !== undefined) {
        if (matched.key !== null) {
          // Already decrypted with storePassword — same password works
          result.keyPasswordOk = keyPassword === storePassword;
        } else {
          // Key bag uses a separate password; try to decrypt it
          try {
            const p12NoPw = forge.pkcs12.pkcs12FromAsn1(asn1, false);
            const rawBag = Object.values(p12NoPw.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag }))
              .flat()
              .find((b) => b?.attributes?.friendlyName?.[0] === keyAlias);

            if (rawBag?.asn1) {
              // rawBag.asn1 is an EncryptedPrivateKeyInfo ASN1 node when the bag
              // was not decrypted (different key password from store password)
              result.keyPasswordOk = forge.pki.decryptPrivateKeyInfo(rawBag.asn1, keyPassword) !== null;
            } else {
              result.keyPasswordOk = false;
            }
          } catch {
            result.keyPasswordOk = false;
          }
        }
      }
    }

    return result;
  } catch (e: any) {
    const msg = String(e?.message ?? e).toLowerCase();
    if (msg.includes('mac') || msg.includes('invalid password') || msg.includes('failed to decrypt')) {
      return { valid: false, storePasswordOk: false, aliases: [], error: 'wrong_store_password' };
    }
    return { valid: false, aliases: [], error: 'invalid_keystore' };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function verifyKeyStore(
  base64Content: string,
  storePassword: string,
  keyAlias?: string,
  keyPassword?: string,
): Promise<VerifyResult> {
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(base64Content);
  } catch {
    return { valid: false, format: 'unknown', aliases: [], error: 'parse_error' };
  }

  const format = detectFormat(bytes);

  if (format === 'jks') {
    let pwOk: boolean;
    try {
      pwOk = await jksCheckPassword(bytes, storePassword);
    } catch {
      return { valid: false, format: 'jks', aliases: [], error: 'invalid_keystore' };
    }

    if (!pwOk) {
      return { valid: false, format: 'jks', storePasswordOk: false, aliases: [], error: 'wrong_store_password' };
    }

    let aliases: string[] = [];
    try {
      aliases = jksAliases(bytes);
    } catch {
      // password check passed – still valid
    }

    const result: VerifyResult = { valid: true, format: 'jks', storePasswordOk: true, aliases };

    if (keyAlias !== undefined) {
      result.keyAliasFound = aliases.includes(keyAlias);
      // Oracle's Sun key-protection algorithm cannot be reproduced with WebCrypto.
      result.keyPasswordCheckUnsupported = true;
    }

    return result;
  }

  if (format === 'pkcs12') {
    return { ...pkcs12Verify(bytes, storePassword, keyAlias, keyPassword), format: 'pkcs12' };
  }

  return { valid: false, format: 'unknown', aliases: [], error: 'unsupported_format' };
}

/**
 * Generate a new PKCS12 keystore entirely in the browser.
 *
 * - RSA-2048, self-signed certificate valid for 25 years
 * - Key bag encrypted with `keyPassword`; outer MAC uses `storePassword`
 *
 * When `storePassword !== keyPassword` the two-password case is handled by
 * encoding the key bag independently and patching it into the outer P12 structure.
 */
export function createKeyStore(opts: CreateOpts): Promise<string> {
  const { storePassword, keyAlias, keyPassword, commonName = 'AAPS', organization = 'AAPS', country = 'US' } = opts;

  return new Promise<string>((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, kp) => {
      if (err) return reject(new Error('Key generation failed: ' + err.message));
      try {
        // Build self-signed certificate
        const cert = forge.pki.createCertificate();
        cert.publicKey = kp.publicKey;
        cert.serialNumber = String(Date.now());
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date(Date.now() + 25 * 365 * 24 * 60 * 60 * 1000);
        const attrs = [
          { name: 'commonName', value: commonName },
          { name: 'organizationName', value: organization },
          { name: 'countryName', value: country },
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(kp.privateKey, forge.md.sha256.create());

        let p12Asn1: forge.asn1.Asn1;

        if (storePassword === keyPassword) {
          // Simple path: single-password PKCS12
          p12Asn1 = forge.pkcs12.toPkcs12Asn1(kp.privateKey, cert, storePassword, {
            algorithm: '3des',
            friendlyName: keyAlias,
            generateLocalKeyId: true,
          });
        } else {
          // Two-password path:
          // 1. Build a P12 with keyPassword (no MAC) to get the encrypted key bag
          // 2. Build the final P12 with storePassword/cert
          // 3. Swap the key bag from step 1 into step 2's authSafe
          const keyOnlyP12 = forge.pkcs12.toPkcs12Asn1(kp.privateKey, [], keyPassword, {
            algorithm: '3des',
            friendlyName: keyAlias,
            generateLocalKeyId: true,
            useMac: false,
          });

          p12Asn1 = forge.pkcs12.toPkcs12Asn1(kp.privateKey, cert, storePassword, {
            algorithm: '3des',
            friendlyName: keyAlias,
            generateLocalKeyId: true,
          });

          // PKCS12 ASN.1: SEQUENCE { version, authSafe ContentInfo, macData }
          // authSafe is a ContentInfo whose content wraps a SEQUENCE of ContentInfos
          // forge puts certBag in index 0 and keyBag in index 1 of authSafe.value
          const keyAuthSafe = keyOnlyP12.value[1] as forge.asn1.Asn1;
          const storeAuthSafe = p12Asn1.value[1] as forge.asn1.Asn1;
          if (Array.isArray(keyAuthSafe?.value) && Array.isArray(storeAuthSafe?.value) &&
              storeAuthSafe.value.length >= 2 && keyAuthSafe.value.length >= 1) {
            // Replace the key-bearing ContentInfo in the final P12
            (storeAuthSafe.value as unknown[])[1] = (keyAuthSafe.value as unknown[])[0];
          }
        }

        const der = forge.asn1.toDer(p12Asn1);
        resolve(forge.util.encode64(der.getBytes()));
      } catch (e: any) {
        reject(new Error('KeyStore creation failed: ' + (e?.message ?? e)));
      }
    });
  });
}

/** Trigger a browser file download of the base64-encoded keystore. */
export function downloadKeyStore(base64Content: string, filename = 'keystore.jks'): void {
  const bytes = base64ToBytes(base64Content);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
