import forge from 'node-forge';

const ENCRYPTION_KEY = (process.env.EXPO_PUBLIC_QR_ENCRYPTION_KEY || 'ChecheQRKey2026Secure!')
  .padEnd(16, '0')
  .substring(0, 16);
const PREFIX = '$';

export function encryptQRData(data: string): string {
  try {
    let iv;
    try {
      iv = forge.random.getBytesSync(16);
    } catch {
      iv = forge.md.md5.create().update(ENCRYPTION_KEY).digest().getBytes(16);
    }

    const cipher = forge.cipher.createCipher('AES-CBC', ENCRYPTION_KEY);
    cipher.start({ iv });
    cipher.update(forge.util.createBuffer(data, 'utf8'));
    cipher.finish();

    const encrypted = cipher.output.getBytes();
    return PREFIX + forge.util.encode64(iv + encrypted);
  } catch (error) {
    console.error('QR Encryption failed:', error);
    return data;
  }
}

export function decryptQRData(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  if (!encryptedData.startsWith(PREFIX)) return encryptedData;
  if (encryptedData.startsWith('{') || /^[\+\d\s]+$/.test(encryptedData)) return encryptedData;

  try {
    const raw = encryptedData.substring(PREFIX.length);
    const decoded = forge.util.decode64(raw);
    const iv = decoded.substring(0, 16);
    const encrypted = decoded.substring(16);

    const decipher = forge.cipher.createDecipher('AES-CBC', ENCRYPTION_KEY);
    decipher.start({ iv });
    decipher.update(forge.util.createBuffer(encrypted));
    decipher.finish();

    return decipher.output.toString();
  } catch (error) {
    console.error('QR Decryption failed:', error);
    return encryptedData;
  }
}
