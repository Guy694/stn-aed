import 'server-only';

import net from 'node:net';
import tls from 'node:tls';

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function encodeAddress(name, email) {
  const cleanEmail = String(email || '').trim();
  const cleanName = String(name || '').trim();
  if (!cleanName) return cleanEmail;

  return `"${cleanName.replaceAll('"', '\\"')}" <${cleanEmail}>`;
}

function encodeSubject(subject) {
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
}

function dotStuff(value) {
  return String(value).replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlToText(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function smtpCommand(socket, command, expectedCodes = [250]) {
  return new Promise((resolve, reject) => {
    let response = '';

    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onData = (chunk) => {
      response += chunk.toString('utf8');
      const lines = response.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1] || '';
      const match = lastLine.match(/^(\d{3})\s/);
      if (!match) return;

      const code = Number(match[1]);
      cleanup();
      if (expectedCodes.includes(code)) {
        resolve(response);
      } else {
        reject(new Error(`SMTP command failed (${code}): ${response.trim()}`));
      }
    };

    socket.on('data', onData);
    socket.on('error', onError);
    if (command) socket.write(`${command}\r\n`);
  });
}

function connectSmtp({ host, port, secure }) {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.createConnection({ host, port });

    socket.setEncoding('utf8');
    socket.setTimeout(15000);
    socket.once('error', reject);
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('SMTP connection timed out'));
    });
    socket.once(secure ? 'secureConnect' : 'connect', () => {
      socket.off('error', reject);
      resolve(socket);
    });
  });
}

async function upgradeToTls(socket, host) {
  await smtpCommand(socket, 'STARTTLS', [220]);

  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host });
    secureSocket.setEncoding('utf8');
    secureSocket.once('error', reject);
    secureSocket.once('secureConnect', () => {
      secureSocket.off('error', reject);
      resolve(secureSocket);
    });
  });
}

export async function sendEmail({ to, toName, subject, html, text }) {
  if (!smtpConfigured()) {
    return { skipped: true, reason: 'SMTP is not configured' };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const password = process.env.SMTP_PASSWORD || '';
  const from = process.env.SMTP_FROM;
  const fromName = process.env.SMTP_FROM_NAME || 'ระบบข้อมูลสุขภาพ สตูล';
  const requireStartTls = !secure && port !== 25;
  const boundary = `stn-service-${Date.now().toString(36)}`;
  const bodyText = text || htmlToText(html);

  let socket = await connectSmtp({ host, port, secure });

  try {
    await smtpCommand(socket, null, [220]);
    await smtpCommand(socket, `EHLO ${process.env.SMTP_EHLO_HOST || 'localhost'}`);

    if (requireStartTls) {
      socket = await upgradeToTls(socket, host);
      await smtpCommand(socket, `EHLO ${process.env.SMTP_EHLO_HOST || 'localhost'}`);
    }

    if (user && password) {
      await smtpCommand(socket, 'AUTH LOGIN', [334]);
      await smtpCommand(socket, Buffer.from(user).toString('base64'), [334]);
      await smtpCommand(socket, Buffer.from(password).toString('base64'), [235]);
    }

    await smtpCommand(socket, `MAIL FROM:<${from}>`);
    await smtpCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
    await smtpCommand(socket, 'DATA', [354]);

    const messageBody = [
      `From: ${encodeAddress(fromName, from)}`,
      `To: ${encodeAddress(toName, to)}`,
      `Subject: ${encodeSubject(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      bodyText,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
      '',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    await smtpCommand(socket, `${dotStuff(messageBody)}\r\n.`);
    await smtpCommand(socket, 'QUIT', [221]);
    return { sent: true };
  } finally {
    socket.end();
  }
}

export async function sendRegistrationApprovedEmail({ to, fullName, username }) {
  const safeName = escapeHtml(fullName || username);
  const safeUsername = escapeHtml(username);

  return sendEmail({
    to,
    toName: fullName,
    subject: 'ผลการอนุมัติการลงทะเบียนใช้งานระบบ',
    html: `
      <p>เรียน ${safeName}</p>
      <p>คำขอลงทะเบียนใช้งานระบบข้อมูลสุขภาพ สตูล ได้รับการอนุมัติแล้ว</p>
      <p>ชื่อผู้ใช้: <strong>${safeUsername}</strong></p>
      <p>สามารถเข้าสู่ระบบได้ที่หน้าเข้าสู่ระบบของระบบ</p>
    `,
  });
}
