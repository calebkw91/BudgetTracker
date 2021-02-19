let transactions = [];
let myChart;

const request = window.indexedDB.open("budgetSave", 1);

// Create schema
request.onupgradeneeded = event => {
    const db = event.target.result;

    // Creates an object store with a listID keypath that can be used to query on.
    const budgetSaveStore = db.createObjectStore("budgetSave", { keyPath: "id", autoIncrement: true });
    // Creates a statusIndex that we can query on.
    budgetSaveStore.createIndex("nameIndex", "name", {unique: false});
    budgetSaveStore.createIndex("ammountIndex", "value", {unique: false});
    budgetSaveStore.createIndex("dateIndex", "date", {unique: false});
}

let saveRecord = (data) => {
    // Opens a transaction, accesses the budgetSave objectStore and statusIndex.
    console.log("saving data offline");
    console.log(data);
    const db = request.result;
    const transaction = db.transaction(["budgetSave"], "readwrite");
    const budgetSaveStore = transaction.objectStore("budgetSave");
    //const statusIndex = budgetSaveStore.index("statusIndex");

    // Adds data to our objectStore
    console.log("auto" + budgetSaveStore.autoIncrement);
    budgetSaveStore.add({ name: data.name, value: data.value, date: data.date });

    // Return an item by keyPath
    //   const getRequest = budgetSaveStore.get("1");
    //   getRequest.onsuccess = () => {
    //     console.log(getRequest.result);
    //   };

    // Return an item by index
    //   const getRequestIdx = statusIndex.getAll("complete");
    //   getRequestIdx.onsuccess = () => {
    //     console.log(getRequestIdx.result); 
    //   }; 
}

let getAllRecords = () => {
    const db = request.result;
    const transaction = db.transaction(["budgetSave"], "readwrite");
    const budgetSaveStore = transaction.objectStore("budgetSave");
    const getRequest = budgetSaveStore.getAll();

    getRequest.onsuccess = () => {
        console.log(getRequest.result[0]);
        transactions.push(getRequest.result[0]);
        console.log("2 " + JSON.stringify(transactions));

        populateTotal();
        populateTable();
        populateChart();
    }
}

fetch("/api/transaction")
    .then(response => {
        return response.json();
    })
    .then(data => {
        // save db data on global variable
        transactions = data;
        console.log("1 " + JSON.stringify(transactions));
        getAllRecords();
    });

function populateTotal() {
    // reduce transaction amounts to a single total value
    let total = transactions.reduce((total, t) => {
        return total + parseInt(t.value);
    }, 0);

    let totalEl = document.querySelector("#total");
    totalEl.textContent = total;
}

function populateTable() {
    let tbody = document.querySelector("#tbody");
    tbody.innerHTML = "";

    transactions.forEach(transaction => {
        // create and populate a table row
        let tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

        tbody.appendChild(tr);
    });
}

function populateChart() {
    // copy array and reverse it
    let reversed = transactions.slice().reverse();
    let sum = 0;

    // create date labels for chart
    let labels = reversed.map(t => {
        let date = new Date(t.date);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });

    // create incremental values for chart
    let data = reversed.map(t => {
        sum += parseInt(t.value);
        return sum;
    });

    // remove old chart if it exists
    if (myChart) {
        myChart.destroy();
    }

    let ctx = document.getElementById("myChart").getContext("2d");

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: "Total Over Time",
                fill: true,
                backgroundColor: "#6666ff",
                data
            }]
        }
    });
}

function sendTransaction(isAdding) {
    let nameEl = document.querySelector("#t-name");
    let amountEl = document.querySelector("#t-amount");
    let errorEl = document.querySelector(".form .error");

    // validate form
    if (nameEl.value === "" || amountEl.value === "") {
        errorEl.textContent = "Missing Information";
        return;
    }
    else {
        errorEl.textContent = "";
    }

    // create record
    let transaction = {
        name: nameEl.value,
        value: amountEl.value,
        date: new Date().toISOString()
    };

    // if subtracting funds, convert amount to negative number
    if (!isAdding) {
        transaction.value *= -1;
    }

    // add to beginning of current array of data
    transactions.unshift(transaction);

    // re-run logic to populate ui with new record
    populateChart();
    populateTable();
    populateTotal();

    // also send to server
    fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
        }
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.errors) {
                errorEl.textContent = "Missing Information";
            }
            else {
                // clear form
                nameEl.value = "";
                amountEl.value = "";
            }
        })
        .catch(err => {
            // fetch failed, so save in indexed db
            saveRecord(transaction);
            console.log("failed send");

            // clear form
            nameEl.value = "";
            amountEl.value = "";
        });
}

document.querySelector("#add-btn").onclick = function () {
    sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
    sendTransaction(false);
};
