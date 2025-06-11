import { formatDay, parseDT } from "./home.js";

function addOptionsHandlers(event, userId, startDates, endDates) {
	if (event.organizer != userId) {
		startDates.forEach((startDate, index) => {
			$(`#${CSS.escape(startDate + "|" + endDates[index])}`).on("click", function () {
				$.post("/accept-event", { eventId: event.id, userId: userId, dtstart_dtend: this.id }).done(function (response) {
					location.reload();
				}).fail(function (textStatus, errorThrown) {
					console.error("Error accepting event:", textStatus, errorThrown);
				});
			});
		});
	} else {
		$('#end-confirmation').on("click", function () {
			$.post(("/confirm-event"), { eventId: event.id }).done(function (response) {
				if (response.status == "error") {
					alert("Error: Event failed to confirme. No participant found.");
					return;
				}
				location.reload();
			});
		});
	}
}

/* Générer les options selon si c'est l'organizateur ou l'invité */
function generatePendingEventDetailsOptions(event, userId, startDates, endDates) {
	startDates = event.dtstart.split("|");
	let html = "";
	if (event.organizer != userId) {
		startDates.forEach((startDate, index) => {
			html += `
				<button class="btn btn-secondary m-2" id="${startDate + "|" + endDates[index]}">
					${formatDay(parseDT(startDate))}, ${parseDT(startDate).getDate()}/${parseDT(startDate).getMonth() + 1}/${parseDT(startDate).getFullYear()} ${parseDT(startDate).getHours()}:${parseDT(startDate).getMinutes().toString().padStart(2, '0')}-${parseDT(endDates[index]).getHours()}:${parseDT(endDates[index]).getMinutes().toString().padStart(2, '0')}
				</button>
				`;
		});
	} else {
		html += `<button class="btn btn-secondary m-2" id="end-confirmation">End Confirmation</button>`;
	}


	return html;
}

/* Générer les description de l'evenement */
function generateEventDescription(event, pending) {
	let html = ``;
	if (!pending) {
		html +=
			`
			<p><strong>Start:</strong> 
			${formatDay(parseDT(event.dtstart))}, ${parseDT(event.dtstart).getDate()}/${parseDT(event.dtstart).getMonth() + 1}/${parseDT(event.dtstart).getFullYear()} ${parseDT(event.dtstart).getHours()}:${parseDT(event.dtstart).getMinutes().toString().padStart(2, '0')}</p>
			<p><strong>End:</strong> 
			${formatDay(parseDT(event.dtend))}, ${parseDT(event.dtend).getDate()}/${parseDT(event.dtend).getMonth() + 1}/${parseDT(event.dtend).getFullYear()} ${parseDT(event.dtend).getHours()}:${parseDT(event.dtend).getMinutes().toString().padStart(2, '0')}</p>
		`;
	}

	html +=
		`	<p><strong>Description:</strong> ${event.description}</p>
			<p><strong>Location:</strong> ${event.location}</p>
			<p><strong>Status:</strong> ${event.status}</p>
		`;
	return html;
}

/* Générer l'interface du modal des évenements */
export function genertateEventDetails(event) {
	let html = ``;
	html += generateEventDescription(event, false);
	$('#modalEventDetailsLabel').text(event.summary);
	$('#modalEventDetailsBody').html(html);
}

/* Générer la form pour  */
export function generateICSForm(){
	let html =  `
			<form id="ics-form" method="POST" enctype="multipart/form-data">
				<h3>Upload ICS</h3>
				<div class="input-group mb-3">
					<input type="file" class="form-control" id="inputICS" name="ics">
					<button type="submit" data-mdb-button-init data-mdb-ripple-init class="btn btn-primary btn-block mt-3">Submit</button>
				</div>
			</form>
		`;
	return html;
}

export function generateICSFormHandler(){
	$('#ics-form').on("submit", function (e) {
		e.preventDefault();
		let formData = new FormData(this);

		$.ajax({
			url: "/ics",
			type: "POST",
			data: formData,
			contentType: false,
			processData: false,
			success: function (responses) {
				responses.dtstart.forEach((startDate, index) => {
					$(`#${CSS.escape(startDate + "|" + responses.dtend[index])}`).remove();
				});
			},
			error: function (textStatus, errorThrown) {
				console.error("Error uploading ICS file:", textStatus, errorThrown);
			}
		});
	});
}

export function parseDTStartEndDates(event) {
	let startDates = event.dtstart.split("|");
	let endDates = event.dtend.split("|");
	startDates.map(startDate => parseDT(startDate));
	endDates.map(endDate => parseDT(endDate));

	return { startDates, endDates };
}

/* Générer l'interface du modal des évenements pending */
export function genertatePendingEventDetails(event, userId) {
	let html = "";
	let startDates = parseDTStartEndDates(event).startDates;
	let endDates = parseDTStartEndDates(event).endDates;

	html += generatePendingEventDetailsOptions(event, userId, startDates, endDates);

	if( event.organizer != userId)
		html += generateICSForm();

	html += generateEventDescription(event, true);
	$('#modalEventDetailsLabel').text(event.summary);
	$('#modalEventDetailsBody').html(html);

	
	generateICSFormHandler();
	addOptionsHandlers(event, userId, startDates, endDates);





}