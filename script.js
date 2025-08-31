document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reservationForm');
    const successMsg = document.getElementById('reservationSuccess');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const reservationData = {
                name: formData.get('name'),
                // The backend expects 'date' and 'people', let's combine date and time
                // and use 'guests' for 'people'.
                date: `${formData.get('date')} ${formData.get('time')}`,
                people: parseInt(formData.get('guests'), 10)
            };

            fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservationData),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    successMsg.style.display = 'block';
                    form.reset();
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 5000);
                } else {
                    alert('Failed to make reservation. Please try again.');
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            });
        });
    }
});