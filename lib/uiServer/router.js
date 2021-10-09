const certMgr = require('./certMgr');

module.exports = (router) => {
  router.get('/cgi-bin/rules', (ctx) => {
    ctx.body = certMgr.rules();
  });
  router.get('/cgi-bin/info', (ctx) => {
    ctx.body = certMgr.info();
  });
  router.post('/cgi-bin/upload', async (ctx) => {
    try {
      await certMgr.upload(ctx.request.body);
      ctx.body = certMgr.info();
    } catch (e) {
      ctx.body = { ec: 2, em: e.message };
    }
  });
  router.post('/cgi-bin/remove', async (ctx) => {
    await certMgr.remove(ctx.request.body.filename);
    ctx.body = certMgr.info();
  });
};
