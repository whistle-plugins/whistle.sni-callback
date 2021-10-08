const fs = require('fs');
const path = require('path');
const util = require('util');
/* eslint-disable no-empty */
const certMap = {};
const certInfo = [];
const UTF8 = { encoding: 'utf8' };
const CERT_FILENAME_RE = /^([^\s]+)\.(crt|key)$/;
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
let certPath;
let forge;
let pki;

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
    if ((item.type === 2 || item.type === 7) && !certMap[item.value]) {
      certMap[item.value] = cert;
      dnsName.push(item.value);
    }
  });
  if (dnsName.length) {
    certInfo[filename] = { mtime, dnsName: dnsName.join(', '), ...validity };
  }
};

const readCert = async (filename, mtime) => {
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

const readCerts = async () => {
  let certs = {};
  let list;
  try {
    list = await readdir(certPath);
  } catch (e) {}

  if (!list) {
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
  await list.map(async (filename) => {
    try {
      certs[filename] = await stat(path.join(certPath, `${filename}.crt`)).mtime.getTime();
    } catch (e) {}
  });
  list = Object.keys(certs).sort((key1, key2) => {
    return compare(certs[key1], certs[key2]);
  });
  await list.map(async (filename) => {
    try {
      await readCert(filename, certs[filename]);
    } catch (e) {}
  });
};

const watch = () => {

};

exports.setup = ({ require: require2, config }) => {
  const fse = require2('fs-extra2');
  forge = require2('node-forge');
  pki = forge.pki;
  certPath = path.join(config.pluginBaseDir, 'custom_certs');
  fse.ensureDirSync(certPath);
  const list = fs.readdirSync(certPath);
};

exports.list = () => {

};

exports.remove = (filename) => {

};

exports.upload = () => {

};
