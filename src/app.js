const fileUtils = require('./util/file-utils');
const targetAnalizer = require('./util/target-analizer');
const parentAnalizer = require('./util/parent-analizer');
const copyjars = require('./util/copyjars');
const generatepoms = require('./util/generatepoms');

const toMavenRepo = async ({ srcDir, targetDir }) => {
  fileUtils.deleteFolderRecursive(targetDir);
  fileUtils.createFolderRecursive(`${targetDir}/tr/com/aselsan/scope`);

  const targetContent = await targetAnalizer.analyze(srcDir);
  const parentPomMetaDatas = await parentAnalizer.extactParents(targetContent);
  await copyjars(targetContent, targetDir);

  await generatepoms(parentPomMetaDatas, targetDir);
};

const start = async () => {
  const [srcDir, targetDir] = process.argv.slice(2);
  await toMavenRepo({
    srcDir,
    targetDir,
  });
};

start();
