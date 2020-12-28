const StreamZip = require('node-stream-zip');
const streamUtils = require('./stream-utils');
const fileUtils = require('./file-utils');

const getProperties = (content) => {
  let res = content.replace(/\n\s/g, '=');
  res = res.replace(/\n/g, '=');
  res.replace('?', '');
  res = res.split(/=/g);
  const [, artifactId, , groupId, , version] = res;
  return {
    artifactId,
    groupId,
    version,
  };
};

const moveZipContents = (candidateDepency, destinationFolder) => {
  return new Promise((resolve) => {
    const zip = new StreamZip({
      file: candidateDepency.jarPath,
      storeEntries: true,
    });
    zip.on('ready', () => {
      zip.stream(candidateDepency.pomProperties, async (err, stm) => {
        const rawProperties = await streamUtils.streamToString(stm);
        const properties = getProperties(rawProperties);
        const path = `${destinationFolder}/${properties.groupId.replaceAll(
          '.',
          '/',
        )}/${properties.artifactId}/${properties.version}`;
        fileUtils.createFolderRecursive(path);

        fileUtils.copy(
          candidateDepency.jarPath,
          `${path}/${properties.artifactId}-${properties.version}.jar`,
        );

        zip.stream(candidateDepency.pomXml, (err, pomStm) => {
          fileUtils.copyStream(pomStm, `${path}/pom.xml`);
          pomStm.on('end', () => {
            zip.close();
            resolve();
          });
        });
      });
    });
  });
};

const copyjars = async (targetContent, destinationFolder) => {
  const promises = targetContent.candidateDependencies.map((candidateDepency) =>
    moveZipContents(candidateDepency, destinationFolder),
  );
  await Promise.all(promises);
};

module.exports = copyjars;
