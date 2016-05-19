var http = require('http'),
  url = require('url'),
  amqp = require('amqp'),
  logger = require('../log4js');

// 连接消息队列
exports.sendQueueMessage = function(quid, message, callback) {

  var connection = amqp.createConnection({ host: '120.26.200.128' });

  logger.info('sendQueueMessage START');

  connection.on('ready', function() {

    var exc = connection.exchange('', { type: 'direct' });

    connection.queue(quid, { autoDelete: true, closeChannelOnUnsubscribe: true }, function(Queue) {

      logger.info('发送 ' + message + ' 到 ' + quid + ' 队列');
      exc.publish(quid, message);

      setTimeout(function() {
        connection.end();
        connection.destroy();
      }, 500);

    });

  });

};

// 断开消息队列连接
exports.quitQueueMessage = function(quid) {

  var connection = amqp.createConnection({ host: '120.26.200.128' });

  logger.info('quitQueueMessage START');

  connection.on('ready', function() {

    var exc = connection.exchange('', { type: 'direct' });

    exc.publish(quid, '00000000');

    setTimeout(function() {
      connection.end();
      connection.destroy();
    }, 500);

  });

};
