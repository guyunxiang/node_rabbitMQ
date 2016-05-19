var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'file', filename: 'logs/log4js.log', 'maxLogSize': 2048 }
  ]
});

var logger = log4js.getLogger();

exports.info = function(msg) {
  console.log(msg);
  logger.info(msg);
}
