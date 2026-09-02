// Envia os dados de contacto (nome, email, telefone) para o teu email
// assim que alguém inicia a compra — mesmo que acabe por não terminar o pagamento.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { nome, email, telefone } = JSON.parse(event.body || '{}');

    if (!nome || !email || !telefone) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Dados em falta' }) };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const destino = process.env.LEAD_EMAIL_TO || 'glowy.ia.suporte@gmail.com';

    if (!apiKey) {
      console.warn('RESEND_API_KEY não configurada; email não enviado.');
      return { statusCode: 200, body: JSON.stringify({ sent: false }) };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GlowAI <onboarding@resend.dev>',
        to: [destino],
        subject: `Nova compra iniciada — ${nome}`,
        html: `
          <h2>Novo contacto do site GlowAI</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p style="color:#888;font-size:13px;margin-top:20px;">Enviado automaticamente quando esta pessoa iniciou a compra no site.</p>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Erro Resend:', errText);
      return { statusCode: 200, body: JSON.stringify({ sent: false }) };
    }

    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 200, body: JSON.stringify({ sent: false }) };
  }
};
