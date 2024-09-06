import { $, create, append } from "../lyra/lyra-module.js";

(async () => {
  // 반찬 목록 불러오기
  const banchanTypes = await fetch("./db/types.json").then((res) => res.text()).then((text) => JSON.parse(text));
  const banchans = await fetch("./db/banchans.json").then((res) => res.text()).then((text) => JSON.parse(text));

  // 장바구니 개체 초기화
  let list = {};
  const listDiv = $(".list-body");
  const cost = $("span#cost-total");

  // 수량 조절 모달 기능 초기화
  const quantModal = $("#modal-quantity");
  const quantModalName = $("span.name", quantModal);
  const quantModalBtnMinus = $("button.minus", quantModal);
  const quantModalBtnPlus = $("button.plus", quantModal);
  const quantModalInput = $("input[type=number].input", quantModal);
  $("button.close", quantModal).addEventListener("click", () => quantModal.style["display"] = "none");
  quantModal.addEventListener("click", (e) => { if (e.target === quantModal) quantModal.style["display"] = "none"; });

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
      this.nodes.thumbImage = append(create("img", { properties: { "src": `${this.data.thumbnail}` } }), this.nodes.thumb);

      this.nodes.left = append(create("div", { classes: [ "left" ] }), this.nodes.main);
      this.nodes.name = append(create("h1", { properties: { innerText: `${this.data.name}` } }), this.nodes.left);
      this.nodes.priceOrigin = append(create("p", { properties: { innerText: `개당 ${this.data.price.toLocaleString("ko-KR")}원` } }), this.nodes.left);

      this.nodes.right = append(create("div", { classes: [ "right" ] }), this.nodes.main);
      this.nodes.quantity = append(create("h3"), this.nodes.right);
      this.nodes.price = append(create("h3"), this.nodes.right);

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
      this.nodes.price.innerText = `${(this.data.price * this.quantity).toLocaleString("ko-KR")}원`;
      refreshCost();
    };
  };

  // 장바구니 조작 함수
  const addBanchan = (type, quantity) => {
    if (typeof banchans[type] === "undefined") throw Error("Banchan type error");

    const banchan = new BanchanDiv(type, quantity);
    list[type] = banchan;
    refreshCost();
  };
  const removeBanchan = (type) => {
    if (typeof banchans[type] === "undefined") throw Error("Banchan type error");
    if (typeof list[type] === "undefined") return;

    list[type].nodes.main.remove();
    delete list[type];
    refreshCost();
  };
  const refreshCost = () => {
    const totalCost = Object.values(list).map((x) => x.price).reduce((a, b) => a + b, 0);
    cost.innerText = totalCost.toLocaleString("ko-KR");
  };

  // 초기화
  addBanchan("dongtae", 3);
  addBanchan("samsaek", 2);
})();