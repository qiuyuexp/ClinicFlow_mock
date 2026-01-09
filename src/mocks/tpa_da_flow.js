document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('verify-btn');
    if (btn) {
        btn.addEventListener('click', performSearch);
    }
});

function performSearch() {
    const loading = document.getElementById('loading');
    const result = document.getElementById('result-section');
    const btn = document.getElementById('verify-btn');

    // Just show result instantly for robust testing
    // loading.style.display = 'block';
    // btn.disabled = true;

    // setTimeout(() => {
    // loading.style.display = 'none';
    if (result) {
        result.classList.add('result-visible');
    }
    // btn.disabled = false;
    // }, 500);

    // LOG for debugger
    console.log('Search performed');
}
