// Fala diretamente com a API da Stripe via fetch (sem precisar de instalar
// nenhuma biblioteca) — assim o site funciona mesmo com deploy manual.

const STRIPE_API = 'https://api.stripe.com/v1';

const BASE_ITEM = {
  name: 'Aulas GlowAI — Cria as tuas fotos com IA',
  description: 'Acesso vitalício às vídeo-aulas.',
  unit_amount: 1299,
};

const ADDONS = {
  confianca: {
    name: 'Prompt Secreto',
    description: 'Prompt pronto e aula direta para fotos com postura e presença.',
    unit_amount: 499,
  },
  luxo: {
    name: 'Menina de Luxo IA',
    description: 'Prompts para fotos femininas com estética de luxo e sofisticação.',
    unit_amount: 499,
  },
};

function appendLineItem(params, index, item) {
  params.append(`line_items[${index}][price_data][currency]`, 'eur');
  params.append(`line_items[${index}][price_data][unit_amount]`, String(item.unit_amount));
  params.append(`line_items[${index}][price_data][product_data][name]`, item.name);
  params.append(`line_items[${index}][price_data][product_data][description]`, item.description);
  params.append(`line_items[${index}][quantity]`, '1');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY não configurada' }) };
    }

    const siteUrl = process.env.URL || 'http://localhost:8888';

    let requestedAddons = [];
    let customer = {};
    try {
      const parsed = JSON.parse(event.body || '{}');
      if (Array.isArray(parsed.addons)) requestedAddons = parsed.addons;
      if (parsed.customer && typeof parsed.customer === 'object') customer = parsed.customer;
    } catch (e) {
      requestedAddons = [];
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append('success_url', `${siteUrl}/aulas.html?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${siteUrl}/#preco`);
    params.append('metadata[nome]', (customer.nome || '').slice(0, 200));
    params.append('metadata[telefone]', (customer.telefone || '').slice(0, 50));
    if (customer.email) {
      params.append('customer_email', customer.email);
    }

    let idx = 0;
    appendLineItem(params, idx, BASE_ITEM);
    idx += 1;

    requestedAddons.forEach((key) => {
      const addon = ADDONS[key];
      if (!addon) return;
      appendLineItem(params, idx, addon);
      idx += 1;
    });

    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Erro Stripe:', data);
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao criar sessão de pagamento' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.url }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao criar sessão de pagamento' }),
    };
  }
};
