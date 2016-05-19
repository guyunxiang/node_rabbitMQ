var net = require('net');
var mqQueueServer = require('../queryclient/getMessageQueue');
var mqExchangeServer = require('../queryclient/sendMessageQueue');
var logger = require('../log4js');

module.exports = function() {

  logger.info("SOCKET SERVER START SUCCESSFUL! -- log4js");

  // 建立socket连接
  var server = net.createServer(function(socket) {

    // 匹配IP的正则
    var reg = /((?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d))))/g;

    // 获取客户端IP及端口号
    var
      ip = socket.remoteAddress.match(reg)[0],
      port = socket.remotePort;

    logger.info(ip + ':' + port + '，已连接服务');

    // 存放消息队列ID，指令队列ID
    var messageQueueId = null;

    // 告诉客户端连接成功！
    socket.write("Socket is Connecting !\r\n");

    // 获取到客户端消息
    socket.on('data', function(data) {
      var buffer = new Buffer(data);
      var result = buffer.toString();

      logger.info(ip + ':' + port + '，消息: ' + result);

      var params = result.split('#');

      var
        type = params[0],
        id = params[1],
        message = params[2];

      if (!id) {
        logger.info(ip + ':' + port + '，消息格式异常，id不存在。');
        socket.write('消息格式异常，请检查。');
        return false;
      }

      // 判断消息类型
      switch (type) {
        case 'init':
          messageQueueId = id;
          // 开启连接，连接队列，获取消息
          mqQueueServer.getQueueMessage(id, function(message) {

            logger.info(ip + ':' + port + '，取出队列消息：' + message);

            var resArray = [];
            for (var i = 0; i < message.length; i += 2) {
              resArray.push(parseInt(message.substring(i, i + 2), 16));
            }

            var buf = new Buffer(resArray, "ascii");
            var result = buf.toString();

            var
              regKey = /[a-zA-Z]/g,
              regValue = /=\d+/g,
              regGValue = /=[0-9]+(,\d+.\d+,\d+.\d+)/g;

            var
              keyArray = result.match(regKey),
              valueArray = result.match(regValue),
              gValueArray = result.match(regGValue);

            if (!keyArray || !valueArray || !gValueArray) {
              logger.info(ip + ':' + port + '，取出的数据格式异常，结果为：' + message);
              socket.write('数据格式异常，结果为：' + message);
              return false;
            }

            var data = {};
            for (var i = 0; i < keyArray.length; i++) {
              data[keyArray[i]] = valueArray[i].substring(1);
            }
            data[keyArray[keyArray.length - 1]] = gValueArray[0].substring(1).split(',');

            logger.info(JSON.stringify(data));
            socket.write(JSON.stringify(data));
          });
          break;
        case 'set':
          // 启动连接，发消息
          mqExchangeServer.sendQueueMessage(id, message, function(res) {
            console.log(res);
          });
          break;
        case 'get':
          // 启动连接，发消息
          mqExchangeServer.sendQueueMessage(id, message, function(res) {
            console.log(res);
          });
          break;
        case 'exit':
          // 断开连接，连接队列，获取消息
          mqExchangeServer.quitQueueMessage(id);
          break;
        default:
          logger.info(ip + ':' + port + '，指令类型异常！type=' + type);
          socket.write('指令类型异常！请确认后尝试！');
          break;
      }

    });

    socket.on('end', function() {
      logger.info(ip + ':' + port + '，服务已断开!');
    });

    socket.on('error', function(err) {
      logger.info(ip + ':' + port + '，服务连接出现错误！');
      logger.info(ip + ':' + port + '的报错信息：' + err);
    });

    socket.on('close', function() {
      mqExchangeServer.quitQueueMessage(messageQueueId);
      logger.info(ip + ':' + port + '，服务已关闭');
    });

  }).listen(3088);

}
