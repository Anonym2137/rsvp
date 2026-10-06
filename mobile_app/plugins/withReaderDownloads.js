const { withMainApplication, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withReaderDownloads(config) {
  config = withMainApplication(config, (mod) => {
    if (mod.modResults.language !== 'kt') throw new Error('Reader downloads require Kotlin MainApplication');
    const contents = mod.modResults.contents;
    if (!contents.includes('add(ReaderWebViewPackage())')) {
      const anchor = 'PackageList(this).packages.apply {';
      if (!contents.includes(anchor)) throw new Error('Cannot register ReaderWebViewPackage in MainApplication');
      mod.modResults.contents = contents.replace(anchor, `${anchor}
          removeAll { it is com.reactnativecommunity.webview.RNCWebViewPackage }
          add(ReaderWebViewPackage())`);
    }
    return mod;
  });
  return withDangerousMod(config, ['android', async (mod) => {
    const appPackage = mod.android.package;
    const destination = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/java', ...appPackage.split('.'));
    fs.mkdirSync(destination, { recursive: true });
    const template = fs.readFileSync(path.join(__dirname, 'ReaderWebViewPackage.kt'), 'utf8');
    fs.writeFileSync(path.join(destination, 'ReaderWebViewPackage.kt'), template.replace('package com.anonym.rsvpreader', `package ${appPackage}`));
    return mod;
  }]);
};
