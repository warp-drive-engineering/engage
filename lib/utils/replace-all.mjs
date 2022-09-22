export function replaceAll(str, match, replace) {
  if (String.prototype.replaceAll) {
    return str.replaceAll(match, replace)
  }
  return str.replace(new RegExp(match, 'g'), replace);
}
