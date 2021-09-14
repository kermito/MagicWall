module.exports = function(version, hash, size, blocMapSize) {
    let date = new Date().toISOString();
    return `version: ${version}
files:
  - url: magicwall-${version}.AppImage
    sha512: ${hash}
    size: ${size}
    blockMapSize: ${blocMapSize}
path: magicwall-${version}.AppImage
sha512: ${hash}
releaseDate: '${date}'`;
}