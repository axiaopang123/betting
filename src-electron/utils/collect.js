import { ipcMain } from "electron";
import Issue from "../models/Issue";

const { api } = require("./axios");

async function fetchData(page = 1) {
  let result = { total: 0, data: [], over: false, page };
  const res = await api.post(
    "https://yuce777.com/Mobile/Indexs/myOpens/type/2/pz/35/page/" + page,
    {},
    {
      headers: { Referer: "https://yuce777.com/" },
    }
  );
  if (res.data) {
    for (let index = 0; index < res.data.length; index++) {
      const item = res.data[index];
      const data = {
        issue: item.section,
        number: item.middleCode,
      };
      const [issue, created] = await insert(data);
      if (created) {
        result.total++;
        result.data.push(issue);
      }
    }
  } else {
    result.over = true;
  }

  return result;
}

function insert(data) {
  return Issue.findOrCreate({
    where: { issue: data.issue },
    defaults: data,
  });
}

export class Collect {
  /**
   *
   * @param {Electron.WebContents} web
   */
  constructor(web) {
    this.web = web;
    this.cancel = false;
    this.started = false;
  }
  async start(page = 1) {
    if (this.cancel) {
      this.cancel = false;
      this.changeStatus(false);
      return;
    }
    this.changeStatus(true);
    const res = await fetchData(page);
    this.web.send("collectData", res);

    if (!res.over) {
      this.start(page * 1 + 1);
    }
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
          resolve(true);
        }
      }, 10);
    });
  }

  changeStatus(status) {
    this.started = status;
    this.web.send("collectStatus", status);
  }
}

ipcMain.handle("collect", async (e, page = 1) => {
  if (!e.sender.collect) {
    e.sender.collect = new Collect(e.sender);
    e.sender.collect.start(page);
  } else {
    await e.sender.collect.stop();
    e.sender.collect = undefined;
  }
});

ipcMain.handle("collectStatus", async (e) => {
  return !!e.sender.collect && e.sender.collect.started;
});

ipcMain.handle("collectTotal", async (e) => {
  return Issue.count();
});
