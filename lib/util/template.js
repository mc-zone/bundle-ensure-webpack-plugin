function asString(str) {
  if (Array.isArray(str)) {
    return str.join("\n");
  }
  return str;
}

function indent(str) {
  if (Array.isArray(str)) {
    return str.map(indent).join("\n");
  } else {
    str = str.trimRight();
    if (!str) return "";
    const ind = str[0] === "\n" ? "" : "  ";
    return ind + str.replace(/\n([^\n])/g, "\n  $1");
  }
}

module.exports = {
  asString: asString,
  indent: indent
};
