export const registrationRejectedEmailTemplate = (name = "User") => {
  const subject = "Account Registration Update";
  const text = `Hello ${name},

Your Resource Manager registration was not approved at this time.

Please review your details and re-apply for registration.

Thanks,
Resource Manager Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin-bottom: 8px;">Hello ${name},</h2>
      <p>Your Resource Manager registration was <strong>not approved</strong> at this time.</p>
      <p>Please review your details and <strong>re-apply</strong> for registration.</p>
      <p style="margin-top: 20px;">Thanks,<br />Resource Manager Team</p>
    </div>
  `;

  return { subject, text, html };
};
