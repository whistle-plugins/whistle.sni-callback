const fs = require('fs');
const path = require('path');

let certPath;

exports.setup = ({ require: require2, config }) => {
  const fse = require2('fse-extra2');
  certPath = path.join(config.pluginDataDir, 'custom_certs');
  fse.ensureDir(certPath);
  const list = fs.readdirSync(certPath);
  console.log(list);
};

exports.list = () => {

};

exports.remove = (filename) => {

};

exports.upload = () => {

};
