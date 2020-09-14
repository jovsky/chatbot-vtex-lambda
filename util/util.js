module.exports.replaceChar = function(str, c1, c2) {
  let newStr = "";
  for(let i=0; i<str.length; i++) str[i]===c1 ? (newStr+=c2) : (newStr+=str[i])
  return newStr;
}

module.exports.toTitleCase = function(str) {
  return str[0].toUpperCase() + str.slice(1);
}
