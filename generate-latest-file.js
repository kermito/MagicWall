// Libs
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const request  = require('request');
const YAML = require("yaml");
const github = require('@actions/github');

// Functions
const getLinuxConfigString = require('./generator/latest-linux-yml');
const getWinConfigString = require('./generator/latest-yml');

// Variables
const args = process.argv;
const pjson = require('./package.json');
const version = pjson.version;
const hasToUpload = (args.indexOf("--upload") !== -1);
let uploadConfig = {};
if (hasToUpload) {
    const uploadConfigFile = fs.readFileSync(
        path.resolve(
            __dirname,
            './dev-app-update.yml'
        ),
        'utf8'
    )
    uploadConfig = YAML.parse(uploadConfigFile)
}

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
            const fileStat = fs.statSync(installerPath);
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
            const fileStat = fs.statSync(installerPath);
            const size = fileStat.size;
            const blocMapSize = fileStat.blksize;
            const config = getWinConfigString(version, hash, size, blocMapSize);
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

function getRealeseId() {
    return new Promise(async (resolve, reject) => {
        try {
            const gh = new github.getOctokit(uploadConfig.token);
            let releases = await gh.rest.repos.listReleases({
                owner: uploadConfig.owner,
                repo: uploadConfig.repo
            });
            for (let i = 0; i < releases.data.length; i++) {
                const rel = releases.data[i];
                if (rel.name == version) {
                    resolve(rel.id)
                }
            }
            reject(undefined);
        } catch (error) {
            reject(error);
        }
    })
}

function uploadToRealese(filePath, assetName) {
    return new Promise(async (resolve, reject) => {
        try {
            // assetName = encodeURIComponent(assetName);
            const stats = fs.statSync(filePath);
            const releaseId = await getRealeseId();
            const uploadUrl = `https://uploads.github.com/repos/${uploadConfig.owner}/${uploadConfig.repo}/releases/${releaseId}/assets?name=${assetName}`
            const options = {
                url: uploadUrl,
                port: 443,
                auth: {
                    pass: 'x-oauth-basic',
                    user: uploadConfig.token
                },
                json:true,
                headers: {
                    'User-Agent': 'Release-Agent',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/zip',
                    'Content-Length': stats.size
                },
                qs: {
                    name: assetName
                }
            };
            
            fs.createReadStream(filePath).pipe(
                request.post(options, function(err, res, body){
                    if (err) {
                        reject(err);
                    }
                    if (res.statusCode != 201) {
                        resolve(false);
                    }
                    resolve(true);
                })
            );
        } catch (error) {
            reject(error);
        }
    });
}

async function main() {
    // Linux latest file
    try {
        const lin = await generateLatestLinux();
        console.log(lin)
        if (hasToUpload) {
            const uploadLin = await uploadToRealese(lin, "latest-linux.yml");
            if (uploadLin === true) {
                console.log("Uploaded with success !");
            } else {
                console.error("Upload has failed...");
            }
        }
    } catch (error) {
        console.error(error);
    }
    
    // Windows latest file
    try {
        const win = await generateLatestWin();
        console.log(win)
        if (hasToUpload) {
            const uploadWin = await uploadToRealese(win, "latest.yml");
            if (uploadWin === true) {
                console.log("Uploaded with success !");
            } else {
                console.error("Upload has failed...");
            }
        }
    } catch (error) {
        console.error(error);
    }
}

main();