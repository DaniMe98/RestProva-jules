// Admin login/logout
function showDashboard() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = '';
    loadReservations();
    loadFields();
}
function logout() {
    fetch('/admin/logout').then(() => location.reload());
}
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let pass = document.getElementById('adminPass').value;
    let res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
    });
    if (res.ok) { showDashboard(); }
    else { document.getElementById('loginError').style.display = ''; }
});

// Reservations table
async function loadReservations() {
    let res = await fetch('/reservations');
    if (!res.ok) return;
    let data = await res.json();
    let head = document.getElementById('tableHead'), body = document.getElementById('tableBody');
    body.innerHTML = '';
    head.innerHTML = '';
    if (data.length === 0) return;
    // Make headers
    Object.keys(data[0]).forEach(k => {
        let th = document.createElement('th');
        th.textContent = k;
        head.appendChild(th);
    });
    data.forEach(r => {
        let tr = document.createElement('tr');
        Object.values(r).forEach(val => {
            let td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });
}

// Fields editor
async function loadFields() {
    let res = await fetch('/admin/fields');
    let fields = await res.json();
    let form = document.getElementById('fieldsForm');
    form.innerHTML = '';
    fields.forEach((field, idx) => {
        let wrap = document.createElement('div');
        wrap.className = 'field-list';
        wrap.innerHTML = `
            <input type="text" value="${field.label}" placeholder="Label" onchange="updateField(${idx},'label',this.value)">
            <input type="text" value="${field.name}" placeholder="Name" onchange="updateField(${idx},'name',this.value)">
            <select onchange="updateField(${idx},'type',this.value)">
                <option ${field.type==='text'?'selected':''}>text</option>
                <option ${field.type==='email'?'selected':''}>email</option>
                <option ${field.type==='tel'?'selected':''}>tel</option>
                <option ${field.type==='number'?'selected':''}>number</option>
                <option ${field.type==='date'?'selected':''}>date</option>
                <option ${field.type==='time'?'selected':''}>time</option>
            </select>
            <label><input type="checkbox" ${field.required?'checked':''} onchange="updateField(${idx},'required',this.checked)"> required</label>
            <button type="button" onclick="removeField(${idx})">Remove</button>
            <br>
        `;
        form.appendChild(wrap);
    });
    let addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = 'Add Field';
    addBtn.onclick = () => {
        fields.push({ name: '', label: '', type: 'text', required: false });
        loadFields();
    };
    form.appendChild(addBtn);

    // Save handler
    document.getElementById('saveFieldsBtn').onclick = async () => {
        await fetch('/admin/fields', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields)
        });
        document.getElementById('fieldsMsg').style.display = '';
        setTimeout(()=>{document.getElementById('fieldsMsg').style.display='none';}, 1500);
    };

    // Helpers
    window.updateField = (idx, prop, val) => {
        if (prop === 'required') fields[idx][prop] = !!val;
        else fields[idx][prop] = val;
    };
    window.removeField = (idx) => {
        fields.splice(idx, 1);
        loadFields();
    };
}

// Auto-login if already authenticated
fetch('/reservations').then(res=>{
    if(res.ok) showDashboard();
});