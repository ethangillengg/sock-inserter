const port = 6009;
const keys = {
  curr: "currentSession",
  all: "allSessionIds",
};

function getSessionId() {
  const id = self.crypto.randomUUID();
  const res = `${Date.now()}-${id}`;
  console.log(res);
  return res;
}

document.addEventListener("alpine:init", () => {
  const allSessionIds = Object.keys(localStorage)
    .filter((k) => !Object.values(keys).includes(k))
    .sort()
    .reverse();
  Alpine.store(keys.all, {
    ids: allSessionIds,
    getNewSession() {
      const id = getSessionId();
      allSessionIds.push(id);

      console.log("new sess", id);
      return id;
    },
    getSessionDate(id) {
      if (!localStorage[id]) {
        return "N/A";
      }
      const { lines, date } = JSON.parse(localStorage[id]);
      if (date) {
        console.log(date);
        return new Date(date);
      }
      if (!lines) {
        return "N/A";
      }

      const lastEntry = lines[lines.length - 1];
      if (!lastEntry?.date) {
        return "N/A";
      }
      return new Date(lastEntry.date);
    },
    getSessionName(id) {
      if (!localStorage[id]) {
        return id.split("-")[1];
      }
      const sess = JSON.parse(localStorage[id]);
      const date = this.getSessionDate(id);
      const name = sess.name.length ? sess.name : id.split("-")[1];

      if (!date) {
        return name;
      }

      return `${new Date(date).toLocaleDateString()} - 「${name}」`;
    },
  });

  let id = localStorage[keys.curr];
  if (!id) {
    id = Alpine.store(keys.all).getNewSession();
    localStorage[keys.curr] = id;
  }
  const session = JSON.parse(
    localStorage[id] ??
      `{"name":"","date":${JSON.stringify(new Date())},"lines":[]}`,
  );
  console.log("initial", id, session);

  Alpine.store(keys.curr, {
    id,
    session,
    get lineCount() {
      return this.session?.lines?.length ?? 0;
    },
    get charCount() {
      return (
        this.session?.lines?.reduce((sum, item) => {
          return sum + item.text.replace(/[「」…]/g, "").length;
        }, 0) ?? 0
      );
    },

    _setSession(newValue) {
      this.session = newValue;
      localStorage[this.id] = JSON.stringify(this.session);
    },

    newSession() {
      console.log("new");
      const newId = Alpine.store(keys.all).getNewSession();
      console.log(newId);
      this.session = [];
      this.id = newId;
      localStorage[keys.curr] = newId;
      location.reload();
    },
    removeLine(id) {
      if (!id) return;
      console.log("removing", id);
      this.session.lines = this.session?.lines.filter((x) => x.id !== id);
      this._setSession(this.session);
    },
    change(event) {
      if (!event.target.value) {
        console.warn("change session event had no value");
        return;
      }
      localStorage[keys.curr] = event.target.value;
      setTimeout(() => {
        location.reload();
      }, 10);
    },
  });

  var ws = new WebSocket(`ws://localhost:${port}/`);

  ws.onopen = function () {
    document.getElementById("connection").textContent = "Connected";

    document.getElementById("connectionCircle").classList.remove("bg-red-500");
    document.getElementById("connectionCircle").classList.add("bg-green-500");
  };

  ws.onclose = function () {
    document.getElementById("connection").textContent = "Disconnected";

    document
      .getElementById("connectionCircle")
      .classList.remove("bg-green-500");
    document.getElementById("connectionCircle").classList.add("bg-red-500");
  };

  let gotFirstMessage = false;
  ws.onmessage = function (event) {
    if (!gotFirstMessage) {
      gotFirstMessage = true;
      return;
    }
    const currentSession = Alpine.store(keys.curr).session;
    if (
      !event.data ||
      event.data === currentSession.lines[currentSession.lines.length - 1]?.text
    ) {
      return;
    }
    const item = {
      id: getSessionId(),
      date: new Date(),
      text: event.data,
    };
    currentSession.lines.push(item);
    Alpine.store(keys.curr)._setSession(currentSession);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth", // Optional: Add smooth scrolling effect
  });
});
