/**
 * 监听web事件
 *
 */
const { ipcMain,app } = require("electron");
const global = require("./global");
const { wLog } = require("ggbrowser-lib-log");
const { connectMQ } = require("ggbrowser-lib-mq");
const cfg = require("./cfg");

const win = global.MAIN_SCREEN_INSTANCE;

// 写日志
ipcMain.on('writeLog', async (e, args) => {
  wLog(args.folder, args.content);
});

// 设置配置文件数据
ipcMain.on('setCfg', async (e, args) => {
  cfg.setCfg(args[0], args[1], args[2]);
});

// MQ
ipcMain.on("WEB_RLOG", async (event, data) => {
  console.error(": WEB_RLOG :");
  wLog("web", data);
});
ipcMain.on("WEB_RCFG", async (event, data) => {
  console.error(": WEB_RCFG :");
  const type = data.type;
  const key = data.key;
  const value = cfg.getCfg(type, key);
  instance.send("WEB_RCFG", value);
});

//分诊功能启用，需要开启的监听事件
ipcMain.on("MQ_OPEN", async (event, data) => {
  console.error(": MQ_OPEN :");
  // tool.wLog('app',`type:${data}`)
  // data用于区分主副屏

  const serverConfig = {
    protocol: cfg.getCfg("MQ", "protocol"),
    hostname: cfg.getCfg("MQ", "hostname"),
    port: cfg.getCfg("MQ", "port"),
    username: cfg.getCfg("MQ", "username"),
    password: cfg.getCfg("MQ", "password"),
    vhost: cfg.getCfg("MQ", "vhost"),
  };
  //获取MQ队列名
  const queueName = cfg.getCfg("MQ", "queueName");
  connectMQ(
    serverConfig,
    { queueName, reConTime: 3 },
    (res) => {
      const d = res.toString();
      wLog("app", `MQ Message:${d}`);
      global.MAIN_SCREEN_INSTANCE.send("MQ_MSG", d);
    },
    (err) => {
      console.log("err", err);
    }
  );
});

ipcMain.on("setWindow", (event, args) => {
  // 设置窗口大小
  const win = global.MAIN_SCREEN_INSTANCE;
  console.log(win)
  console.log(args);
  if(win) {
    win.setResizable(true);
    win.setContentSize(args.width, args.height);
    win.setResizable(false);
  }
});

ipcMain.on("zoomWindow", (e, args) => {
  // 缩放成悬浮窗
  const win = global.MAIN_SCREEN_INSTANCE;
  console.log(win)
  if(win) {
    win.setResizable(true);
    win.setContentSize(parseInt(args.width), parseInt(args.height));
    win.setResizable(false);
    win.setPosition(
      parseInt(win.getBounds().x + args.x),
      parseInt(win.getBounds().y + args.y)
    );
    wLog("app", "zoomWindow!");
  }
});

ipcMain.on("returnWindow", (e, args) => {
  // 还原窗口
  const win = global.MAIN_SCREEN_INSTANCE;
  console.log(win)
  if(win) {
    win.setResizable(true);
    win.setContentSize(
      Number(cfg.getCfg("主屏配置", "Dpi").split("*")[0]),
      Number(cfg.getCfg("主屏配置", "Dpi").split("*")[1])
    );
    win.setResizable(false);
    win.setPosition(
      parseInt(win.getBounds().x - args.x),
      parseInt(win.getBounds().y - args.y)
    );
    wLog("app", "returnWindow!");
  }
});

ipcMain.on('close_broswer', (e, args) => {
  global.MAIN_SCREEN_INSTANCE = null;
  app.exit(0);
});

ipcMain.on('min_broswer', (e, args) => {
  const win = global.MAIN_SCREEN_INSTANCE;
  if (win) win.minimize();
});

// 有条件开启
if (cfg.getCfg("softcall配置", "absorb_enable")) {
  ipcMain.on("leave", (e, _) => {
    console.log("leave!");
    let newBounds = win.getBounds();
    if (absorbed) {
      if (absorbed && newBounds.y <= 10) {
        win.setPosition(win.getBounds().x, 10 - win.getBounds().height);
      } else if (absorbed && newBounds.x <= 10) {
        win.setPosition(-newBounds.width + 10, newBounds.y);
      } else {
        win.setPosition(
          screen.getPrimaryDisplay().workArea.width - 10,
          newBounds.y
        );
      }
    }
  });

  ipcMain.on("enter", (e, _) => {
    // console.log('enter!');
    let newBounds = win.getBounds();
    if (absorbed) {
      if (absorbed && newBounds.y <= 10) {
        win.setPosition(win.getBounds().x, 0);
        // win.setAlwaysOnTop(false)
      } else if (absorbed && newBounds.x <= 10) {
        win.setPosition(0, newBounds.y);
      } else {
        win.setPosition(
          screen.getPrimaryDisplay().workArea.width - newBounds.width,
          newBounds.y
        );
      }
    }
  });

  ipcMain.on("restore", (e, _) => {
    win.setPosition(win.getBounds().x, 11);
    win.setAlwaysOnTop(false);
  });

  ipcMain.on("hide", (e, _) => {
    win.hide();
    setTimeout(() => {
      win.show();
    }, 1500);
  });
}

ipcMain.on('oprate_child_process', (e, msg) => {
  // const msg = 'taskkill /f /im WindowMessageWebSocket.exe'
  const exec = require('child_process').exec;
  // 执行命令
  exec(msg, {timeout:0},(error, stdout, stderr) => {
    if (error) {
      wLog('app', `执行命令时发生错误： ${error.message}`);
      return;
    }
    if (stderr) {
      wLog('app', `命令输出错误： ${stderr}`);
      return;
    }
    wLog('app', `批处理文件已成功执行 good!`);
    wLog('app', `批处理命令${msg}`);
  });
});
