const fileUtils = require('./file-utils');
const fs = require('fs');

const templateToString = (metaData) => {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <artifactId>${metaData.artifactId}</artifactId>
    <version>${metaData.version}</version>
    <packaging>pom</packaging>
    <name>${metaData.artifactId}</name>

    <properties>
        <java.version>1.8</java.version>
        ${Object.keys(metaData.properties)
          .map((item) => {
            const detail = metaData.properties[item];
            return `<${item}>${detail}</${item}>
            `;
          })
          .join('')}
    </properties>

    <dependencyManagement>
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
    </dependencyManagement>
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
