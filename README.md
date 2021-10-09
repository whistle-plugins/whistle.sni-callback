# whistle.sni-callback
设置证书插件

# 安装
``` sh
w2 i whistle.sni-callback
```
# 用法
打开插件界面 `http://local.whistlejs.com/whistle.sni-callback/` 上传证书：

![image](https://user-images.githubusercontent.com/11450939/136646559-66ab7877-33b1-41f0-9643-dfa32d5f6afe.png)

# 原理
使用插件钩子 `sniCallback(req, options)`：

``` js
exports.sniCallback = (req, options) => {
  const { servername, certCacheName, certCacheTime } = req.originalReq;
  // servername: 证书域名
  // certCacheName: 非空表示有证书缓存，名字即为输出证书的插件名称
  // certCacheTime: 证书设置的 mtime

  // return false; 表示不解开 HTTPS 请求，继续走隧道代理
  // return true; 表示使用缓存（需要通过 certCacheName, certCacheTime 判断是否确实有缓存，否则使用 Whistle 默认证书）
  // return cert; 返回 servername 对应的证书
  // 其它表示使用 Whistle 默认证书
};

```
