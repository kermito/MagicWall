const path = require("path");
module.exports = {
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
    outputDir: path.join(__dirname, "/vuedist")
}