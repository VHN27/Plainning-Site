const nodemailer = require("nodemailer");
require('dotenv').config();

// Step 1: Create a transporter using SMTP (you can also use other services like Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Using Gmail's SMTP server (for example)
  auth: {
    user: process.env.Email_user, // Your email address
    pass: process.env.Email_password, // Your email password or App password (for Gmail)
  },
});

// Step 2: Set up email data
const mailOptions = {
  from: process.env.Email_user,  // Sender email address
  to: 'dvnguyen1003@gmail.com', // Receiver email address
  subject: 'Test Email from Node.js', // Subject line
  text: 'Hello, this is a test email sent from Node.js using Nodemailer!', // Plain text body
  // html: '<h1>Hello</h1><p>This is a test email sent from Node.js using Nodemailer!</p>' // HTML body (optional)
};

// Step 3: Send email
function sendEmail() {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error occurred:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });
}

sendEmail();
