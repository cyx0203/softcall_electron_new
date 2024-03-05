const { app, BrowserWindow, Menu, globalShortcut,ipcRenderer,ipcMain } = require('electron')
const path = require('path')
const cfg = require('./src/js/cfg');
const appInit = require('./src/js/app');
let global = require('./src/js/global');
const { setSystemTray, openCFG } = require("ggbrowser-lib-tray");
const { creatMainWindow } = require("ggbrowser-lib-screen");
const { setSingle } = require("ggbrowser-lib-single-application");
const { softcall } = require('./src/js/softcall/softcall');
const { wLog } = require("ggbrowser-lib-log");
const { connectMQ } = require('ggbrowser-lib-mq');

// 注入监听事件
require("./src/js/eventOn");
/**
 * 这里给你提供了热加载功能
 */
// try {
//   require('electron-reloader')(module, {});
// } catch (_) {
// }


// 单应用，此方法要放在ready之前
// setSingle();

// ready前加载一些内容
appInit.appinit();

// 窗口实例
let loginWin = null;
// 托盘实例
let tray = null;

// 窗口，托盘设置
const createWindow = () => {
  loginWin = new creatMainWindow(global.JSON_CFG, {
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js')
    }
  });

  // 保存到全局使用
  global.MAIN_SCREEN_INSTANCE = loginWin;

  // 设置窗口名称
  let title = cfg.getCfg('全局设置', 'Title');
  loginWin.setTitle(title)

  // 设置系统托盘
  let trayParams = {
    win: loginWin,
    // 托盘菜单
    menuList: [
      {
        label: '打开配置工具',
        loadFile: './src/html/editor/index.html',
        preloadUrl: path.resolve(__dirname, './preload.js'),
        saveCfgJsonUrl: './src/config/config.json',
      },
      { label: '显示窗口', role: 'showScreen' },
      { label: '最小化', role: 'minimize' },
      { label: '重启程序', role: 'restart' },
      { label: '退出', role: 'exit' },
    ],
    trayImgUrl: './src/assets/tray.png',
    toolTip: title,
  }

  // setSystemTray会返回一个托盘实例，也可不接收
  tray = setSystemTray(trayParams, (res) => {
    // 托盘菜单提供点击回调
    console.log('托盘回调==', res);
  })

  // 热键监听
  const getHotKey = cfg.getCfg('全局设置', 'ShortcutKey')
  globalShortcut.register(getHotKey, () => {
    openCFG({
      loadFile: './src/html/editor/index.html',
      preloadUrl: path.resolve(__dirname, './preload.js'),
      saveCfgJsonUrl: './src/config/config.json',
    });
  })

  // 窗口要关闭的时候触发
  loginWin.on('close', (event) => {
    // 阻止【关闭】这个事件，变为隐藏
    event.preventDefault();
    loginWin.hide();
  })
}


// 禁用当前应用程序的硬件加速。
// 这个方法只能在应用程序准备就绪（ready）之前调用。
// app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// app初始化
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // 软呼叫
    softcall();
})
