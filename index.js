const core = require('@actions/core');
const github = require('@actions/github');
const { downloadFile } = require('./libs/download');
const path = require("path").win32;
const os = require("os");
const fs = require("fs");
const { spawnChild } = require('./libs/spwan');
const dirTree = require("directory-tree");

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
    const args = ['-l', cygwinPackagePath, '-R', installDir]
        .concat(packages.map(i => ['-P', i]))
        .flat();

    core.info(`run: ${setupExeOutput} ${args.join(" ")}`)
    const output = await spawnChild(setupExeOutput, args);
    core.info(`${setupExeOutput} run successfully: ${output}`);

    const tree = dirTree(installDir);
    core.info(tree);
}

main().catch(error => core.setFailed(error.message));