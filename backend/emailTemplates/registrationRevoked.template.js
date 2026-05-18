export const registrationRevokedEmailTemplate = (name = "User") => {
  const subject = "Account Access Revoked";
  const text = `Hello ${name},

Your Resource Manager account access has been revoked by an admin.

If you believe this was a mistake, please contact support.

Thanks,
Resource Manager Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin-bottom: 8px;">Hello ${name},</h2>
      <p>Your Resource Manager account access has been <strong>revoked</strong> by an admin.</p>
      <p>If you believe this was a mistake, please contact support.</p>
      <p style="margin-top: 20px;">Thanks,<br />Resource Manager Team</p>
    </div>
  `;

  return { subject, text, html };
};
