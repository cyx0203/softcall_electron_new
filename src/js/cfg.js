const fs = require('fs');
const jsonCfgFilePath = 'src/config/config.json';
let global = require('./global.js');
const { wLog } = require("ggbrowser-lib-log");

class cfg {
  constructor() {
  }

  //注入JSON配置文件数据内容
  static injectCfgFile() {
    let extCFG = fs.readFileSync(jsonCfgFilePath);
    extCFG = JSON.parse(extCFG.toString());
    global.JSON_CFG = extCFG;
    wLog('app', `injectCfgFileJSON配置注入`);
  }

  /**
   * 获取JSON配置文件的结点数据
   * @param {*} typeKey ……分类结点的key
   * @param {*} itemKey ……具体子结点的key
   * @returns ……具体配置的数据内容
   */
  static getCfg(typeKey, itemKey) {
    if (!global.JSON_CFG) {
      wLog('app', `${ typeKey }--${ itemKey }--getCfg全局JSON数据未获取到`);
      return;
    }
    try {
      const itemsDt = [...global.JSON_CFG[typeKey].subList]
      let obj = itemsDt.find(t => t.key === itemKey);
      return obj.value;
    } catch (e) {
      wLog('app', `getCfg失败--${ typeKey }--${ itemKey }--`);
    }
  }

  static setCfg(typeKey, itemKey, itemValue) {
    if (!global.JSON_CFG) {
      console.error('全局JSON数据未获取到');
      wLog('app', `${ typeKey }--${ itemKey }--setCfg全局JSON数据未获取到`);
      return;
    }
    try {
      let data = global.JSON_CFG;
      let itemsDt = [...global.JSON_CFG[typeKey].subList]
      let findIndex = itemsDt.findIndex(t => t.key === itemKey);
      if (findIndex >= 0) {
        itemsDt[findIndex] = {
          ...itemsDt[findIndex],
          value: itemValue
        }
        data[typeKey].subList = itemsDt;

        // 更新全局json
        global.JSON_CFG = data;

        const content = JSON.stringify(data, null, '\t');
        const options = { encoding: 'utf-8' };
        const cfgPath = `${ process.cwd() }/${ jsonCfgFilePath }`;
        fs.writeFileSync(cfgPath, content, options, err => {
          if (err) {
            wLog('app', `setCfg:写配置文件时出错`);
          }
        });
      }
    } catch (e) {
      wLog('app', `setCfg失败--${ typeKey }--${ itemKey }--${ itemValue-- }`);
    }

  }

}

module.exports = cfg;