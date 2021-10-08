const certMgr = require('./certMgr');

module.exports = (router) => {
  router.get('/cgi-bin/info', (ctx) => {
    ctx.body = certMgr.info();
  });
  router.post('/cgi-bin/upload', async (ctx) => {
    await certMgr.upload();
    ctx.body = { ec: 0 };
  });
  router.post('/cgi-bin/remove', async (ctx) => {
    await certMgr.remove();
    ctx.body = { ec: 0 };
  });
};
