const JSON_TYPE = { 'Content-Type': 'application/json' };

function getTimeoutPromise() {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('timeout'));
    }, 10000);
  });
}

function toJson(res) {
  return res.json().then((data) => {
    if (data.retcode !== 0) {
      const err = new Error(data.retmsg || '未知错误');
      err.retcode = data.retcode;
      throw err;
    }
    return data;
  });
}

function fetchData(url, data) {
  return Promise.race([
    fetch(url, {
      method: data == null ? 'GET' : 'POST',
      cache: 'no-cache',
      headers: JSON_TYPE,
      body: data && JSON.stringify(data),
    }),
    getTimeoutPromise(),
  ]).then(toJson);
}

export const uploadCerts = () => {};
export const getCertsInfo = () => {};
export const removeCert = () => {};
