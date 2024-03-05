

/**
 * 为 webview 提前注入一些变量与方法
 * @author: Zexus
 */

const path = require('path');
const fs = require('fs');

//  todo 待校验文件路径正确性
const configStr = fs.readFileSync(
  // path.join(__dirname, '..', 'config', 'config.json'),
  './src/config/config.json',
  'utf8'
);
const originConfig = JSON.parse(configStr);
const _keys = Object.keys(originConfig);

// 去芜存菁
const dto = _keys.reduce((ac, cu) => {
  const obj = originConfig[cu].subList.reduce((acc, cur) => {
    acc[cur.key] = cur.value;
    return acc;
  }, {});
  return { ...ac, [cu]: obj };
}, {});

// 预写入配置
window.z = {};
// 给配置工具返回的原配置，以生成表单
window.z.originConfig = originConfig;
// 给应用返回的纯净键值
window.z.config = dto;