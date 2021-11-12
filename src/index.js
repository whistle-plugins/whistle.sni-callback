import './index.less';

import ReactDOM from 'react-dom';
import React, { Component } from 'react';
import { Table, Icon, Button, message, Popconfirm } from 'antd';
import { uploadCerts, getCertsInfo, removeCert } from './data';

const HIGHLIGHT = { color: 'red', fontWeight: 'bold' };
const OK_STYLE = { color: '#5bbd72', fontSize: '22px', fontWeight: 'bold', overflow: 'hide', lineHeight: '18px' };

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
  });
}

function parseCerts(data) {
  const now = Date.now();
  Object.keys(data).forEach((filename) => {
    const cert = data[filename];
    const startDate = new Date(cert.notBefore);
    const endDate = new Date(cert.notAfter);
    let status = '✓';
    let isInvalid;
    if (startDate.getTime() > now) {
      isInvalid = true;
      status = 'Invalid';
    } else if (endDate.getTime() < now) {
      isInvalid = true;
      status = 'Expired';
    }
    cert.validity = `${startDate.toLocaleString()} ~ ${endDate.toLocaleString()}`;
    cert.status = status;
    cert.isInvalid = isInvalid;
    cert.filename = filename;
    cert.dnsName = cert.dnsName.join(', ');
  });
  return {
    data: Object.keys(data).sort((a, b) => {
      return data[a].mtime > data[b].mtime ? -1 : 1;
    }).map(filename => data[filename]),
  };
}

// eslint-disable-next-line react/prefer-stateless-function
class CertList extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.columns = [
      {
        title: '文件名称',
        dataIndex: 'filename',
        key: 'filename',
        width: 270,
        render: (_, record) => {
          return <span style={record.status !== '✓' ? HIGHLIGHT : null}>{record.filename}</span>;
        },
      },
      {
        title: '域名列表',
        dataIndex: 'dnsName',
        key: 'dnsName',
        render: (_, record) => {
          return <span style={record.status !== '✓' ? HIGHLIGHT : null}>{record.dnsName}</span>;
        },
      },
      {
        title: '有效期',
        dataIndex: 'validity',
        key: 'validity',
        width: 380,
        render: (_, record) => {
          return <span style={record.status !== '✓' ? HIGHLIGHT : null}>{record.validity}</span>;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (_, record) => {
          return <span style={record.status !== '✓' ? HIGHLIGHT : OK_STYLE}>{record.status}</span>;
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        width: 150,
        render: (_, record) => {
          return (
            <Popconfirm
              title={`确定删除证书 "${record.filename}" ？`}
              onConfirm={() => this.removeCert(record.filename)}
            >
              <a>删除</a>
            </Popconfirm>
          );
        },
      },
    ];
  }

  removeCert = async (filename) => {
    try {
      const data = await removeCert({ filename });
      this.setState(parseCerts(data));
    } catch (e) {
      message.error('操作异常，请稍后重试！');
    }
  }

  async componentDidMount() {
    try {
      const data = await getCertsInfo();
      this.setState(parseCerts(data));
    } catch (e) {
      message.error('证书加载失败，请稍后重试!');
    }
  }

  formatFiles = (fileList = []) => {
    let certs;
    for (let i = 0, len = fileList.length; i < len; i++) {
      const cert = fileList[i];
      if (cert.size > 64 * 1024 || !(cert.size > 0)) {
        message.error('上传的证书过大，请上传64K以内的证书！');
        return;
      }
      let { name } = cert;
      if (!/\.(crt|key)/.test(name)) {
        message.error('只支持 .key 或 .crt 后缀的文件！');
        return;
      }
      const suffix = RegExp.$1;
      name = name.slice(0, -4);
      if (!name || /[^\w.()%[]（）-]/.test(name)) {
        message.error('证书名称存在非法字符！');
        return;
      }
      certs = certs || {};
      const pair = certs[name] || [];
      pair[suffix === 'key' ? 0 : 1] = cert;
      certs[name] = pair;
    }
    if (!certs) {
      return;
    }
    const badCert = Object.values(certs).find((list) => {
      return !list[0] || !list[1];
    });
    if (badCert) {
      message.error('上传的 key 文件和 crt 文件的不匹配，请检查后重新上传！');
      return;
    }
    return certs;
  }

  handleChange = () => {
    const input = document.getElementById('upload-input');
    const files = this.formatFiles(input.files);
    input.value = '';
    if (!files) {
      return;
    }
    const pendingList = Object.keys(files).map((name) => {
      return Promise.all(files[name].map(readFile)).then((result) => {
        files[name] = result;
      });
    });

    Promise.all(pendingList).then(async () => {
      try {
        const data = await uploadCerts(files);
        message.success('上传成功');
        this.setState(parseCerts(data));
      } catch (e) {
        message.error('上传失败，请稍后重试！');
      }
    }, () => {
      message.error('上传失败，请稍后重试！');
    });
  };

  render() {
    return (
      <div className="fill vbox cert-list">
        <div className="action-bar cert-list-bar">
          <div className="upload-wrapper">
            <input id="upload-input" type="file" accept=".crt,.key" multiple="multiple" onChange={this.handleChange} />
            <Button className="upload-btn" type="primary"><Icon type="upload" />上传证书</Button>
          </div>
        </div>
        <div className="fill p-content">
          <Table rowKey="filename" columns={this.columns} dataSource={this.state.data} pagination={false} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<CertList />, document.getElementById('root'));
