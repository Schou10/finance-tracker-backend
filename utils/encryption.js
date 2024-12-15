const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY.padEnd(16, '0').slice(0, 16);
const IV_LENGTH = 16;

function encrypt(data){
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-128-cbc', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return { iv: iv.toString('hex'), content: encrypted.toString('hex')};
}

function decrypt(encryptedData){
  const decipher = crypto.createDecipheriv(
    'aes-128-cbc',
    ENCRYPTION_KEY,
    Buffer.from(encryptedData.iv, 'hex')
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData.content, 'hex')),
    decipher.final()]);
  const decryptedSring = decrypted.toString('utf8');
  try{
    return JSON.parse(decryptedSring);
  }catch(err){
    return decryptedSring;
  }
  }

  module.exports = { encrypt, decrypt};