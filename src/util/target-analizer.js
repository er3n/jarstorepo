const fs = require('fs');
const StreamZip = require('node-stream-zip');

const analizeJarContent = (file) => {
  return new Promise((resolve) => {
    const zip = new StreamZip({
      file: file,
      storeEntries: true,
    });
    zip.on('ready', () => {
      let pomProperties;
      let pomXml;
      let jarPath;
      for (const entry of Object.values(zip.entries())) {
        const name = entry.name;
        if (name.includes('tr.com.aselsan.scope')) {
          if (name.endsWith('pom.properties')) {
            pomProperties = name;
          } else if (name.endsWith('pom.xml')) {
            pomXml = name;
          }
        }
      }
      jarPath = file;
      zip.close();
      resolve({
        jarPath,
        pomXml,
        pomProperties,
      });
    });
  });
};

const versionOf = function (artifact) {
  let candidateFileName = this.versions
    .filter((item) => item.startsWith(artifact))
    .sort()[0];

  if (!candidateFileName) {
    candidateFileName = `${artifact}-1.0.0`;
  }

  return candidateFileName.replace(`${artifact}-`, '').replace('.jar', '');
};

const extractCandidateDependencies = async (srcPath) => {
  const fileNames = await fs.promises.readdir(srcPath);
  const jarContentPromises = fileNames.map((fileName) =>
    analizeJarContent(`${srcPath}/${fileName}`),
  );
  const results = await Promise.all(jarContentPromises);
  return results.filter((item) => !!(item.pomProperties && item.pomXml));
};

const analyze = async (srcPath) => {
  const fileNames = await fs.promises.readdir(srcPath);
  const candidateDependencies = await extractCandidateDependencies(srcPath);
  return {
    versions: fileNames,
    versionOf,
    candidateDependencies,
  };
};

module.exports = {
  analyze,
};
