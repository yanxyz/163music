/**
 * https://github.com/darknessomi/musicbox/wiki
 * https://github.com/stkevintan/Cube/blob/master/src/model/Crypto.js
 */

const crypto = require('crypto')
const bigInt = require('big-integer')

function aesEncrypt(text, secKey) {
  const cipher = crypto.createCipheriv('AES-128-CBC', secKey, '0102030405060708')
  return cipher.update(text, 'utf8', 'base64') + cipher.final('base64')
}

function rsaEncrypt(text, exponent, modulus) {
  const rText = text.split('').reverse().join(''), // reverse text
    radix = 16,
    biText = bigInt(new Buffer(rText).toString('hex'), radix),
    biEx = bigInt(exponent, radix),
    biMod = bigInt(modulus, radix),
    biRet = biText.modPow(biEx, biMod)
  return biRet.toString(radix).padStart(256, '0')
}

function createSecretKey(size) {
  const keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = ''
  for (let i = 0; i < size; i++) {
    let pos = Math.random() * keys.length
    pos = Math.floor(pos)
    key = key + keys.charAt(pos)
  }
  return key
}

module.exports = function (text) {
  const modulus = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7'
  const nonce = '0CoJUm6Qyw8W8jud'
  const pubKey = '010001'
  const secKey = createSecretKey(16)
  return {
    params: aesEncrypt(aesEncrypt(text, nonce), secKey),
    encSecKey: rsaEncrypt(secKey, pubKey, modulus)
  }
}
