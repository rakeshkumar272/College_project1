const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rockcreation101@gmail.com",
    pass: "tebe niyx dloz nlzx",
  },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: `"SpeedyMart" <rockcreation101@gmail.com>`,
      to: "rockcreation101@gmail.com",
      subject: "Test email",
      text: "Test email",
    });
    console.log("Email sent: " + info.response);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}
test();
