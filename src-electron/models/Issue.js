import sequelize from "./Sequelize";
const { DataTypes } = require("sequelize");

const Issue = sequelize.define("Issue", {
  issue: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Issue;
