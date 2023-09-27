const { Op } = require("sequelize");
const { default: Issue } = require("../models/Issue");
const { ipcMain } = require("electron");

const debug = {
  begin(text = "") {
    const t = +new Date();
    this.prevTime = t;
    if (!this.beginTime) {
      this.beginTime = t;
    } else {
      console.log(`${this.text}  耗时:${t - this.prevTime}ms`);
    }
    this.text = text;
  },
  end() {
    const t = +new Date();
    console.log(`${this.text}  累计耗时:${t - this.beginTime}ms`);
    this.beginTime = undefined;
    this.prevTime = undefined;
  },
};

let allIssuesData = [];
// 加载所有数据到内存
Issue.findAll({ order: [["issue", "DESC"]] }).then((res) => {
  allIssuesData = res;
});

const odds = {
  isBigOdd: 4.27,
  isSmallEven: 4.27,
  isBigEven: 3.67,
  isSmallOdd: 3.67,
  isBig: 1.97,
  isSmall: 1.97,
  isOdd: 1.97,
  isEven: 1.97,
};

async function calcHeat(current = null) {
  const res = await countOmission(current);
  if (!res) {
    console.log("没有统计出结果");
    return false;
  }
  const single = [
    { ...res.result.isBig, key: "isBig" },
    { ...res.result.isSmall, key: "isSmall" },
    { ...res.result.isOdd, key: "isOdd" },
    { ...res.result.isEven, key: "isEven" },
  ].sort((x, y) => x.count - y.count);
  const double = [
    { ...res.result.isBigOdd, key: "isBigOdd" },
    { ...res.result.isBigEven, key: "isBigEven" },
    { ...res.result.isSmallOdd, key: "isSmallOdd" },
    { ...res.result.isSmallEven, key: "isSmallEven" },
  ].sort((x, y) => x.count - y.count);
  return { single, double, issueNo: res.issueNo };
}

/**
 * 计算遗漏次数
 * @param {string} current 当前期号
 */
async function countOmission(current = null) {
  let total = 0;
  let issueNo;
  let result = {
    isBig: { appear: false, count: 0 },
    isOdd: { appear: false, count: 0 },
    isSmall: { appear: false, count: 0 },
    isEven: { appear: false, count: 0 },
    isBigOdd: { appear: false, count: 0 },
    isBigEven: { appear: false, count: 0 },
    isSmallOdd: { appear: false, count: 0 },
    isSmallEven: { appear: false, count: 0 },
  };

  const list = await fetchIssue(1, current, 1000, current ? "DESC" : "ASC");
  // 30+ms
  if (!list) {
    console.log("没有issue");
    return false;
  }
  for (let index = 0; index < list.length; index++) {
    const item = list[index];
    if (total >= 8) {
      issueNo = item.issue;
      break;
    }
    const open = parseIssue(item.number);
    for (const key in result) {
      if (result[key].appear) {
        // 跳过已经出现的
        continue;
      }
      if (open[key]) {
        result[key].appear = true;
        total++;
      } else {
        result[key].count++;
      }
    }
  }
  if (total < 8) {
    console.log("没有计算出结果", total, result);
    return false;
  }
  return { result, issueNo };
}

/**
 *
 * @param {int} page
 * @param {string} current 当前期号
 * @param {int} limit
 * @returns
 */
async function fetchIssue(
  page = 1,
  current = null,
  limit = 100,
  soft = "DESC"
) {
  const offset = (page - 1) * limit;
  let options = { order: [["issue", soft]], offset, limit };
  if (current) {
    options.where = { issue: { [Op.lt]: current } };
  }

  const res = await Issue.findAll(options);
  // 30+ms
  if (!res) {
    console.log("没有查询到");
  }
  return res;
}

// 100+ms
async function getNextIssue(issueNo) {
  const index = allIssuesData.findIndex((v) => v.issue === issueNo);
  const issue = allIssuesData[index - 1];
  if (index === -1 || !issue) {
    return false;
  }

  // const issue = await Issue.findOne({
  //   where: { issue: { [Op.gt]: issueNo } },
  //   order: [["issue", "ASC"]],
  // });
  return issue;
}

function parseIssue(code) {
  const numbers = code.split(",").map((v) => parseInt(v));
  const sum = numbers.reduce((t, v) => t + v, 0);
  // 大
  const isBig = sum > 13;
  // 单
  const isOdd = !!(sum % 2);
  // 小
  const isSmall = !isBig;
  // 双
  const isEven = !isOdd;
  // 大单
  const isBigOdd = isBig && isOdd;
  // 大双
  const isBigEven = isBig && isEven;
  // 小单
  const isSmallOdd = isSmall && isOdd;
  // 小双
  const isSmallEven = isSmall && isEven;
  return {
    numbers,
    sum,
    isBig,
    isOdd,
    isSmall,
    isEven,
    isBigOdd,
    isBigEven,
    isSmallOdd,
    isSmallEven,
  };
}

class Betting {
  /**
   *
   * @param {Electron.WebContents} web
   */
  constructor(web) {
    this.web = web;
    this.cancel = false;
    this.started = false;
  }

  start(configs) {
    this.configs = configs;
    this.betGroupInfo = [];
    this.currentGroupInfo = null;
    this.totalBonus = 0;
    this.ruleIndex = 0;
    this.boot();
  }
  async boot() {
    if (this.cancel) {
      this.cancel = false;
      this.changeStatus(false);
      return;
    }
    this.changeStatus(true);

    if (!this.configs.issueNo) {
      // 没有期号，重新定位第一期
      const res = await calcHeat();
      if (!res) {
        this.web.send("bettingError", "没有定位到奖期，通常是没有采集数据");
        this.changeStatus(false);
        return;
      }
      this.configs.issueNo = res.issueNo;
    }
    if (!this.currentGroupInfo) {
      this.currentGroupInfo = {
        startIssue: this.configs.issueNo,
        stopIssue: "",
        bonus: 0,
        times: 0,
      };
    }

    this.currentGroupInfo.times++;

    // 查询下期
    const nextIssue = await getNextIssue(this.configs.issueNo);
    if (!nextIssue) {
      this.web.send("bettingMessage", "没有奖期了，任务中止");
      this.changeStatus(false);
      return;
    }
    if (!nextIssue.number) {
      this.web.send(
        "bettingError",
        `奖期:${nextIssue.issue},没有开奖号码，中止任务！`
      );
      this.changeStatus(false);
      return;
    }

    const res = await calcHeat(this.configs.issueNo);
    // 30+ms
    if (!res) {
      this.web.send("bettingError", "计算热度没有返回结果，中止任务！");
      this.changeStatus(false);
      return;
    }
    // 下期开奖分析
    const open = parseIssue(nextIssue.number);
    const bets = [];
    const betAmount = this.configs.amount_rule[this.ruleIndex];
    let isWin = false;
    let bonus = 0;
    for (let index = 0; index < this.configs.hotOdd.length; index++) {
      const bet = res.single[this.configs.hotOdd[index]];
      const o = open[bet.key] ? odds[bet.key] : 0;
      const b = betAmount.amount * (o - 1);
      bonus += b;
      bets.push({
        key: bet.key,
        amount: betAmount.amount,
        isWin: open[bet.key],
        bonus: b,
      });
      if (open[bet.key]) {
        isWin = true;
      }
    }
    for (let index = 0; index < this.configs.hotEven.length; index++) {
      const bet = res.double[this.configs.hotEven[index]];
      const o = open[bet.key] ? odds[bet.key] : 0;
      const b = betAmount.amount * (o - 1);
      bonus += b;
      bets.push({
        key: bet.key,
        amount: betAmount.amount,
        isWin: open[bet.key],
        bonus: b,
      });
      if (open[bet.key]) {
        isWin = true;
      }
    }
    this.totalBonus += bonus;

    this.ruleIndex = isWin ? betAmount.win.value : betAmount.lose.value;
    this.configs.issueNo = nextIssue.issue;

    // 判断输回头
    if (
      this.configs.loseReset > 0 &&
      this.totalBonus <= -this.configs.loseReset
    ) {
      this.ruleIndex = 0;
    }

    // 判断赢回头
    if (this.configs.winReset > 0 && this.totalBonus >= this.configs.winReset) {
      this.ruleIndex = 0;
    }

    // 判断输停止
    if (
      this.configs.loseStop > 0 &&
      this.totalBonus <= -this.configs.loseStop
    ) {
      this.currentGroupInfo.stopIssue = this.configs.issueNo;
      this.currentGroupInfo.bonus = this.totalBonus;
      this.betGroupInfo.unshift(this.currentGroupInfo);
      this.currentGroupInfo = null;
      this.totalBonus = 0;
      this.ruleIndex = 0;
    }
    // 判断赢停止
    if (this.configs.winStop > 0 && this.totalBonus >= this.configs.winStop) {
      this.currentGroupInfo.stopIssue = this.configs.issueNo;
      this.currentGroupInfo.bonus = this.totalBonus;
      this.betGroupInfo.unshift(this.currentGroupInfo);
      this.currentGroupInfo = null;
      this.totalBonus = 0;
      this.ruleIndex = 0;
    }
    this.web.send("bettingData", {
      bets,
      betAmount,
      issueNo: this.configs.issueNo,
      open,
      nextIssue,
      bonus,
      totalBonus: this.totalBonus,
      betGroupInfo: this.betGroupInfo,
    });

    // 速度
    if (this.configs.speed < 10) {
      this.configs.speed = 10;
    }
    await new Promise((resolve) => {
      setTimeout(() => resolve(true), this.configs.speed);
    });
    this.boot();
  }

  stop() {
    this.cancel = true;
    return new Promise((resolve, reject) => {
      let i = 0;
      const t = setInterval(() => {
        i += 10;
        if (i > 10000) {
          clearInterval(t);
          reject();
        } else if (!this.started) {
          clearInterval(t);
          this.changeStatus(false);
          resolve(true);
        }
      }, 10);
    });
  }

  changeStatus(status) {
    this.started = status;
    this.web.send("bettingStatus", { status });
  }
}

ipcMain.handle("bettingStart", async (e, configs) => {
  if (e.sender.betting && e.sender.betting.started) {
    return true;
  }
  e.sender.betting = new Betting(e.sender);
  e.sender.betting.start(configs);
});

ipcMain.handle("bettingStop", async (e) => {
  if (e.sender.betting) {
    await e.sender.betting.stop();
    e.sender.betting = undefined;
  }
});

ipcMain.handle("bettingInit", async (e) => {
  let info = { status: false };
  if (e.sender.betting) {
    info.status = e.sender.betting.started;
  }
  return info;
});

ipcMain.handle("bettingConfigs", (e, configs) => {
  if (!e.sender.betting) {
    return;
  }
  if (configs.speed) {
    e.sender.betting.configs.speed = configs.speed;
  }
});
