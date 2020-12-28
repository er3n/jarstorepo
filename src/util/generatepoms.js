const fileUtils = require('./file-utils');
const fs = require('fs');

const templateToString = (metaData) => {
  return `
    <project>
        <artifactId>${metaData.artifactId}</artifactId>
        <groupId>${metaData.groupId}</groupId>
        <version>${metaData.version}</version>
        <properties>
            ${Object.keys(metaData.properties)
              .map((item) => {
                const detail = metaData.properties[item];
                return `<${item}>${detail}</${item}>
                `;
              })
              .join('')}
        </properties>
        <dependencies>
            ${Object.keys(metaData.dependencies)
              .map((item) => {
                const detail = metaData.dependencies[item];
                return `
                <dependency>
                    <artifactId>${detail.artifactId}</artifactId>
                    <groupId>${detail.artifactId}</groupId>
                    <version>${detail.version}</version>
                </dependency>
                `;
              })
              .join('')}
        </dependencies>
    
    </project>
    `;
};

const createParentPom = (metaData, destinationFolder) => {
  return new Promise((resolve) => {
    const str = templateToString(metaData);

    const path = `${destinationFolder}/${metaData.groupId.replaceAll(
      '.',
      '/',
    )}/${metaData.artifactId}/${metaData.version}`;
    fileUtils.createFolderRecursive(path);

    fs.writeFile(`${path}/pom.xml`, str, 'utf8', () => {
      resolve();
    });

    console.log(str);
  });
};

const generatepoms = async (parentPomMetaDatas, destinationFolder) => {
  await Promise.all(
    Object.keys(parentPomMetaDatas).map((key) =>
      createParentPom(parentPomMetaDatas[key], destinationFolder),
    ),
  );
};

module.exports = generatepoms;
