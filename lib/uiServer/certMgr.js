const fs = require('fs');
const path = require('path');
const util = require('util');
/* eslint-disable no-empty */
let certMap = {};
let certInfo = {};
let certDetails = {};
let rules = '';
let _certMap = {};
let _certInfo = {};
let _certDetails = {};
const UTF8 = { encoding: 'utf8' };
const CERT_FILENAME_RE = /^([^\s]+)\.(crt|key)$/;
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
let certPath;
let forge;
let pki;

const removeFile = (filename) => {
  return new Promise(resolve => fs.unlink(path.join(certPath, filename), resolve));
};

const getAltNames = (exts) => {
  for (let i = 0, len = exts.length; i < len; i++) {
    const item = exts[i];
    if (item.name === 'subjectAltName') {
      return item.altNames;
    }
  }
};

const parseCert = (cert) => {
  let altNames;
  let pem;
  try {
    pem = pki.certificateFromPem(cert.cert);
    altNames = pem.extensions && getAltNames(pem.extensions);
  } catch (e) {}

  if (!altNames || !altNames.length) {
    return;
  }

  const { filename, mtime } = cert;
  const { validity } = pem;
  const dnsName = [];
  Object.assign(cert, validity);
  altNames.forEach((item) => {
    if ((item.type === 2 || item.type === 7) && !_certMap[item.value]) {
      _certMap[item.value] = cert;
      dnsName.push(item.value);
    }
  });
  if (dnsName.length) {
    _certInfo[filename] = { mtime, dnsName, ...validity };
    _certDetails[filename] = { mtime, dnsName, ...validity, cert };
  }
};

const readCert = async (filename, mtime) => {
  let cacheCert = certDetails[filename];
  if (cacheCert && cacheCert.mtime === mtime) {
    cacheCert.dnsName.forEach((domain) => {
      _certMap[domain] = cacheCert.cert;
    });
    _certDetails[filename] = cacheCert;
    cacheCert = { ...cacheCert };
    delete cacheCert.cert;
    _certInfo[filename] = cacheCert;
    return;
  }
  try {
    const key = await readFile(path.join(certPath, `${filename}.key`), UTF8);
    const cert = await readFile(path.join(certPath, `${filename}.crt`), UTF8);
    if (key && cert) {
      parseCert({ filename, key, cert, mtime });
    }
  } catch (e) {}
};

const compare = (v1, v2) => {
  if (v1 === v2) {
    return 0;
  }
  return v1 > v2 ? -1 : 1;
};

const _readCerts = async () => {
  let certs = {};
  let list = await readdir(certPath);
  if (!list || !list.length) {
    return;
  }
  list.forEach((name) => {
    if (!CERT_FILENAME_RE.test(name)) {
      return;
    }
    const filename = RegExp.$1;
    const suffix = RegExp.$2;
    const cert = certs[filename] || {};
    certs[filename] = cert;
    cert[suffix === 'crt' ? 'cert' : suffix] = 1;
  });
  list = [];
  Object.keys(certs).forEach((filename) => {
    const cert = certs[filename];
    if (cert.key && cert.cert) {
      list.push(filename);
    }
  });
  certs = {};
  await Promise.all(list.map(async (filename) => {
    try {
      const { mtime } = await stat(path.join(certPath, `${filename}.crt`));
      certs[filename] = mtime.getTime();
    } catch (e) {}
  }));
  list = Object.keys(certs).sort((key1, key2) => {
    return compare(certs[key1], certs[key2]);
  });
  await Promise.all(list.map(async (filename) => {
    try {
      await readCert(filename, certs[filename]);
    } catch (e) {}
  }));
};

const readCerts = async () => {
  _certMap = {};
  _certInfo = {};
  _certDetails = {};
  try {
    await _readCerts();
    certMap = _certMap;
    certInfo = _certInfo;
    certDetails = _certDetails;
    rules = `sniCallback://sni-callback ${Object.keys(certMap).join(' ')}`;
  } catch (e) {} finally {
    setTimeout(readCerts, 3000);
  }
};

exports.setup = ({ require: require2, config }) => {
  const fse = require2('fs-extra2');
  forge = require2('node-forge');
  pki = forge.pki;
  certPath = path.join(config.pluginBaseDir, 'custom_certs');
  fse.ensureDirSync(certPath);
  return readCerts();
};

exports.info = () => {
  return certInfo;
};

exports.rules = () => rules;

exports.remove = (filename) => {
  removeFile(`${filename}.key`);
  removeFile(`${filename}.crt`);
};

exports.upload = (files) => {
  console.log(files);
};

exports.get = (servername) => {
  const cert = certMap[servername];
  if (cert) {
    return cert;
  }
  const index = servername.indexOf('.');
  return index === -1 ? null : certMap[`*.${servername.substring(index + 1)}`];
};
