import transporter from "./emailTransporter.js";

export const sendEmail = async ({ to, subject, text, html, from }) => {
  const mailOptions = {
    from: from || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};
