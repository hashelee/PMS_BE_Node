// utils/notification.js
import nodemailer from "nodemailer";

export const sendNotificationEmail = async (subject, text, recipients) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or another email service
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your app password
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients.join(","), // array of emails
      subject: subject,
      text: text,
    });

    console.log("Notification email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
