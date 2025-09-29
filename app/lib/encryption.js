import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this-in-production'

export function encryptText(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

export function decryptText(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function hashPassword(password) {
  return CryptoJS.SHA256(password).toString()
}

export function comparePassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword
}