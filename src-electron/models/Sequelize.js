const { Sequelize } = require("sequelize");
import SQLite from "sqlite3";

// 创建 Sequelize 实例并指定数据库连接配置
const sequelize = new Sequelize({
  dialect: "sqlite", // 指定数据库类型，可以根据您的需求选择其他类型
  storage: "./database.sqlite", // SQLite 数据库文件路径
  dialectOptions: {
    // 你的 sqlite3 参数
    // 下面是配置数据库打开模式的示例:
    mode: SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE | SQLite.OPEN_FULLMUTEX,
  },
  logging: false,
});

export default sequelize;
