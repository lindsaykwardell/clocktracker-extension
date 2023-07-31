console.log("We're here!");

function listen(fn: any) {
  fn = fn || console.log;

  const property = Object.getOwnPropertyDescriptor(
    window.MessageEvent.prototype,
    "data"
  );

  const data = property?.get;

  // wrapper that replaces getter
  function lookAtMessage() {
    const socket = this.currentTarget instanceof WebSocket;

    if (!socket) return data.call(this);

    const msg = data.call(this);

    Object.defineProperty(this, "data", { value: msg }); // anti-loop
    fn({ data: msg, socket: this.currentTarget, event: this });
    return msg;
  }

  property.get = lookAtMessage;

  Object.defineProperty(window.MessageEvent.prototype, "data", property);
}

listen(({ data }) => console.log(data));
