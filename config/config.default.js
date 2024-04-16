const path = require('path');

module.exports = appInfo => {
  const config = {};

  // 应用密钥
  config.keys = appInfo.name + '_1712889937342_3151';

  // 数据库配置
  config.sequelize = {
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'walletDB',
    password: 'Togekiss123',
    timezone: '+08:00',
    dialectOptions: {
      useUTC: false,
      timezone: '+08:00',
    },
  };

  // 视图配置
  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.html': 'nunjucks',
    },
  };

  // 安全配置
  config.security = {
    csrf: {
      enable: true,
      ignoreJSON: false,
    },
  };

  // 静态文件服务配置
  config.static = {
    prefix: '/',
    dir: path.join(appInfo.baseDir, 'app/public'),
    dynamic: true,
    preload: false,
  };

  // 中间件配置
  config.middleware = [];

  return config;
};
