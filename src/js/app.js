const cfg = require('./cfg');

class init {
  constructor() {
  }

  static appinit() {
    //注入JSON配置文件的数据
    cfg.injectCfgFile();
    // const WebUrl = cfg.getCfg('主屏配置', 'WebUrl');
    // console.log('init===',WebUrl)

  }

}

module.exports = init;