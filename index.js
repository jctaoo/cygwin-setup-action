const core = require('@actions/core');
const { downloadFile } = require('./libs/download');
const path = require("path").win32;
const os = require("os");
const fs = require("fs");
const exec = require('@actions/exec');
const cache = require('@actions/cache');
const { hash } = require('./libs/hash');
const zip = require('node-7z');

if (process.platform !== 'win32') {
    core.setFailed("cygwin-setup-action runs only on windows")
}

async function main() {
    const installDir = core.getInput('install-dir');
    const packages = core.getInput("packages")
        .split(os.EOL)
        .map(i =>
            i.split(" ").map(i => i.trim())
        )
        .flat()
        .filter(i => i.trim().length !== 0);
    const cacheKey = hash(packages.join(";"));
    // const compressPath = path.resolve("C:\\cygwin.7z");

    core.info(`Cache key is: ${cacheKey}`)

    const cachePath = [
        installDir
    ]
    const hitKey = await cache.restoreCache(cachePath, cacheKey, [], {}, false)
    if (!!hitKey) {
        core.info(`Find cygwin cache (key: ${hitKey}), skip installation.`)
        return;
    }

    if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, { recursive: true });
    }

    const downloadUrl = `https://cygwin.com/setup-x86_64.exe`
    const setupExeOutput = path.join(installDir, "setup.exe");
    await downloadFile(downloadUrl, setupExeOutput);

    core.info(`downloaded cygwin setup exe at: ${setupExeOutput}`);
    core.info("prepare to install below packages:");
    core.info(packages.map(i => `  - ${i}`).join(os.EOL));

    const cygwinSite = "http://mirrors.kernel.org/sourceware/cygwin/";
    const cygwinPackagePath = path.join(installDir, "packages");
    const args = ['-qgnO', '-s', cygwinSite, '-l', cygwinPackagePath, '-R', installDir]
        .concat(packages.map(i => ['-P', i]))
        .flat();

    const output = await exec.exec(setupExeOutput, args);
    core.info(`${setupExeOutput} run completed with exits code: ${output}`);

    core.info(`add path: ${path.join(installDir, "bin")}`)
    core.addPath(path.join(installDir, "bin"));

    // compress cygwin install dir to cache

    const cacheId = await cache.saveCache(cachePath, cacheKey, {}, false);
    if (!!cacheId) {
        core.info(`Cache cygwin successfully (key: ${cacheId})`)
    }
}

main().catch(error => core.setFailed(error.message));