const form = document.getElementById("payrollForm");
const empName = document.getElementById("empName");
const hours = document.getElementById("hours");
const rate = document.getElementById("rate");
const tax = document.getElementById("tax");
const otherDed = document.getElementById("otherDed");
const tbody = document.getElementById("payrollTbody");
const msg = document.getElementById("msg");
const sumEmployees = document.getElementById("sumEmployees");
const sumGross = document.getElementById("sumGross");
const sumDed = document.getElementById("sumDed");
const sumNet = document.getElementById("sumNet");
const resetBtn = document.getElementById("resetBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const exportBtn = document.getElementById("exportBtn");

let editingRow = null;
let records = [];

function toMoney(n) {
  return `₱${Number(n).toFixed(2)}`;
}

function readValues() {
  const name = empName.value.trim();
  const h = parseFloat(hours.value);
  const r = parseFloat(rate.value);
  const t = parseFloat(tax.value);
  const o = parseFloat(otherDed.value);

  if (!name || isNaN(h) || isNaN(r) || isNaN(t) || isNaN(o)) return null;
  if (h < 0 || r < 0 || t < 0 || o < 0) return null;

  const gross = h * r;
  const taxDeduction = gross * (t / 100);
  const netPay = gross - taxDeduction - o;

  return { name, h, r, t, o, gross, taxDeduction, netPay };
}

function setMessage(text) {
  msg.textContent = text;
}

function clearForm() {
  form.reset();
  empName.value = "";
  hours.value = "";
  rate.value = "";
  tax.value = "10";
  otherDed.value = "0";
  editingRow = null;
  document.getElementById("submitBtn").textContent = "Add to Payroll";
  setMessage("");
}

function updateTotals() {
  let totalGross = 0;
  let totalDed = 0;
  let totalNet = 0;

  records.forEach((row) => {
    totalGross += row.gross;
    totalDed += row.taxDeduction + row.o;
    totalNet += row.netPay;
  });

  sumEmployees.textContent = records.length;
  sumGross.textContent = toMoney(totalGross);
  sumDed.textContent = toMoney(totalDed);
  sumNet.textContent = toMoney(totalNet);
}

function renderRows() {
  tbody.innerHTML = "";
  records.forEach((data, idx) => {
    const tr = document.createElement("tr");
    tr.dataset.index = idx;

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><span class="namePill">${data.name}</span></td>
      <td>${data.h.toFixed(2)}</td>
      <td>${toMoney(data.r)}</td>
      <td>${toMoney(data.gross)}</td>
      <td>${toMoney(data.taxDeduction)} <span class="taxPercent">(${data.t.toFixed(2)}%)</span></td>
      <td>${toMoney(data.o)}</td>
      <td>${toMoney(data.netPay)}</td>
      <td>
        <button class="actionBtn editBtn" type="button">Edit</button>
        <button class="actionBtn danger deleteBtn" type="button">Delete</button>
      </td>
    `;

    tr.querySelector(".editBtn").addEventListener("click", () => {
      editingRow = idx;
      empName.value = data.name;
      hours.value = data.h;
      rate.value = data.r;
      tax.value = data.t;
      otherDed.value = data.o;
      document.getElementById("submitBtn").textContent = "Update Payroll";
      setMessage("Editing record...");
    });

    tr.querySelector(".deleteBtn").addEventListener("click", () => {
      records.splice(idx, 1);
      saveData();
      renderRows();
      updateTotals();
      if (editingRow === idx) clearForm();
    });

    tbody.appendChild(tr);
  });
}

function saveData() {
  localStorage.setItem("payrollRecords", JSON.stringify(records));
}

function loadData() {
  const saved = localStorage.getItem("payrollRecords");
  records = saved ? JSON.parse(saved) : [];
  renderRows();
  updateTotals();
}

function exportCSV() {
  if (records.length === 0) {
    setMessage("No records to export.");
    return;
  }

  const headers = ["Name","Hours","Rate","Gross","Tax","Other","Net"];
  const lines = [headers.join(",")];

  records.forEach((data) => {
    const row = [
      data.name,
      data.h.toFixed(2),
      data.r.toFixed(2),
      data.gross.toFixed(2),
      `${data.taxDeduction.toFixed(2)} (${data.t.toFixed(2)}%)`,
      data.o.toFixed(2),
      data.netPay.toFixed(2)
    ];
    lines.push(row.map(v => `"${v}"`).join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "payroll.csv";
  a.click();
  URL.revokeObjectURL(url);
  setMessage("CSV exported.");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = readValues();
  if (!data) {
    setMessage("Please enter valid values.");
    return;
  }

  if (editingRow !== null) {
    records[editingRow] = data;
    editingRow = null;
    setMessage("Record updated.");
    document.getElementById("submitBtn").textContent = "Add to Payroll";
  } else {
    records.push(data);
    setMessage("Record added.");
  }

  saveData();
  renderRows();
  updateTotals();
  clearForm();
});

resetBtn.addEventListener("click", () => {
  clearForm();
});

clearAllBtn.addEventListener("click", () => {
  records = [];
  saveData();
  renderRows();
  updateTotals();
  clearForm();
  setMessage("All records cleared.");
});

exportBtn.addEventListener("click", exportCSV);

loadData();