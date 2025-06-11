import { parseDTStartEndDates, generateICSForm, generateICSFormHandler } from "./eventDetails.js";
import { formatDay, parseDT } from "./home.js";

console.log(eventId);
$(document).ready(function () {
  // Fetch the list of users from the server
  $.getJSON(`/startDates${eventId}`, function (data) {
    console.log(data);
    let html = "";
    const startDates = parseDTStartEndDates(data).startDates;
    const endDates = parseDTStartEndDates(data).endDates;
    startDates.forEach((startDate, index) => {
      html += `
						<option value="${startDate + "|" + endDates[index]}" id="${startDate.substring(0, 19)+"Z" + "|" + endDates[index].substring(0, 19)+"Z"}">
							${formatDay(parseDT(startDate))}, ${parseDT(startDate).getDate()}/${parseDT(startDate).getMonth() + 1}/${parseDT(startDate).getFullYear()} ${parseDT(startDate).getHours()}:${parseDT(startDate).getMinutes().toString().padStart(2, '0')}-${parseDT(endDates[index]).getHours()}:${parseDT(endDates[index]).getMinutes().toString().padStart(2, '0')}
						</option>
					`
    });

    $('#options').html(html);
    $('.container1').append(generateICSForm());
    generateICSFormHandler();

  });
});