<template>
  <q-page :style-fn="styleFn">
    <div class="row full-height q-col-gutter-x-md">
      <div class="q-gutter-y-md col-md-5 col-sm-12">
        <div class="full-height q-pl-md q-pt-md">
          <div class="full-width">
            <div class="row q-col-gutter-x-lg">
              <div class="col">
                <q-input
                  v-model="configs.issueNo"
                  type="text"
                  label="当前期号"
                  placeholder="留空则从新开始"
                  dense
                />
              </div>
              <div class="col">
                <q-input
                  v-model.number="configs.speed"
                  type="number"
                  label="速度"
                  dense
                >
                  <template #append>
                    <q-btn color="primary" icon="speed" flat dense>
                      <q-menu>
                        <div class="q-px-md q-pt-sm">
                          <q-slider
                            v-model="configs.speed"
                            :min="10"
                            :max="10000"
                            style="width: 300px"
                            reverse
                            track-color="orange"
                            inner-track-color="primary"
                            selection-color="grey-4"
                          />
                        </div>
                      </q-menu>
                    </q-btn>
                  </template>
                </q-input>
              </div>
            </div>
          </div>
          <div class="full-width">
            <div class="row q-col-gutter-x-lg">
              <div class="col">
                <q-input
                  v-model="configs.loseReset"
                  type="number"
                  label="输回头"
                  dense
                />
              </div>
              <div class="col">
                <q-input
                  v-model="configs.winReset"
                  type="number"
                  label="赢回头"
                  dense
                />
              </div>
            </div>
          </div>
          <div class="full-width">
            <div class="row q-col-gutter-x-lg">
              <div class="col">
                <q-input
                  v-model="configs.loseStop"
                  type="number"
                  label="输停止"
                  dense
                />
              </div>
              <div class="col">
                <q-input
                  v-model="configs.winStop"
                  type="number"
                  label="赢停止"
                  dense
                />
              </div>
            </div>
          </div>
          <div>
            <div>单点</div>
            <q-option-group
              v-model="configs.hotOdd"
              :options="hotOdd.options"
              type="checkbox"
              color="primary"
              class="checkout-dense"
              inline
            />
          </div>
          <div>
            <div>组合</div>
            <q-option-group
              v-model="configs.hotEven"
              :options="hotEven.options"
              type="checkbox"
              color="primary"
              class="checkout-dense"
              inline
            />
          </div>

          <div style="height: calc(100% - 360px)">
            <div class="text-grey" v-if="!configs.amount_rule.length">
              没有添加投注金额
            </div>
            <q-scroll-area style="height: calc(100% - 52px)" v-else>
              <div
                class="row full-width"
                v-for="(item, index) in configs.amount_rule"
                :key="index"
              >
                <q-field label="序号" stack-label dense style="width: 40px">
                  <template v-slot:control>
                    <div class="self-center full-width no-outline" tabindex="0">
                      {{ index + 1 }}
                    </div>
                  </template>
                </q-field>
                <q-input
                  v-model="item.amount"
                  type="number"
                  label="投注金额"
                  dense
                  class="col"
                />
                <q-select
                  v-model="item.win"
                  :options="amount_options"
                  label="赢"
                  style="min-width: 140px"
                  dense
                >
                  <template v-slot:selected-item="scope">
                    <div class="q-gutter-x-md">
                      <span>第{{ scope.opt.value + 1 }}个</span>
                      <span v-if="scope.opt.label" class="text-green">
                        {{ scope.opt.label }}
                      </span>
                      <span class="text-negative" v-else> 金额错误 </span>
                    </div>
                  </template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section side="">
                        <q-item-label
                          >第{{ scope.opt.value + 1 }}个</q-item-label
                        >
                      </q-item-section>
                      <q-item-section>
                        <q-item-label v-if="scope.opt.label">
                          {{ scope.opt.label }}
                        </q-item-label>
                        <q-item-label class="text-negative" v-else>
                          金额错误
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <q-select
                  dense
                  v-model="item.lose"
                  :options="amount_options"
                  label="输"
                  style="min-width: 140px"
                >
                  <template v-slot:selected-item="scope">
                    <div class="q-gutter-x-md">
                      <span>第{{ scope.opt.value + 1 }}个</span>
                      <span v-if="scope.opt.label" class="text-green">
                        {{ scope.opt.label }}
                      </span>
                      <span class="text-negative" v-else> 金额错误 </span>
                    </div>
                  </template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section side="">
                        <q-item-label
                          >第{{ scope.opt.value + 1 }}个</q-item-label
                        >
                      </q-item-section>
                      <q-item-section>
                        <q-item-label v-if="scope.opt.label">
                          {{ scope.opt.label }}
                        </q-item-label>
                        <q-item-label class="text-negative" v-else>
                          金额错误
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <q-btn
                  color="red"
                  flat
                  icon="close"
                  @click="onRemoveRule(index)"
                />
              </div>
            </q-scroll-area>
            <div class="q-gutter-x-md">
              <q-btn
                class="q-mt-md"
                color="orange"
                label="导入"
                @click="importText"
                unelevated
              />
              <q-btn
                class="q-mt-md"
                color="primary"
                label="添加"
                @click="addAmount"
                unelevated
              />

              <q-btn
                class="q-mt-md"
                color="red"
                label="停止投注"
                @click="stopBetting"
                unelevated
                v-if="state.started"
                :loading="loading.stop"
              />
              <q-btn
                class="q-mt-md"
                :color="state.disableSubmit ? 'grey' : 'green'"
                label="开始投注"
                @click="startBetting"
                unelevated
                :disable="state.disableSubmit"
                v-else
              />
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-7 col-sm-12 full-height">
        <q-scroll-area style="height: 30%">
          <div class="q-pa-md q-gutter-x-lg">
            <span class="text-red">赢:{{ state.winLoseTimes.win }}次</span>
            <span class="text-green">输:{{ state.winLoseTimes.lose }}次</span>
          </div>
          <q-separator />
          <div
            v-for="(group, gi) in state.groupList"
            :key="gi"
            class="flex q-gutter-x-md q-px-md q-py-xs"
            :class="group.bonus > 0 ? 'text-red' : 'text-green'"
          >
            <div>开始期号:{{ group.startIssue }}</div>
            <div>结束期号:{{ group.stopIssue }}</div>
            <div>输赢:{{ group.bonus.toFixed(2) }}</div>
            <div>历经:{{ group.times }}期</div>
          </div>
        </q-scroll-area>
        <q-scroll-area
          class="full-width"
          style="height: 70%"
          ref="scrollAreaRef"
        >
          <div class="q-pa-md">
            <div
              v-for="(item, index) in state.list"
              :key="index"
              class="q-gutter-x-sm flex items-center"
            >
              <span class="text-grey">{{ item.issueNo }}</span>
              <q-badge color="primary" :label="item.open.isBig ? '大' : '小'" />
              <q-badge color="primary" :label="item.open.isOdd ? '单' : '双'" />
              <div style="width: 40px" class="text-center">
                {{ item.open.numbers.join() }}
              </div>
              <div style="width: 30px" class="text-center">
                {{ item.open.sum }}
              </div>
              <template v-for="(bet, bi) in item.bets" :key="bi">
                <q-badge
                  :color="bet.isWin ? 'red' : 'green'"
                  :label="labels[bet.key] + '' + bet.amount"
                />
              </template>

              <span
                :class="{
                  'text-red': item.bonus > 0,
                  'text-green': item.bonus < 0,
                }"
                class="text-caption text-right"
                style="width: 80px"
              >
                {{ item.bonus.toFixed(2) }}
              </span>
              <span
                :class="{
                  'text-red': item.totalBonus > 0,
                  'text-green': item.totalBonus < 0,
                }"
                class="text-caption text-right"
                style="width: 80px"
              >
                {{ item.totalBonus.toFixed(2) }}
              </span>
            </div>
          </div>
        </q-scroll-area>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { LocalStorage, Notify, debounce, useQuasar } from "quasar";
import { computed, onUnmounted, reactive, ref, watch } from "vue";

const $q = useQuasar();
const labels = {
  isBig: "大",
  isSmall: "小",
  isOdd: "单",
  isEven: "双",
  isBigOdd: "大单",
  isBigEven: "大双",
  isSmallOdd: "小单",
  isSmallEven: "小双",
};
const scrollAreaRef = ref(null);
const loading = ref({});
const hotOdd = reactive({
  options: [
    { label: "最热", value: 0 },
    { label: "第二热", value: 1 },
    { label: "第三热", value: 2 },
    { label: "第四热", value: 3 },
  ],
});
const hotEven = reactive({
  options: [
    { label: "最热", value: 0 },
    { label: "第二热", value: 1 },
    { label: "第三热", value: 2 },
    { label: "第四热", value: 3 },
  ],
});

const amount_options = computed(() => {
  return configs.value.amount_rule.map((v, i) => ({
    label: v.amount,
    value: i,
  }));
});

function styleFn(offset) {
  return { height: offset ? `calc(100vh - ${offset}px)` : "100vh" };
}

function importText() {
  $q.dialog({
    title: "导入方案",
    prompt: {
      model: "",
      type: "textarea", // optional
    },
    cancel: true,
    persistent: true,
  }).onOk((text) => {
    if (!text) {
      return;
    }
    let rules = text
      .split("\n")
      .map((v) => {
        const item = v.replace(/\s+/g, " ").split(" ");
        if (item.length !== 3) {
          return false;
        }
        return {
          amount: item[0],
          win: { value: item[1] - 1 },
          lose: { value: item[2] - 1 },
        };
      })
      .filter((v) => !!v);
    rules = rules.map((v) => {
      v.lose.label = rules[v.lose.value].amount;
      v.win.label = rules[v.win.value].amount;
      return v;
    });
    configs.value.amount_rule = rules;
  });
}

function addAmount() {
  configs.value.amount_rule.push({ amount: "", lose: null, win: null });
}

function onRemoveRule(index) {
  $q.dialog({ message: "确定移除吗？", cancel: "取消", ok: "确定" }).onOk(
    () => {
      configs.value.amount_rule.splice(index, 1);
    }
  );
}

function empty(val) {
  return val === null || val === void 0 || val === "";
}

const state = reactive({
  disableSubmit: computed(() => {
    if (!configs.value.hotOdd.length && !configs.value.hotEven.length) {
      return true;
    }
    const hasEmpty = configs.value.amount_rule.find(
      (v) => v.amount === "" || empty(v.lose) || empty(v.win)
    );
    if (!configs.value.amount_rule.length || hasEmpty) {
      return true;
    }
    return false;
  }),
  started: false,
  list: [],
  groupList: [],
  importText: "",
  winLoseTimes: computed(() => {
    let times = { win: 0, lose: 0 };
    for (let index = 0; index < state.groupList.length; index++) {
      const el = state.groupList[index];
      if (el.bonus > 0) {
        times.win++;
      } else {
        times.lose++;
      }
    }
    return times;
  }),
});

const configs = ref(
  LocalStorage.getItem("bettingConfigs") || {
    issueNo: "",
    speed: 1000,
    loseReset: "",
    winReset: "",
    loseStop: "",
    winStop: "",
    hotOdd: [],
    hotEven: [],
    amount_rule: [],
  }
);

watch(configs, (v) => changeConfigs(v), { deep: true });

const changeConfigs = debounce((v) => {
  for (let index = 0; index < v.amount_rule.length; index++) {
    const rule = v.amount_rule[index];
    if (rule.lose && !v.amount_rule[rule.lose.value]) {
      rule.lose = null;
    }
    if (rule.win && !v.amount_rule[rule.win.value]) {
      rule.win = null;
    }
  }
  if (v.speed < 10) {
    v.speed = 10;
  }
  LocalStorage.set("bettingConfigs", v);
  electron.invoke("bettingConfigs", { speed: v.speed });
}, 300);

function startBetting() {
  if (state.speed < 10) {
    Dialog.create({
      message: "速度过快，输入大于等于10的数字",
    });
    return;
  }
  electron.invoke("bettingStart", JSON.parse(JSON.stringify(configs.value)));
}
async function stopBetting() {
  loading.value.stop = true;
  await electron.invoke("bettingStop");
  loading.value.stop = false;
}
function onBettingData(e, data) {
  // console.log("onBettingData", data);
  configs.value.issueNo = data.issueNo;
  state.list.unshift(data);
  if (state.list.length > 100) {
    state.list.pop();
  }
  state.groupList = data.betGroupInfo.reverse();
  // scrollToBottom();
}

function onChangeConfigs(e, val) {
  configs.value.issueNo = val.issueNo;
}

function onBettingStatus(e, res) {
  state.started = res.status;
}
function scrollToBottom() {
  if (scrollAreaRef.value) {
    const scr = scrollAreaRef.value.getScroll();
    const per = scrollAreaRef.value.getScrollPercentage();

    if (per.top == 1) {
      state.stopScroll = false;
    } else if (per.top > 0 && per.top < 1) {
      state.stopScroll = true;
    }
    if (
      !state.stopScroll &&
      scr.verticalSize > scr.verticalContainerSize &&
      (per.top == 1 || per.top == 0)
    ) {
      scrollAreaRef.value.setScrollPercentage("vertical", 100, 100);
    }
  }
}

function onMessage(e, message) {
  Notify.create({
    message,
    type: "positive",
  });
}

function onError(e, message) {
  Notify.create({
    message,
    type: "negative",
  });
}

electron.invoke("bettingInit").then((res) => {
  state.started = res.status;
});
electron.on("bettingData", onBettingData);
electron.on("bettingStatus", onBettingStatus);
electron.on("bettingError", onError);
electron.on("bettingMessage", onMessage);
electron.on("bettingConfigs", onChangeConfigs);
onUnmounted(() => {
  electron.off("bettingData", onBettingData);
  electron.off("bettingStatus", onBettingStatus);
  electron.off("bettingError", onError);
  electron.off("bettingMessage", onMessage);
  electron.off("bettingConfigs", onChangeConfigs);
});
</script>

<style lang="scss">
.checkout-dense > div:first-child {
  margin-left: 0;
}
</style>
