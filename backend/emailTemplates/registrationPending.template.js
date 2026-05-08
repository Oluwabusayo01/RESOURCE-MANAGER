

export const registrationEmailTemplate = (name = "User") => {
  const subject = "Registration Received - Await Admin Approval";
  const text = `Hello ${name},

Your registration was successful.

Your account is currently pending admin approval. You will be notified once your account is approved.

Thanks,
Resource Manager Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin-bottom: 8px;">Hello ${name},</h2>
      <p>Your registration was successful.</p>
      <p>
        Your account is currently <strong>pending admin approval</strong>.
        You will be notified once your account is approved.
      </p>
      <p style="margin-top: 20px;">Thanks,<br />Resource Manager Team</p>
    </div>
  `;

  return { subject, text, html };
};
