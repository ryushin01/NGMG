const { withGradleProperties } = require('expo/config-plugins');

// 네이티브 모듈이 많아 Gradle 기본 메모리로는 Release 빌드가 Metaspace 부족으로 실패합니다.
module.exports = (config) =>
  withGradleProperties(config, (next) => {
    next.modResults = next.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'org.gradle.jvmargs'),
    );
    next.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8',
    });
    return next;
  });
