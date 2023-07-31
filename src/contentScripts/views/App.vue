<script setup lang="ts">
import { useToggle } from "@vueuse/core";
import { ref, computed } from "vue";
import "uno.css";

const enableLogger = window.location.href.includes(
  "online.bloodontheclocktower.com"
);
const [show, toggle] = useToggle(false);
const log = ref([]);

const embedListen = `function listen(fn){
  fn = fn || console.log;

  let property = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
  
  const data = property.get;

  // wrapper that replaces getter
  function lookAtMessage() {

    let socket = this.currentTarget instanceof WebSocket;

    if (!socket) {
      return data.call(this);
    }

    let msg = data.call(this);

    Object.defineProperty(this, "data", { value: msg } ); //anti-loop
    fn({ data: msg, socket:this.currentTarget, event:this });
    return msg;
  }
  
  property.get = lookAtMessage;
  
  Object.defineProperty(MessageEvent.prototype, "data", property);
}

listen( ({data}) => document.dispatchEvent(new CustomEvent('interceptOutgoingMessage', { detail: data })))`;

if (enableLogger) {
  document.documentElement.setAttribute("onreset", embedListen);
  document.documentElement.dispatchEvent(new CustomEvent("reset"));
  document.documentElement.removeAttribute("onreset");
}

// Messages we care about
const messageType = [
  "historySet",
  "distributeRoles",
  "historyPhase",
  "historyAdd",
  "updatePlayer", // { index: number, property: string, value: any }
  "signal", // night info
  "nomination",
  "marked", // maybe?
  "lock", // a vote is locked. Maybe?
  "voteInProgress",
  "reveal", // { isEvilWin: boolean, players: { role: role_id, alignment: null }[]}
];

document.addEventListener("interceptOutgoingMessage", function (e) {
  var data = e.detail;
  // Regex that can match the following patterns:
  // 42["message",{"data":"value"}]
  // 42/54773,["message",{"data":"value"},"probe"]
  data = data.replace(/^[0-9,\/]+/, "");
  if (data === "probe") return;
  try {
    const parsed = JSON.parse(data);
    console.log(parsed);
    if (messageType.includes(parsed[0])) {
      log.value.push(parsed);
    }
  } catch {
    console.log(data);
  }
});

const showLog = computed(() => [...log.value].reverse());
</script>

<template>
  <div
    class="fixed right-8 bottom-0 m-5 z-100 flex items-end font-sans select-none leading-1em"
  >
    <div
      class="bg-white text-gray-800 rounded-lg shadow w-[500px] max-h-[500px] overflow-y-scroll"
      p="x-4 y-2"
      m="y-auto r-2"
      transition="opacity duration-300"
      :class="show ? 'block' : 'hidden'"
    >
      <p v-if="log.length === 0" class="text-sm whitespace-pre italic">
        No messages yet.
      </p>
      <p class="text-sm whitespace-pre" v-for="entry in showLog">
        {{ JSON.stringify(entry, null, 4) }}
      </p>
    </div>
  </div>
  <button
    v-if="enableLogger"
    class="flex items-center justify-center w-10 h-10 rounded-full shadow cursor-pointer border-none fixed right-0 bottom-0 m-5 z-100 bg-white text-gray-800"
    @click="toggle()"
  >
    <img
      class="w-10 h-10 rounded-full"
      src="https://clocktracker.app/logo-ct-sm.png"
      alt="Clock Tracker"
    />
  </button>
</template>
