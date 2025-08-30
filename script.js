document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reservationForm');
    const successMsg = document.getElementById('reservationSuccess');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            successMsg.style.display = 'block';
            form.reset();
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 5000);
        });
    }
});