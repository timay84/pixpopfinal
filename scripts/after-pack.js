const { execSync } = require('child_process');
const fs = require('fs');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appOutDir = context.appOutDir;
  const files = fs.readdirSync(appOutDir);
  const appName = files.find(f => f.endsWith('.app'));
  if (!appName) {
    console.log('No .app found in', appOutDir);
    return;
  }
  const appPath = `${appOutDir}/${appName}`;
  console.log('Ad-hoc signing:', appPath);
  execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
};
