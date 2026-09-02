// Confirma diretamente junto da API da Stripe (via fetch, sem biblioteca)
// se uma sessão de checkout foi paga.

const STRIPE_API = 'https://api.stripe.com/v1';

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters && event.queryStringParameters.session_id;

  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ paid: false, error: 'Falta session_id' }) };
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return { statusCode: 500, body: JSON.stringify({ paid: false, error: 'STRIPE_SECRET_KEY não configurada' }) };
    }

    const res = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Erro Stripe:', data);
      return { statusCode: 500, body: JSON.stringify({ paid: false, error: 'Erro ao verificar pagamento' }) };
    }

    const paid = data.payment_status === 'paid';

    return {
      statusCode: 200,
      body: JSON.stringify({ paid }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ paid: false, error: 'Erro ao verificar pagamento' }),
    };
  }
};
