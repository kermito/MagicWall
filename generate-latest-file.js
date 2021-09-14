const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const getLinuxConfigString = require('./generator/latest-linux-yml');
const pjson = require('./package.json');
const version = pjson.version;

function hashFile(file, algorithm = 'sha512', encoding = 'base64', options) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    hash.on('error', reject).setEncoding(encoding);
    fs.createReadStream(
      file,
      Object.assign({}, options, {
        highWaterMark: 1024 * 1024,
        /* better to use more memory but hash faster */
      })
    )
      .on('error', reject)
      .on('end', () => {
        hash.end();
        resolve(hash.read());
      })
      .pipe(
        hash,
        {
          end: false,
        }
      );
  });
}

function getFileStat(filePath) {
    return new Promise((resolve, reject) => {
        try {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stats);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}


function generateLatestLinux() {
    return new Promise(async (resolve, reject) => {
        try {
            const installerPath = path.resolve(
                __dirname,
                "dist/magicwall-" + version + ".AppImage"
            );
            const ymlPath = path.join(
                __dirname,
                "dist/latest-linux.yml"
            );
            const hash = await hashFile(installerPath);
            const fileStat = await getFileStat(installerPath);
            const size = fileStat.size;
            const blocMapSize = fileStat.blksize;
            const config = getLinuxConfigString(version, hash, size, blocMapSize);
            fs.writeFileSync(ymlPath, config);
            resolve(ymlPath);
        } catch (error) {
            reject(error);
        }
    });
}


async function generateLatestWin() {
    return new Promise(async (resolve, reject) => {
        try {
            const installerPath = path.resolve(
                __dirname,
                "dist/magicwall Setup " + version + ".exe"
            );
            const hash = await hashFile(installerPath);
            const fileStat = await getFileStat(installerPath);
            const size = fileStat.size;
            const blocMapSize = fileStat.blksize;
            const config = getLinuxConfigString(version, hash, size, blocMapSize);
            const ymlPath = path.join(
                __dirname,
                "dist/latest.yml"
            );

            fs.writeFileSync(ymlPath, config);
            resolve(ymlPath);
        } catch (error) {
            reject(error);
        }
    });
}

async function main() {
    try {
        const lin = await generateLatestLinux();
        console.log(lin)
    } catch (error) {
        console.error(error);
    }
    
    try {
        const win = await generateLatestWin();
        console.log(win)
    } catch (error) {
        console.error(error);
    }
}

main();