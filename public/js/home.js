import { genertateEventDetails, genertatePendingEventDetails } from "./eventDetails.js";

export const day =["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* Retouner une Date à partir d'un string de format DT */
export function parseDT(dtString) {
	return new Date(dtString);
}

/* Retouner un string du jour selon la date */
export function formatDay(date) {
	const currentDate = new Date();
	if (day[date.getDay()] == day[currentDate.getDay()] && date.getDate() == currentDate.getDate()) {
		return "Today";
	}else if (date.getDate() == currentDate.getDate() + 1) {
		return "Tomorrow";
	}else if (date.getDate() == currentDate.getDate() - 1) {
		return "Yesterday";
	}
	return day[date.getDay()];
}

/* Générer le html du 'Pending Events' */
function generatePendingEventToHTML(event, organizer) {
	const html = `
		<div class="event mt-2 p-3 ms-auto" id="${event.uid}" data-bs-toggle="modal" data-bs-target="#modalEventDetails">
			<div class="row">
				<div class="col-md">
					<h3>${event.summary}</h3>
				</div>
			</div>
			<div class = "row">
				<div class="col-md">
					${organizer ? `Organizer` : `Atendee`}
				</div>
			</div>
			<p>${event.description}</p>
		</div>
	`;
	$('.pending-events-list').append(html);
}

/* Générer le html du 'Upcoming Events' et 'Past Events' */
function generateEventToHTML(event, organizer) {
	const startDate = parseDT(event.dtstart);
	const currentDate = new Date();
	const html = `
		<div class="event mt-2 p-3 ms-auto" id="${event.uid}" data-bs-toggle="modal" data-bs-target="#modalEventDetails">
			<div class="row">
				<div class="col-md">
					<h3>${event.summary.length > 15 ? event.summary.slice(0, 15)+`...` : event.summary}</h3>
				</div>
			</div>
			<div class = "row">
				<div class="col-md">
					${organizer ? `Organizer` : `Atendee`}
				</div>
				<div class="col-md text-end">
					<p>${formatDay(startDate)}, ${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}</p>
				</div>
			<div>
			<p>${event.description}</p>
		</div>
	`;
	if (currentDate < startDate) {
		$('.upcoming-events-list').append(html);
	}else {
		$('.past-events-list').append(html);
	}
}

/* Générer la rubrique 'Upcoming Events' et 'Past Events' */
function generatePastAndUpccomingEvents (userId){
	$.getJSON("/events", function (events) {
			events.forEach(function(event) {
				if (event.organizer != userId) {
					generateEventToHTML(event, false);
				}else{
					generateEventToHTML(event, true);
				}
				$(`#${CSS.escape(event.uid)}`).on("click", function () {
					genertateEventDetails(event);
				});
			});
		}).fail(function (textStatus, errorThrown) {
			console.error("Error loading events:", textStatus, errorThrown);
		});
}

/* Genérer la rubrique 'Pending events' */
function generatePendingEvents (userId){
	$.getJSON("/pending-events", function (events) {
			events.forEach(function(event) {
				if (event.organizer != userId) {
					generatePendingEventToHTML(event, false);
				}else{
					generatePendingEventToHTML(event, true);
				}
				
				$(`#${CSS.escape(event.uid)}`).on("click", function () {
					genertatePendingEventDetails(event, userId);
				});
			});
		}).fail(function (textStatus, errorThrown) {
			console.error("Error loading events:", textStatus, errorThrown);
		});
}

/* Main */
$(document).ready(function () {
	$.getJSON("/user-id", function (data) {
		const userId = data.id;

		generatePastAndUpccomingEvents(userId);
		generatePendingEvents(userId);

	}).fail(function (textStatus, errorThrown) {
		console.error("Error loading user ID:", textStatus, errorThrown);
	});
});