const orderList = document.querySelector(".js-orderList");
const load = document.querySelector(".loader-inner");

let orderData = [];

// 修改訂單狀態與刪除訂單成功後 response 會回傳新的訂單列表，可以不用再次發出 GET 請求取得資料

function init() {
  getOrderList();
}
init();

function getOrderList() {
  const url = `${baseUrl}/api/livejs/v1/admin/${api_path}/orders`;
  axios
    .get(url, config)
    .then(function (response) {
      orderData = response.data.orders;
      load.style.display = "none";
      renderOrderList();
      C3ChartAllCategory();
      C3ChartAllItems();
    })
    .catch(function (error) {
      console.log(error);
    });
}

function renderOrderList() {
  let str = "";
  orderData.forEach((item) => {
    let time = new Date(item.createdAt * 1000);
    let orderTime = time.toLocaleDateString();
    let orderItemData = item.products;
    let orderItemStr = "";
    orderItemData.forEach((productItem) => {
      orderItemStr += `<p>${productItem.title} * ${productItem.quantity}</p>`;
    });
    let state;
    if (item.paid == false) {
      state = "未處理";
    } else {
      state = "已處理";
    }
    str += `
        <tr>
            <td>${item.createdAt}</td>
            <td>
                <p>${item.user.name}</p>
                <p>${item.user.tel}</p>
            </td>
            <td>${item.user.address}</td>
            <td>${item.user.email}</td>
            <td>
                <p>${orderItemStr}</p>
            </td>
            <td>${orderTime}</td>
            <td class="orderStatus">
                <a href="#" class="js-orderState" data-orderid="${item.id}" data-orderstate="${item.paid}">${state}</a>
            </td>
            <td>
                <input type="button" class="delSingleOrder-Btn" data-orderid="${item.id}" data-ordernum="${item.createdAt}" value="刪除">
            </td>
        </tr>
        `;
  });
  orderList.innerHTML = str;
  if (orderData.length == 0) {
    allItems.classList.add("hide");
    allCategory.classList.add("hide");
  } else if (orderData.length !== 0) {
    allItems.classList.remove("hide");
    allCategory.classList.remove("hide");
  }
}

orderList.addEventListener("click", function (e) {
  e.preventDefault();
  let btn = e.target.getAttribute("class");
  if (btn == null) return;
  let orderId = e.target.dataset.orderid;
  let orderState = e.target.dataset.orderstate;
  if (btn == "js-orderState") {
    editOrderList(orderId, orderState);
  }
  let orderSerialNum = e.target.dataset.ordernum;
  if (btn == "delSingleOrder-Btn") {
    deleteOrderItem(orderId, orderSerialNum);
  }
});

function editOrderList(orderId, orderState) {
  const url = `${baseUrl}/api/livejs/v1/admin/${api_path}/orders`;
  let state;
  // 注意型別
  if (orderState == "false") {
    state = true;
  } else {
    state = false;
  }
  let data = {
    data: {
      id: orderId,
      paid: state,
    },
  };
  axios
    .put(url, data, config)
    .then(function (response) {
      swal("已修改訂單", " ", "success", { button: "確定" });
      orderData = response.data.orders;
      renderOrderList();
    })
    .catch(function (error) {
      console.log(error);
    });
}

function deleteOrderItem(orderId, orderSerialNum) {
  const url = `${baseUrl}/api/livejs/v1/admin/${api_path}/orders/${orderId}`;
  axios
    .delete(url, config)
    .then(function (response) {
      swal(`已刪除訂單編號 ${orderSerialNum} 訂單`, " ", "success", {
        button: "確定",
      });
      orderData = response.data.orders;
      renderOrderList();
    })
    .catch(function (error) {
      console.log(error);
    });
}

const deleteAllOrderList = document.querySelector(".discardAllBtn");

deleteAllOrderList.addEventListener("click", function (e) {
  e.preventDefault();
  if (orderData.length == 0) {
    return;
  }
  swal({
    title: "是否確認刪除全部訂單?",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      swal("訂單已全部刪除", {
        icon: "success",
      });
      deleteAllOrder();
    }
  });
});

function deleteAllOrder() {
  const url = `${baseUrl}/api/livejs/v1/admin/${api_path}/orders`;
  axios
    .delete(url, config)
    .then(function (response) {
      orderData = response.data.orders;
      renderOrderList();
    })
    .catch(function (error) {
      console.log(error);
    });
}

function C3ChartAllCategory() {
  let totalObj = {};
  orderData.forEach((item) => {
    item.products.forEach((individualItem) => {
      if (totalObj[individualItem.category] == undefined) {
        totalObj[individualItem.category] =
          individualItem.price * individualItem.quantity;
      } else {
        totalObj[individualItem.category] +=
          individualItem.price * individualItem.quantity;
      }
    });
  });
  let rawAry = Object.keys(totalObj);
  let c3TypeData = [];
  rawAry.forEach((item) => {
    let ary = [];
    ary.push(item);
    ary.push(totalObj[item]);
    c3TypeData.push(ary);
  });

  let chart = c3.generate({
    bindto: "#chartAllCategory",
    data: {
      type: "pie",
      columns: c3TypeData,
    },
    color: {
      pattern: ["#036FB7", "#0486D5", "#26A8EF"],
    },
  });
}

function C3ChartAllItems() {
  let totalObj = {};
  orderData.forEach((item) => {
    item.products.forEach((individualItem) => {
      if (totalObj[individualItem.title] == undefined) {
        totalObj[individualItem.title] =
          individualItem.price * individualItem.quantity;
      } else {
        totalObj[individualItem.title] +=
          individualItem.price * individualItem.quantity;
      }
    });
  });

  let rawAry = Object.keys(totalObj);
  let sortAry = [];
  rawAry.forEach((item) => {
    let ary = [];
    ary.push(item);
    ary.push(totalObj[item]);
    sortAry.push(ary);
  });
  // 排序由大到小的 c3 格式
  sortAry.sort(function (a, b) {
    return b[1] - a[1];
  });

  // 篩選出前三名營收品項， 4~8 名都統整為其他類別
  let othersTotal = 0;
  if (sortAry.length > 3) {
    sortAry.forEach((item, index) => {
      if (index > 2) {
        othersTotal += item[1];
      }
    });
    sortAry.splice(3);
    sortAry.push(["其他", othersTotal]);
  }
  let chart = c3.generate({
    bindto: "#chartAllItems",
    data: {
      type: "pie",
      columns: sortAry,
    },
    color: {
      pattern: ["#036FB7", "#0486D5", "#26A8EF", "#5EC9FC"],
    },
  });
}

const chartSelect = document.querySelector(".chartSelect");
const allCategory = document.querySelector(".allCategory");
const allItems = document.querySelector(".allItems");

chartSelect.addEventListener("change", function (e) {
  if (orderData.length == 0) {
    chartSelect.disabled = true;
  } else {
    chartSelect.disabled = false;
  }

  let select = e.target.value;
  if (select == "全產品類別") {
    allItems.classList.add("hide");
    allCategory.classList.remove("hide");
  } else if (select == "全品項") {
    allCategory.classList.add("hide");
    allItems.classList.remove("hide");
  } else {
    allCategory.classList.remove("hide");
    allItems.classList.remove("hide");
  }
});
