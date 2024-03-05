const { Server } = require('socket.io');
const { createServer } = require('http');
const http = require('http')
const { wLog } = require("ggbrowser-lib-log");
const global = require('../global');
const cfg = require('../cfg');
const { ipcRenderer } = require('electron')

class WS {
  static status = 'leave';
  static count = 0;

  static async startSocket() {
    const httpServer = createServer(); // socket.io的服务需要http服务做支撑
    const io = new Server(httpServer, {
      // 初始化ws
      cors: {
        //处理ws跨域问题
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', socket => {
      // 监听ws链接成功
      console.log('socket connected!');
      console.log(`connected ${++this.count}`)
      wLog('app', 'socket connected!', 'debug');
      wLog('app', `connected ${this.count}`, 'debug')

      // 软呼叫处理窗口吸附
      if (cfg.getCfg('softcall配置', 'softcall_enable')) {
        this.softcallFunc(socket);
      }
      
      socket.on('send-msg',data=>{
        console.log(`get send-msg success ${data}`);
        socket.broadcast.emit('broadcast',{type:'broadcast',data:data})
      })

      socket.conn.on('close', reason => {
        console.log(reason);
        this.count--;
        // io.close();
      });
    });


    // 检查端口是否已被监听
const portInUse = (port) => {
  return new Promise((resolve) => {
    const tester = http.createServer();

    tester.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    tester.once('listening', () => {
      tester.close();
      resolve(false);
    });

    tester.listen(port);
  });
};
// 检测端口是否已经被监听
portInUse(3000)
  .then((inUse) => {
    if (!inUse) {
      httpServer.listen(3000); // 启动http服务
    } else {
      console.log('端口已被占用');
      wLog('app','端口已被占用')
    }
  })
  .catch((error) => {
    console.error('检测端口时出错:', error);
    wLog('app',`检测端口时出错:, ${error}`)
  });
  
    // httpServer.listen(3000); // 启动http服务

    io.on('disconnected', () => {
      // io.close();
      console.log('close?!');
      this.count--;
    });

    global.MAIN_SCREEN_INSTANCE.on('close', () => {
      console.log('close!!!!!!');
      this.count--;
      io.disconnectSockets();
      io.close();
    });
  }

  static softcallFunc=(socket)=>{
    socket.on('new message', data => {
      // console.log(JSON.parse(data));
      let _data = JSON.parse(data);
      if(!(_data && _data.window && _data.mouse)){
        return;
      }
      // console.log(_data);
      // wLog('app',_data.mouse);
      // wLog('app',_data.window);
      let mouse = _data.mouse;
      let mywindow = _data.window;
      
      const { leave, enter } = require('./softcall');
      if (
        mywindow&&
        mywindow.hasOwnProperty('left')&&
        mouse.x >= mywindow.left &&
        mouse.x <= mywindow.right &&
        mouse.y >= mywindow.top &&
        mouse.y <= mywindow.bottom
      ) {
        let _status = 'enter';
        if (_status !== this.status) {
          // 有变化才传值
          enter();
          // wLog('app','accept enter!')
          this.status = 'enter';
        }
      } else {
        let _status = 'leave';
        if (_status !== this.status) {
          // 有变化才传值
          leave();
          // wLog('app','accept leave!')
          this.status = 'leave';
        }
      }
    });
  }
}

module.exports = WS;
