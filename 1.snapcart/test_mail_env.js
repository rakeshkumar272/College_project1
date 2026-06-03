const nodemailer = require("nodemailer");


console.log("EMAIL:", process.env.EMAIL);
console.log("PASS:", process.env.PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: `"SpeedyMart" <${process.env.EMAIL}>`,
      to: "rockcreation101@gmail.com",
      subject: "Test email env",
      text: "Test email",
    });
    console.log("Email sent: " + info.response);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}
test();
