module.exports = function(version, hash, size) {
    let date = new Date().toISOString();
    return `version: ${version}
files:
  - url: magicwall-Setup-${version}.exe
    sha512: ${hash}
    size: ${size}
path: magicwall-Setup-${version}.exe
sha512: ${hash}
releaseDate: '${date}'`;
}

module.exports = getConfigString;