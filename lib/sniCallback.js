const certMgr = require('./uiServer/certMgr');

module.exports = async (req, { name }) => {
  const { servername, certCacheName, certCacheTime } = req.originalReq;
  const cert = certMgr.get(servername);
  if (cert && certCacheName === name && certCacheTime === cert.mtime) {
    return true;
  }
  return cert;
};
