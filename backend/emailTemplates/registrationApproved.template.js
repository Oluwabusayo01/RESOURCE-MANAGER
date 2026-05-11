export const registrationApprovedEmailTemplate = (name = "User") => {
  const subject = "Account Approved - You Can Now Log In";
  const text = `Hello ${name},

Your Resource Manager account has been approved by an admin.

You can now log in and start using the platform.

Thanks,
Resource Manager Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin-bottom: 8px;">Hello ${name},</h2>
      <p>Your Resource Manager account has been <strong>approved</strong> by an admin.</p>
      <p>You can now log in and start using the platform.</p>
      <p style="margin-top: 20px;">Thanks,<br />Resource Manager Team</p>
    </div>
  `;

  return { subject, text, html };
};
