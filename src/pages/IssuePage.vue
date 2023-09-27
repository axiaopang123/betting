<template>
  <q-page :style-fn="styleFn">
    <q-expansion-item
      expand-separator
      :label="`采集:(共${state.total}条数据)`"
      ref="otherRef"
      @after-hide="resize"
      @after-show="resize"
    >
      <q-card>
        <q-card-section class="flex justify-between">
          <q-input
            v-model="items.page"
            type="number"
            label="页码"
            outlined
            dense
          />
          <q-btn
            color="primary"
            unelevated
            label="开始"
            @click="collect"
            v-if="!state.status"
          />
          <q-btn color="red" unelevated label="停止" @click="collect" v-else />
        </q-card-section>
      </q-card>
    </q-expansion-item>
    <q-scroll-area
      :style="{ height: `calc(100% - ${state.height}px)` }"
      ref="scrollAreaRef"
    >
      <div class="q-pa-md">
        <div v-for="(item, index) in state.list" :key="index">
          {{ item }}
        </div>
      </div>
    </q-scroll-area>
  </q-page>
</template>

<script setup>
import { LocalStorage, dom } from "quasar";
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";

const otherRef = ref(null);
const scrollAreaRef = ref(null);
const state = reactive({
  status: false,
  list: [],
  height: 0,
  stopScroll: false,
  total: 0,
});

const items = reactive({
  page: LocalStorage.getItem("currentCollectPage") || 1,
});
watch(
  () => items.page,
  (p) => {
    LocalStorage.set("currentCollectPage", p);
  }
);

function resize() {
  nextTick(() => {
    if (!otherRef.value) {
      state.height = 0;
      return;
    }
    state.height = dom.height(otherRef.value.$el);
  });
}

function styleFn(offset) {
  return { height: offset ? `calc(100vh - ${offset}px)` : "100vh" };
}

function collect() {
  electron.invoke("collect", items.page);
}

electron.invoke("collectStatus").then((res) => (state.status = res));
electron.invoke("collectTotal").then((res) => (state.total = res));

function onCollectData(e, result) {
  items.page = result.page + 1;
  state.list.push(`第${result.page}页新增${result.total}条数据`);
  state.total += result.total;
  scrollToBottom();
}

function onChangeStatus(e, status) {
  state.status = status;
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

electron.on("collectData", onCollectData);
electron.on("collectStatus", onChangeStatus);
onMounted(() => {
  resize();
});
onUnmounted(() => {
  electron.off("collectData", onCollectData);
  electron.off("collectStatus", onChangeStatus);
});
</script>
