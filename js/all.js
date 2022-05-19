const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
const cartTable = document.querySelector(".shoppingCart-table");
let productData = [];
let cartData = [];

function init() {
  getProductList();
  getCartList();
  validatorPackage();
}

init();

productSelect.addEventListener("change", function () {
  renderProductList(productSelect.value);
});

function getProductList() {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/products`;
  axios
    .get(url)
    .then(function (response) {
      productData = response.data.products;
      renderProductList();
    })
    .catch(function (error) {
      console.log(error.response.data);
    });
}

function renderProductList(selectValue) {
  let dropDownData = productData.filter((item) => {
    if (selectValue == undefined || selectValue == "全部") {
      return item;
    }
    if (selectValue == item.category) {
      return item;
    }
  });

  let str = "";
  dropDownData.forEach((item) => {
    str += `
        <li class="productCard">
            <h4 class="productType">新品</h4>
            <img src="${item.images}"
                alt="">
            <div class="numGroup">
                <label class="labelNum" for="number">選擇數量</label>
                <input type="number" value="1" id="number" class="selectNum" placeholder="數量" min="1">
            </div>
            <a href="#" class="addCardBtn" data-productid="${
              item.id
            }" data-productname="${item.title}">加入購物車</a>
            <h3>${item.title}</h3>
            <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
            <p class="nowPrice">NT$${toThousands(item.price)}</p>
        </li>
        `;
  });
  productList.innerHTML = str;
}

productList.addEventListener("click", function (e) {
  e.preventDefault();
  let cartBtn = e.target.nodeName;
  let productId = e.target.dataset.productid;
  if (cartBtn !== "A") {
    return;
  }

  let cartNum = Number(
    e.target.previousElementSibling.querySelector("input").value,
  );

  // 若原本購物車內有同樣的商品，必須再加上去
  cartData.forEach((item) => {
    if (item.product.id == productId) {
      cartNum += item.quantity;
    }
  });
  let productName = e.target.dataset.productname;
  addCartItem(productId, cartNum, productName);
});

// response 會回傳新的購物車列表，不需要再 Get 一次，用 reduceGetTimes()減少 GET 次數來取代 getCartList();
function reduceGetTimes(response) {
  cartData = response.data.carts;
  finalTotalPrice = response.data.finalTotal;
  renderCartList(cartData, finalTotalPrice);
}

function addCartItem(productId, cartNum, productName) {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
  axios
    .post(url, {
      data: {
        productId: productId,
        quantity: cartNum,
      },
    })
    .then(function (response) {
      swal(`${productName} 已成功加入購物車`, " ", "success", {
        button: "確定",
      });
      reduceGetTimes(response);
    })
    .catch(function (error) {
      console.log(error.response.data);
    });
}

let finalTotalPrice;

function getCartList() {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
  axios
    .get(url)
    .then(function (response) {
      cartData = response.data.carts;
      finalTotalPrice = response.data.finalTotal;
      renderCartList(cartData, finalTotalPrice);
    })
    .catch(function (error) {
      console.log(error.response.data);
    });
}

const cartListContent = document.querySelector(".js-cartList");
const cartTotalPrice = document.querySelector(".cartTotalPrice");

function renderCartList(cartData, finalTotalPrice) {
  let str = "";
  cartData.forEach((item) => {
    str += `
        <tr>
            <td>
                <div class="cardItem-title">
                    <img src="${item.product.images}" alt="">
                    <p>${item.product.title}</p>
                </div>
            </td>
            <td>NT$${toThousands(item.product.origin_price)}</td>
            <td>
                <div class="cartAmount">
                    <a href="#"><i class="fas fa-plus  cartAmount-icon" data-revise="reviseBtn" data-num="${
                      item.quantity + 1
                    }" data-cartid="${item.id}" data-cartdelname="${
      item.product.title
    }"></i></a>
                    <span>${item.quantity}</span>
                    <a href="#"><i class="fas fa-minus  cartAmount-icon" data-revise="reviseBtn" data-num="${
                      item.quantity - 1
                    }" data-cartid="${item.id}" data-cartdelname="${
      item.product.title
    }"></i></a>
                </div>
            </td>
            <td>NT$${toThousands(item.product.price)}</td>
            <td class="discardBtn">
                <a href="#" class="material-icons" data-cartid="${
                  item.id
                }" data-cartdelname="${item.product.title}" >
                    clear
                </a>
            </td>
        </tr>
        `;
  });
  cartListContent.innerHTML = str;
  cartTotalPrice.textContent = `${toThousands(finalTotalPrice)}`;

  if (cartData.length == 0) {
    deleteAllCart.classList.add("hide");
  } else if (cartData.length !== 0) {
    deleteAllCart.classList.remove("hide");
  }
}

cartListContent.addEventListener("click", function (e) {
  e.preventDefault();
  let reviseCartNumBtn = e.target.dataset.revise;
  if (reviseCartNumBtn !== "reviseBtn") {
    return;
  }
  let reviseCartNum = e.target.dataset.num;
  let reviseCartId = e.target.dataset.cartid;
  let cartDelItem = e.target.dataset.cartdelname;
  editCartNum(reviseCartId, reviseCartNum, cartDelItem);
});

function editCartNum(cartId, cartNum, cartDelItem) {
  if (cartNum > 0) {
    const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
    let data = {
      data: {
        id: cartId,
        quantity: Number(cartNum),
      },
    };
    axios
      .patch(url, data)
      .then(function (response) {
        reduceGetTimes(response);
      })
      .catch(function (error) {
        console.log(error.response);
      });
  } else {
    deleteCartItem(cartId, cartDelItem);
  }
}

cartListContent.addEventListener("click", function (e) {
  e.preventDefault();
  let deleteBtn = e.target.nodeName;
  if (deleteBtn !== "A") {
    return;
  }
  let cartId = e.target.dataset.cartid;
  let cartDelItem = e.target.dataset.cartdelname;
  deleteCartItem(cartId, cartDelItem);
});

function deleteCartItem(cartId, cartDelItem) {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts/${cartId}`;
  axios
    .delete(url)
    .then(function (response) {
      swal(`${cartDelItem} 已刪除`, " ", "info", { button: "確定" });
      reduceGetTimes(response);
    })
    .catch(function (error) {
      console.log(error.response.data);
    });
}

const deleteAllCart = document.querySelector(".discardAllBtn");

deleteAllCart.addEventListener("click", function (e) {
  e.preventDefault();

  swal({
    title: "請確定是否刪除全部購物車商品?",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      swal("購物車內商品已全部刪除", {
        icon: "success",
      });
      deleteAllCartList();
    }
  });
});

function deleteAllCartList() {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
  axios
    .delete(url)
    .then(function (response) {
      swal("已刪除購物車內所有商品", " ", "info", { button: "確定" });
      reduceGetTimes(response);
    })
    .catch(function (error) {
      console.log(error.response.data);
    });
}

const sendForm = document.querySelector(".orderInfo-form");
const sendOrderBtn = document.querySelector(".orderInfo-btn");

sendOrderBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if (cartData.length == 0) {
    swal("購物車內無商品，無法填寫訂單", " ", "error", { button: "確定" });
    return;
  }
  const customerNameVal = document.querySelector("#customerName").value;
  const customerPhoneVal = document.querySelector("#customerPhone").value;
  const customerEmailVal = document.querySelector("#customerEmail").value;
  const customerAddressVal = document.querySelector("#customerAddress").value;
  const tradeWayVal = document.querySelector("#tradeWay").value;

  if (
    customerNameVal == "" ||
    customerPhoneVal == "" ||
    customerEmailVal == "" ||
    customerAddressVal == ""
  ) {
    swal("請填入訂單必要的資訊", " ", "error", { button: "確定" });
    return;
  }

  // 除了 validate.js ，再加強 email 驗證，若格式錯誤無法送出訂單
  if (validateEmail(customerEmailVal) == false) {
    swal("請確認 Email 格式是否正確", " ", "error", { button: "確定" });
    return;
  }

  let orderData = {};
  orderData.name = customerNameVal;
  orderData.tel = customerPhoneVal;
  orderData.email = customerEmailVal;
  orderData.address = customerAddressVal;
  orderData.payment = tradeWayVal;

  swal({
    title: "是否確認訂單資料正確?",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      swal("訂單已成功建立", {
        icon: "success",
      });
      if (validatorPackage() !== undefined) {
        return;
      } else {
        createOrder(orderData);
      }
    }
  });
  getProductList();
});

function createOrder(orderData) {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/orders`;
  axios
    .post(url, {
      data: {
        user: orderData,
      },
    })
    .then(function (response) {
      sendForm.reset();
      getCartList();
    })
    .catch(function (error) {
      console.log(error.response.data);
    });
}

function validatorPackage() {
  const inputs = document.querySelectorAll(
    "input[type=text],input[type=tel],input[type=email]",
  );
  const constraints = {
    姓名: {
      presence: {
        message: "是必填欄位",
      },
    },
    電話: {
      presence: {
        message: "是必填欄位",
      },
      length: {
        minimum: 8,
        maximum: 12,
        message: "號碼至少8碼以上",
      },
    },
    Email: {
      presence: {
        message: "是必填欄位",
      },
      email: {
        message: "格式錯誤",
      },
    },
    寄送地址: {
      presence: {
        message: "是必填欄位",
      },
    },
  };

  inputs.forEach((item) => {
    item.addEventListener("change", function () {
      let orderInputMessage = item.nextElementSibling;
      // 一定要預設 orderInputMessage 為空值
      orderInputMessage.textContent = "";
      let error = validate(sendForm, constraints);

      if (error) {
        Object.keys(error).forEach((messageInfo) => {
          let alertMessage = document.querySelector(
            `[data-message="${messageInfo}"]`,
          );
          alertMessage.textContent = `${error[messageInfo]}`;
        });
      }
    });
  });
}

//  email 驗證
function validateEmail(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return false;
}

// 數字千分位
function toThousands(x) {
  let parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
