// The sunset email — kizu's only scheduled email. Brand voice rules from
// CLAUDE.md: lowercase, no exclamation marks, never cheerful.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kizu.app";

const SUBJECT = "sunset's coming.";

const PLAIN_TEXT = `the day is ending.
one moment. one shot, or one screenshot.

witness today: ${APP_URL}/post

—
you're receiving this because of your kizu sunset setting.
change it: ${APP_URL}/settings`;

function html(): string {
  // Inline-styled, table-based email. No external CSS, no web fonts —
  // most email clients strip them anyway.
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>sunset's coming.</title>
  </head>
  <body style="margin:0;padding:0;background:#F2F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1A1A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0E6;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td style="padding-bottom:24px;">
                <span style="font-size:28px;font-weight:900;letter-spacing:-0.04em;">kizu</span>
              </td>
            </tr>
            <tr>
              <td style="background:#FFFFFF;border:2.5px solid #1A1A1A;border-radius:16px;box-shadow:5px 5px 0 #1A1A1A;padding:32px;">
                <h1 style="margin:0 0 12px 0;font-size:32px;font-weight:900;letter-spacing:-0.03em;line-height:1.05;">
                  sunset&rsquo;s coming.
                </h1>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#555;">
                  the day is ending. one moment. one shot, or one screenshot.
                </p>
                <a
                  href="${APP_URL}/post"
                  style="display:inline-block;background:#FFE15D;color:#3D3408;border:2.5px solid #1A1A1A;border-radius:12px;box-shadow:4px 4px 0 #1A1A1A;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;"
                >
                  witness today &rarr;
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-size:11px;color:#888;line-height:1.6;">
                you&rsquo;re receiving this because of your kizu sunset setting.<br />
                <a href="${APP_URL}/settings" style="color:#888;text-decoration:underline;">change it</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function sunsetEmailPayload() {
  return {
    subject: SUBJECT,
    html: html(),
    text: PLAIN_TEXT,
  };
}
