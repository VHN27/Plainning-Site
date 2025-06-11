let indexRecipient = 2; nbDates = 1;
let indexDate = 2;

$(document).ready(function() {
	$('#js-add-recipient').click(function () {
		let currentId = indexRecipient;
		$('#recipient-email-address').append(`
			<div class="form-group" id="recipient-email-address-${indexRecipient}">
			<label for="recipient-name-${indexRecipient}" class="col-form-label">Recipient:</label>
			<button type="button" class="btn-close ml-1" id="btn-recipient-${indexRecipient}"></button>
			<input type="text" class="form-control" id="recipient-name-${indexRecipient}" name="name" required>
			</div>
		`);
		$(`#btn-recipient-${currentId}`).on("click", function () {
				$(`#recipient-email-address-${currentId}`).remove();
		});
		indexRecipient++;
	});

	$('#js-add-date').click(function () {
		let currentId = indexDate;
		if (nbDates >= 3) {
			return;
		}
		$('#reunions').append(`
			<div id="reunion-${currentId}">
				<div class="row">
					<div class="col">
					<label for="reunion-date-${currentId}" class="col-form-label">Date:</label>
					<button type="button" class="btn-close ml-1" id="btn-reunion-${currentId}"></button>
					<input type="date" class="form-control" id="reunion-date-${currentId}" name="date" required value="2023-10-01"> 
					</div>
				</div>
				<div class="row">
					<div class="col">
					<label for="reunion-time-start-${currentId}" class="col-form-label">Time Start:</label>
					<input type="time" class="form-control" id="reunion-time-start-${currentId}" name="time" required value="12:00">
					</div>
					<div class="col">
					<label for="reunion-time-end-${currentId}" class="col-form-label">Time End:</label>
					<input type="time" class="form-control" id="reunion-time-end-${currentId}" name="time" required value="13:00">
				</div>
			</div>
		`);

		$(`#btn-reunion-${currentId}`).on("click", function () {
			$(`#reunion-${currentId}`).remove();
				nbDates--;
		});
		indexDate++;
		nbDates++;
});

});