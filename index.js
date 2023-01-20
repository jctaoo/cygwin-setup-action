const core = require('@actions/core');
const github = require('@actions/github');
const { downloadFile } = require('./libs/download');
const path = require("path").win32;
const os = require("os");
const fs = require("fs");

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
        .flat();

    if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, { recursive: true });
    }

    const downloadUrl = `https://cygwin.com/setup-x86_64.exe`
    const setupExeOutput = path.join(installDir, "setup.exe");
    await downloadFile(downloadUrl, setupExeOutput);

    core.info(`downloaded cygwin setup exe at: ${setupExeOutput}`);
    core.info("prepare to install below packages:");
    core.info(packages.map(i => `\t- ${i}`).join(os.EOL));
}

main().catch(error => core.setFailed(error.message));