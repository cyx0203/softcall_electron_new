const cfg = require('../cfg');
const { wLog } = require("ggbrowser-lib-log");
let global = require('../global');
const path = require('path');
const WS = require('./server');
const { app, ipcMain, screen } = require('electron');
const exec = require('child_process').exec
const GetMac = require('getmac').default;
let absorbed = false;
let status = 'leave';

const softcall = () => {
  const win = global.MAIN_SCREEN_INSTANCE;
  win.setResizable(false);

  

    if (cfg.getCfg('softcall配置','idDev')==='') {
      //获取当前设备的MAC地址
      const pcMac = GetMac();
      wLog('app', `softcall_idDev auto get mac=${pcMac}`,'debug');
      cfg.setCfg('softcall配置', 'idDev', pcMac);
    }

    if (cfg.getCfg('MQ','queueName') === '') {
      //获取当前设备的MAC地址
      const pcMac = GetMac();
      wLog('app', `softcall_queueName auto get mac=${pcMac}`,'debug');
      cfg.setCfg('MQ', 'queueName', pcMac);
    }


    if(cfg.getCfg('softcall配置','absorb_enable')){
      absorb2();

      // 判断系统位数，导入不同动态库
      const arch = process.arch;
      let WebWindowMessage = '';
      if (arch === 'x64') {
        WebWindowMessage = require('../node/WebWindowMessage_64.node');
        wLog('app','动态库加载成功!')
      } else {
        WebWindowMessage = require('../node/WebWindowMessage.node');
      }
      setInterval(()=>{
        var msg = WebWindowMessage.GetWindowMessage("React App")
        softcallFunc(msg)
        // console.log('msg--->', msg)
      },300)
      // 页面加载后启动exe服务
      win.webContents.on('dom-ready',(e)=>{
        wLog('app',`dom已加载`)

        // const path2 = path.join(app.getAppPath(),'src/webapp/WebWindowMessage/WindowMessageWebSocket.exe') // 测试用
        // const path2 = path.join(app.getPath('exe'),'..','src/webapp/WebWindowMessage/WindowMessageWebSocket.exe') // 打包用
      
        // wLog('app',path2,'debug')

        // 带参数指令
        // const cmdStr = path2+' -v'
        // exec(cmdStr,{cwd:path2})

          // exec(path2,{ timeout:1000 },function(error,stdout, stderr) {
          //   if (error) {
          //     wLog('app', `执行命令时发生错误： ${error.message}`);
          //     return;
          //   }
          //   if (stderr) {
          //     wLog('app', `命令输出错误： ${stderr}`);
          //     return;
          //   }
          //   wLog("app","exe启动成功!")
          // })
      })

      // WS.startSocket();
    }

};

const softcallFunc=(data)=>{
    let _data = JSON.parse(data);
    if(!(_data && _data.window && _data.mouse)){
      return;
    }
    // console.log(_data);
    // wLog('app',_data.mouse);
    // wLog('app',_data.window);
    let mouse = _data.mouse;
    let mywindow = _data.window;

    if (
      mywindow&&
      mywindow.hasOwnProperty('left')&&
      mouse.x >= mywindow.left &&
      mouse.x <= mywindow.right &&
      mouse.y >= mywindow.top &&
      mouse.y <= mywindow.bottom
    ) {
      let _status = 'enter';
      if (_status !== status) {
        // 有变化才传值
        enter();
        // wLog('app','accept enter!')
        status = 'enter';
      }
    } else {
      let _status = 'leave';
      if (_status !== status) {
        // 有变化才传值
        leave();
        // wLog('app','accept leave!')
        status = 'leave';
      }
    }
}

const absorb2 = () => {
  const win = global.MAIN_SCREEN_INSTANCE;
  win.on('move', () => {
    let newBounds = win.getBounds();
    // console.log(newBounds);
    if (!absorbed && newBounds.y <= 10) {
      // 向上吸附
      win.setPosition(newBounds.x, -newBounds.height + 10);
      win.setAlwaysOnTop(true);
      win.blur();
      // win.send('absorb');
      absorbed = true;
    } else if (!absorbed && newBounds.x <= 10) {
      // 向左吸附
      win.setPosition(-newBounds.width + 10, newBounds.y);
      win.setAlwaysOnTop(true);
      win.blur();
      // win.send('absorb');
      absorbed = true;
    } else if (!absorbed && newBounds.x + newBounds.width >= screen.getPrimaryDisplay().workArea.width - 10) {
      // 向右吸附
      win.setPosition(screen.getPrimaryDisplay().workArea.width - 10, newBounds.y);
      win.setAlwaysOnTop(true);
      win.blur();
      // win.send('absorb');
      absorbed = true;
    } else if (
      newBounds.y > 10 &&
      newBounds.x > 10 &&
      newBounds.x + newBounds.width < screen.getPrimaryDisplay().workArea.width - 10
    ) {
      absorbed = false;
      win.setAlwaysOnTop(false);
    }
    // wLog('app','absorb!')
  });

  
};

const enter = () => {
  const wwin = global.MAIN_SCREEN_INSTANCE;
  if(wwin) {
    console.log('wwin:');
    // console.log(wwin.getBounds());
    let newBounds = wwin.getBounds();
  if (absorbed) {
    // wLog('app','enter!')
    if (absorbed && newBounds.y <= 10) {
      wwin.setPosition(wwin.getBounds().x, 0);
    } else if (absorbed && newBounds.x <= 10) {
      wwin.setPosition(0, newBounds.y);
    } else {
      wwin.setPosition(screen.getPrimaryDisplay().workArea.width - newBounds.width, newBounds.y);
    }
  }
  }
  
};

const leave = () => {
  const wwin = global.MAIN_SCREEN_INSTANCE;
  if(wwin) {
    let newBounds = wwin.getBounds();
  if (absorbed) {
    // wLog('app','leave!')
    if (absorbed && newBounds.y <= 10) {
      wwin.setPosition(wwin.getBounds().x, 10 - wwin.getBounds().height);
    } else if (absorbed && newBounds.x <= 10) {
      wwin.setPosition(-newBounds.width + 10, newBounds.y);
    } else {
      wwin.setPosition(screen.getPrimaryDisplay().workArea.width - 10, newBounds.y);
    }
  }
  }
  
};

module.exports = {
  softcall,
  leave,
  enter,
};
