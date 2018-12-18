
// hash string to 32-bit ibnteger
function hash_code (str: string) {
  let hash: number = 0
  let chr: number;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};

export const utils = {
  hash_code
}