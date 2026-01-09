document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.btn-submit');
    if (btn) {
        btn.addEventListener('click', searchPatient);
    }
});

function searchPatient() {
    const input = document.getElementById('nricInput');
    if (input && input.value.trim() !== "") {
        const results = document.getElementById('resultsArea');
        if (results) {
            results.classList.remove('hidden');
        }
    } else {
        alert("Please enter an NRIC/FIN number.");
    }
}
