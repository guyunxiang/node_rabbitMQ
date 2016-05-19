var http = require('http'),
  url = require('url'),
  amqp = require('amqp'),
  iconv = require('iconv-lite'),
  logger = require('../log4js');

// 获取队列消息
exports.getQueueMessage = function(quid, callback) {

  var connection = amqp.createConnection({ host: '120.26.200.128' });

  console.log(quid + ' QUEUE STARTING!');

  connection.on('ready', function() {

    connection.queue(quid, { autoDelete: true, closeChannelOnUnsubscribe: true }, function(Queue) {

      Queue.bind('#');

      Queue.subscribe(function(message, headers, deliveryInfo, messageObject) {

        var data = message.data;
        var buffer = new Buffer(data);
        var result = buffer.toString();

        // 断开连接退出
        if (result === '00000000') {
          logger.info('取消订阅 ' + quid + ' 消息队列,断开连接！');
          connection.end();
          connection.destroy();
          return false;
        }

        // 返回消息结果
        callback(result);

      });

    });

  });

};
