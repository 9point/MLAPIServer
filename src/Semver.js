const rWholeNumber = /^\d+$/;

function parse(str) {
  const split1 = str.split('.');
  if (split1.length !== 3) {
    throw Error(`Invalid SemVer string: ${str}`);
  }

  const split2 = split1[2].split('-');

  if (split2.length > 2) {
    throw Error(`Invalid SemVer string: ${str}`);
  }

  if (split2.length === 2 && split2[1] !== 'dev') {
    throw Error(`Invalid SemVer string: ${str}`);
  }

  const dev = split2.length === 2;

  const majorSerial = split1[0];
  const minorSerial = split1[1];
  const pathSerial = split2[0];

  if (
    !rWholeNumber.test(majorSerial) ||
    !rWholeNumber.test(minorSerial) ||
    !rWholeNumber.test(pathSerial)
  ) {
    throw Error(`Invalid SemVer string: ${str}`);
  }

  return {
    dev,
    major: parseInt(majorSerial, 10),
    minor: parseInt(minorSerial, 10),
    patch: parseInt(pathSerial, 10),
  };
}

function isValidTransition(fromSemver, toSemver) {
  if (!fromSemver.dev && toSemver.dev) {
    return false;
  }

  if (fromSemver.major < toSemver.major) {
    return true;
  }

  if (
    fromSemver.major === toSemver.major &&
    fromSemver.minor < toSemver.minor
  ) {
    return true;
  }

  if (
    fromSemver.major === toSemver.major &&
    fromSemver.minor === toSemver.minor &&
    fromSemver.parse <= toSemver.patch
  ) {
    return true;
  }

  return false;
}

function isEqual(semver1, semver2) {
  return ['dev', 'major', 'minor', 'patch'].every(
    (key) => semver1[key] === semver2[key],
  );
}

module.exports = {
  isEqual,
  isValidTransition,
  parse,
};
