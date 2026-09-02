document.getElementById('year').textContent = new Date().getFullYear();

const BASE_PRICE = 12.99;
const checkboxes = document.querySelectorAll('.addon input[type="checkbox"]');
const totalValueEl = document.getElementById('total-value');
const btn = document.getElementById('checkout-btn');
const errorEl = document.getElementById('checkout-error');
const formErrorEl = document.getElementById('lead-form-error');

const nomeInput = document.getElementById('lead-nome');
const emailInput = document.getElementById('lead-email');
const telefoneInput = document.getElementById('lead-telefone');

function formatEuro(value) {
  return value.toFixed(2).replace('.', ',') + '€';
}

function updateTotal() {
  let total = BASE_PRICE;
  checkboxes.forEach((cb) => {
    if (cb.checked) total += parseFloat(cb.dataset.price);
  });
  totalValueEl.textContent = formatEuro(total);
}

checkboxes.forEach((cb) => cb.addEventListener('change', updateTotal));

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

btn.addEventListener('click', async () => {
  errorEl.style.display = 'none';
  formErrorEl.style.display = 'none';

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const telefone = telefoneInput.value.trim();

  if (!nome || !email || !telefone || !isValidEmail(email)) {
    formErrorEl.textContent = !isValidEmail(email) && email
      ? 'Introduz um email válido.'
      : 'Preenche o nome, email e telefone para continuar.';
    formErrorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'A abrir pagamento…';

  const selectedAddons = Array.from(checkboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.dataset.addon);

  const customer = { nome, email, telefone };

  fetch('/.netlify/functions/send-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  }).catch((err) => console.error('Falha ao enviar lead:', err));

  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addons: selectedAddons, customer }),
    });

    if (!res.ok) {
      throw new Error('Falha ao criar sessão de pagamento');
    }

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Resposta inválida do servidor');
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Não foi possível iniciar o pagamento. Tenta novamente em instantes.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Comprar acesso agora';
  }
});
