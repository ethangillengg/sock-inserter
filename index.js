const port = 6009;
const keys = {
  curr: "currentSession",
  all: "allSessionIds",
};

document.addEventListener("alpine:init", () => {
  const allSessionIds = JSON.parse(localStorage[keys.all] ?? "[]");
  Alpine.store(keys.all, {
    allSessionIds,
    getNewSession() {
      const id = self.crypto.randomUUID();
      allSessionIds.push(id);
      localStorage[keys.all] = JSON.stringify(allSessionIds);

      console.log("new sess", id);
      return id;
    },
  });

  let id = localStorage[keys.curr];
  if (!id) {
    id = Alpine.store(keys.all).getNewSession();
    localStorage[keys.curr] = id;
  }
  const session = JSON.parse(localStorage[id] ?? "[]");
  console.log("initial", id, session);

  Alpine.store(keys.curr, {
    id,
    session,
    get lineCount() {
      return this.session?.length ?? 0;
    },
    get charCount() {
      return (
        this.session?.reduce((sum, item) => {
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
    },
    removeLine(id) {
      if (!id) return;
      console.log("removing", id);
      this._setSession(this.session.filter((x) => x.id !== id));
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
      event.data === currentSession[currentSession.length - 1]?.text
    ) {
      return;
    }
    console.log(event.data);
    const item = {
      id: self.crypto.randomUUID(),
      date: new Date(),
      text: event.data,
    };
    currentSession.push(item);
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

// let currentSessionUUID =
//   localStorage["currentSession"] ?? self.crypto.randomUUID();
// localStorage["currentSession"] = currentSessionUUID;
//
// console.log("Resuming Session:", currentSessionUUID);
//
// function getSession(uuid = currentSessionUUID) {
//   const session = JSON.parse(localStorage[uuid]);
//   if (!session) return null;
//   return session;
// }
//
// function addToTextDiv(item) {
//   const newTextDiv = document.createElement("div");
//   newTextDiv.textContent = item.text;
//   newTextDiv.id = item.id;
//
//   const b = document.createElement("button");
//   b.classList =
//     "text-slate-500 px-2 cursor-pointer align-center hover:text-slate-200";
//   b.textContent = "x";
//   b.addEventListener("click", () => {
//     let sess = getSession().filter((x) => x.id !== item.id);
//     localStorage[currentSessionUUID] = JSON.stringify(sess);
//     const textDiv = document.getElementById(item.id);
//     textDiv.parentElement.removeChild(textDiv);
//     resetCounts();
//   });
//   // b.addEventListener();
//
//   newTextDiv.appendChild(b);
//   const textDiv = document.getElementById("text");
//   textDiv.append(newTextDiv);
//   resetCounts();
// }
//
// function resetCounts() {
//   const sess = getSession();
//   const charsCount =
//     sess?.reduce((sum, item) => {
//       return sum + item.text.replace(/[「」…]/g, "").length;
//     }, 0) ?? 0;
//   const linesCount = sess.length;
//
//   document.getElementById("sessionChars").textContent = charsCount;
//   document.getElementById("sessionLines").textContent = linesCount;
// }
//
// function resetTextDiv() {
//   if (!localStorage[currentSessionUUID]) {
//     localStorage[currentSessionUUID] = "[]";
//   }
//   const clip = JSON.parse(localStorage[currentSessionUUID]);
//   document.getElementById("text").innerHTML = "";
//   for (const item of clip) {
//     addToTextDiv(item);
//   }
//   resetCounts();
// }
//
// function startNewSession() {
//   const uuid = self.crypto.randomUUID();
//   console.log("Archiving Old Session:", currentSessionUUID);
//   console.log("Starting New Session:", uuid);
//   currentSessionUUID = uuid;
//   localStorage["currentSession"] = uuid;
//
//   resetTextDiv();
// }
//
// // window.onload(() => {
// //   window.scrollTo({
// //     top: document.body.scrollHeight,
// //     behavior: "smooth", // Optional: Add smooth scrolling effect
// //   });
// // });
//
