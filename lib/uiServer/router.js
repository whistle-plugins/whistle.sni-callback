const certMgr = require('./certMgr');

module.exports = (router, options) => {
  certMgr.setup(options);

  router.get('/cgi-bin/list', (ctx) => {
    ctx.body = certMgr.list();
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
