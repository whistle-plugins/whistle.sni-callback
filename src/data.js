const JSON_TYPE = { 'Content-Type': 'application/json' };

function getTimeoutPromise() {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('timeout'));
    }, 10000);
  });
}

function toJson(res) {
  return res.json();
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

export const uploadCerts = (files) => {
  return fetchData('cgi-bin/upload', files);
};
export const getCertsInfo = () => {
  return fetchData('cgi-bin/info');
};
export const removeCert = () => {};
