import { $, create, append } from "../lyra/lyra-module.js";

(async () => {
  // 반찬 목록 불러오기
  const banchanTypes = await fetch("./db/types.json").then((res) => res.text()).then((text) => JSON.parse(text));
  const banchans = await fetch("./db/banchans.json").then((res) => res.text()).then((text) => JSON.parse(text));

  // 장바구니 개체 초기화
  let list = {};
  const listDiv = $(".list-body");
  const cost = $("span#cost-total");
  const rep = $("#report");
  const repList = $("#report-list");
  const repCost = $("#report-cost");
  const btnRep = $("#button-report");
  const btnRepClose = $("button.close", rep);
  btnRep.addEventListener("click", () => rep.style["display"] = "grid");
  btnRepClose.addEventListener("click", () => rep.style["display"] = "none");

  // 수량 조절 모달 기능 초기화
  const quantModal = $("#modal-quantity");
  const quantModalName = $("span.name", quantModal);
  const quantModalBtnMinus = $("button.minus", quantModal);
  const quantModalBtnPlus = $("button.plus", quantModal);
  const quantModalInput = $("input[type=number].input", quantModal);
  $("button.close", quantModal).addEventListener("click", () => quantModal.style["display"] = "none");
  quantModal.addEventListener("click", (e) => { if (e.target === quantModal) quantModal.style["display"] = "none"; });

  // 장바구니 초기화 기능 초기화
  const btnReset = $("#button-reset");
  btnReset.addEventListener("click", () => { for (const key in list) removeBanchan(key); });

  // 장바구니에 생성할 반찬 개체 클래스 정리
  class BanchanDiv {
    constructor(type, quantity = 1) {
      if (typeof banchans[type] === "undefined") throw Error("Banchan type error");

      this.data = banchans[type];
      this.quantity = quantity;
      this.price = this.data.price * this.quantity;

      this.nodes = {};
      this.nodes.main = create("div", { classes: [ "item" ] });

      this.nodes.remove = append(create("div", { classes: [ "remove" ] }), this.nodes.main);
      this.nodes.removeButton = append(create("button", { classes: [ "bg-red" ], properties: { innerHTML: `<div class="i i-trash-white"></div>` },
        events: { click: () => removeBanchan(type) } }), this.nodes.remove);

      this.nodes.thumb = append(create("div", { classes: [ "thumb" ] }), this.nodes.main);
      this.nodes.thumbImage = append(create("img", {
        properties: {
          "src": (this.data.thumbnail && (this.data.thumbnail.length > 0)) ? `${this.data.thumbnail}` : "./db/thumbnails/transparent.svg"
        }
      }), this.nodes.thumb);

      this.nodes.left = append(create("div", { classes: [ "left" ] }), this.nodes.main);
      this.nodes.name = append(create("h1", { properties: { innerText: `${this.data.name}` } }), this.nodes.left);
      this.nodes.priceOrigin = append(create("p", { properties: { innerText: `개당 ${this.data.price.toLocaleString("ko-KR")}원` } }), this.nodes.left);

      this.nodes.right = append(create("div", { classes: [ "right" ] }), this.nodes.main);
      this.nodes.quantity = append(create("h3"), this.nodes.right);
      this.nodes.price = append(create("h3"), this.nodes.right);

      this.nodes.report = append(create("div", { classes: [ "item" ], properties: { innerHTML: `<p>${this.data.name}</p>` } }), repList);
      this.nodes.reportQuantity = append(create("p"), this.nodes.report);
      this.nodes.reportPrice = append(create("p"), this.nodes.report);

      this.nodes.main.addEventListener("click", (e) => {
        if (e.target !== this.nodes.main) return;

        quantModalName.innerText = this.data.name;
        quantModalInput.value = this.quantity;

        quantModalBtnMinus.onclick = () => {
          const i = parseInt(quantModalInput.value) - 1;
          quantModalInput.value = i;
          this.setQuantity(i);
        };
        quantModalBtnPlus.onclick = () => {
          const i = parseInt(quantModalInput.value) + 1;
          quantModalInput.value = i;
          this.setQuantity(i);
        };

        quantModal.style["display"] = "grid";
      });
      
      this.setQuantity(this.quantity);
      append(this.nodes.main, listDiv);
      return this;
    };

    setQuantity(i) {
      this.quantity = i;
      this.price = this.data.price * this.quantity;

      this.nodes.quantity.innerText = `수량: ${this.quantity}개`;
      this.nodes.price.innerText = `${this.price.toLocaleString("ko-KR")}원`;

      this.nodes.reportQuantity.innerText = `${this.quantity}개`;
      this.nodes.reportPrice.innerText = `${this.price.toLocaleString("ko-KR")}원`;
      refreshCost();
    };
  };

  // 장바구니 조작 함수
  const addBanchan = (type, quantity) => {
    if (typeof banchans[type] === "undefined") throw Error("Banchan type error");

    if (list[type]) {
      list[type].setQuantity(list[type].quantity + 1);
    } else {
      const banchan = new BanchanDiv(type, quantity);
      list[type] = banchan;
    };

    const counter = $("h1.count", $(`#banchan-${type}`));
    counter.style["display"] = "inline";
    counter.innerText = `${list[type].quantity}개`;
    refreshCost();
  };
  const removeBanchan = (type) => {
    if (typeof banchans[type] === "undefined") throw Error("Banchan type error");
    if (typeof list[type] === "undefined") return;

    list[type].nodes.main.remove();
    list[type].nodes.report.remove();
    delete list[type];

    $("h1.count", $(`#banchan-${type}`)).style["display"] = "none";
    refreshCost();
  };
  const refreshCost = () => {
    const totalCost = Object.values(list).map((x) => x.price).reduce((a, b) => a + b, 0);
    cost.innerText = totalCost.toLocaleString("ko-KR");
    repCost.innerText = totalCost.toLocaleString("ko-KR");
  };

  // 반찬 목록 초기화
  const $menu = $("section#menuboard");
  const $menulist = $(".list", $menu);
  const $btnMemuOpen = $("#button-menu-open");
  const $btnMenuClose = $("button.close", $menu);
  const menus = Object.keys(banchanTypes).map((x) => Object.fromEntries([ [ "key", x ], [ "name", banchanTypes[x].name ], [ "banchans", Object.values(banchans).filter((y) => y.type === x) ] ]));
  $btnMemuOpen.addEventListener("click", () => $menu.style["display"] = "grid");
  $btnMenuClose.addEventListener("click", () => $menu.style["display"] = "none");
  for (const item of menus) {
    append(create("h3", { properties: { innerText: item.name } }), $menulist);
    for (const banchan of item.banchans) {
      const banchanDiv = create("div", { id: `banchan-${banchan.key}`, classes: [ "item" ] });
      append(create("div", {
        classes: [ "thumb" ],
        properties: {
          innerHTML: `<img src="${(banchan.thumbnail && (banchan.thumbnail.length > 0)) ? banchan.thumbnail : "./db/thumbnails/transparent.svg"}" loading="lazy" alt="${banchan.name}"></img>`
        }
      }), banchanDiv);
      append(create("div", {
        classes: [ "left" ],
        properties: {
          innerHTML: `<h1>${banchan.name}</h1><br>` +
            `<p>개당 ${banchan.price.toLocaleString("ko-KR")}원</p>`
        }
      }), banchanDiv);
      append(create("div", {
        classes: [ "right" ],
        properties: {
          innerHTML: `<h1 class="count" style="display: none;"></h1>`
        }
      }), banchanDiv);

      banchanDiv.addEventListener("click", () => {
        addBanchan(banchan.key, 1);
      });
      append(banchanDiv, $menulist);
    };
  };

  // 기록 기능용 함수
  const getDate = () => moment().format("YYYY년 MM월 DD일");
  const initStorage = () => {
    if (localStorage.getItem("history") === null || localStorage.getItem("history") === "undefined") localStorage.setItem("history", "{}");
  };
  const initHistoryToday = () => {
    initStorage();
    const history = JSON.parse(localStorage.getItem("history"));
    const date = getDate();
    if (typeof history[date] === "undefined" || history[date] === "undefined") {
      history[date] = [];
      localStorage.setItem("history", JSON.stringify(history));
    };
  };
  const saveHistoryToday = () => {
    initHistoryToday();
    const history = JSON.parse(localStorage.getItem("history"));
    const date = getDate();
    const today = history[date];

    const res = [ Date.now(), Object.values(list).map((x) => [ x.data.key, x.data.price, x.quantity, x.price ]) ];
    today.push(res);
    localStorage.setItem("history", JSON.stringify(history));
  };
  const refreshHistory = () => {
    initHistoryToday();
    const raw = JSON.parse(localStorage.getItem("history"));
    const history = Object.keys(raw).map((x) => [ x, raw[x] ]).sort((a, b) => a < b);
    for (const node of histlist.childNodes) node.remove();

    for (const item of history) {
      const histdiv = append(create("div", { classes: [ "item" ], properties: { innerHTML: `<h1>${item[0]}</h1>` } }), histlist);
      const dateTotal = item[1].map((x) => x[1].map((y) => y[3]).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
      append(create("h3", { properties: { innerText: `이 날 판매총액: ${dateTotal.toLocaleString("ko-KR")}원` } }), histdiv);

      const histsubdiv = append(create("div", { classes: [ "subitem" ], properties: { innerHTML: `<h3>상세 내역</h3>` } }), histdiv);
      for (const recs of item[1]) {
        const time = moment(recs[0]).format("HH시 mm분 ss초");
        const indivReceipts = append(create("div", {
          classes: [ "item" ],
          properties: {
            innerText: `${time}: ${recs[1].map((x) => x[3]).reduce((a, b) => a + b, 0).toLocaleString("ko-KR")}원\n` +
              `${recs[1].map((x) => `- ${banchans[x[0]].name}(${x[2]}개): ${x[3].toLocaleString("ko-KR")}원`).join("\n")}`
          }
        }), histsubdiv);
      };
    };
  };

  // 기록 저장 기능 초기화
  const histarea = $("#history");
  const histlist = $(".list", histarea);
  const btnHistarea = $("#button-history");
  const btnHistareaClose = $("button.close", histarea);
  btnHistarea.addEventListener("click", () => {
    histarea.style["display"] = "grid";
    refreshHistory();
  });
  btnHistareaClose.addEventListener("click", () => histarea.style["display"] = "none");

  const saveModal = $("#modal-save");
  const btnSaveOpen = $("#button-save");
  const btnSaveDo = $("button.save", saveModal);
  const btnSaveCancel = $("button.cancel", saveModal);
  btnSaveOpen.addEventListener("click", () => saveModal.style["display"] = "grid");
  btnSaveDo.addEventListener("click", () => {
    saveHistoryToday();
    for (const key in list) removeBanchan(key);
    saveModal.style["display"] = "none";
  });
  btnSaveCancel.addEventListener("click", () => saveModal.style["display"] = "none");

  // 테스트용
  // addBanchan("ggaennip", 2);
  // addBanchan("sikhye", 3);

  // 로컬 저장소 초기화
  initHistoryToday();
})();