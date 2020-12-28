const StreamZip = require('node-stream-zip');
const streamUtils = require('./stream-utils');
const xml2js = require('xml2js');

const getDependencies = (pomJson) => {
  const result = [];
  pomJson.project.dependencies &&
    pomJson.project.dependencies.length > 0 &&
    pomJson.project.dependencies[0].dependency &&
    pomJson.project.dependencies[0].dependency.map((dependency) => {
      const groupId = dependency.groupId && dependency.groupId[0];
      const artifactId = dependency.artifactId && dependency.artifactId[0];
      const version = dependency.version && dependency.version[0];
      result.push({
        groupId,
        artifactId,
        version,
      });
    });
  return result;
};

const getParent = (pomJson) => {
  const parent = pomJson.project.parent[0];
  return {
    groupId: parent.groupId[0],
    artifactId: parent.artifactId[0],
    version: parent.version[0],
  };
};

const getContent = (file, pathInsideZip) => {
  return new Promise((resolve) => {
    const zip = new StreamZip({
      file: file,
      storeEntries: true,
    });

    zip.on('ready', () => {
      zip.stream(pathInsideZip, async (err, stm) => {
        const xmlContent = await streamUtils.streamToString(stm);
        zip.close();
        xml2js.parseString(xmlContent, (err, pomJson) => {
          if (err) throw err;
          const dependencies = getDependencies(pomJson);
          const parent = getParent(pomJson);
          resolve({
            dependencies,
            parent,
          });
        });
      });
    });
  });
};

const extractVersion = (targetContent, dependency) => {
  let version = dependency.version;
  let property;
  if (!version) {
    version = targetContent.versionOf(dependency.artifactId);
  } else if (version.startsWith('${')) {
    property = version.replace('${', '').replace('}', '');
    version = targetContent.versionOf(dependency.artifactId);
  }

  return [version, property];
};

const normalizeParentPoms = (pomRawContents, targetContent) => {
  const parentPomContents = {};
  pomRawContents.forEach((rawContent) => {
    const { dependencies, parent } = rawContent;
    if (!parentPomContents[parent.artifactId]) {
      parentPomContents[parent.artifactId] = {
        ...parent,
        dependencies: {},
        properties: {},
      };
    }
    const pomContent = parentPomContents[parent.artifactId];
    dependencies.forEach((dependency) => {
      const [version, property] = extractVersion(targetContent, dependency);
      pomContent.dependencies[dependency.artifactId] = {
        ...dependency,
        version,
      };
      if (property) {
        pomContent.properties[property] = version;
      }
    });
  });
  return parentPomContents;
};

const extactParents = async (targetContent) => {
  const pomContentPromises = targetContent.candidateDependencies.map((item) =>
    getContent(item.jarPath, item.pomXml),
  );
  const pomRawContents = await Promise.all(pomContentPromises);
  const normalizedContents = normalizeParentPoms(pomRawContents, targetContent);
  return normalizedContents;
};

module.exports = {
  extactParents,
};
