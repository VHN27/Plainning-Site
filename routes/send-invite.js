const nodemailer = require("nodemailer");
require('dotenv').config();

// Step 1: Create a transporter using SMTP (you can also use other services like Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.Email_user, 
    pass: process.env.Email_password, 
  },
});

function sendEmail(attendee, eventId) {
    const mailOptions = {
        from: process.env.Email_user, 
        to: attendee, 
        subject: 'Invitation via PLanny', 
        html: 
        `
        <h3> Hello You have been invited to an event!!!</h3>
        <a href ="http://localhost:5000/invite-page?e=${attendee}&id=${eventId}"> Click The Link To Join </a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
        console.log("Error occurred:", error);
        } else {
        console.log("Email sent successfully:", attendee);
        }
    });
}

exports.sendEmail = sendEmail;