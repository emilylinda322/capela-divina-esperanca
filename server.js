const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('./')); // Serve o index.html e assets

const ATENAS_API_KEY = process.env.ATENAS_PAY_API_KEY || 'atenaspay_live_6d19d42aead11728e90b8d993973fcbe62770ac44e5258a35b66a1638412001b';

app.post('/api/gerar-pix', async (req, res) => {
  try {
    const { valor } = req.body;

    if (!valor || isNaN(valor) || valor <= 0) {
      return res.status(400).json({ error: 'Informe um valor válido.' });
    }

    const valorEmCentavos = Math.round(parseFloat(valor) * 100);

    const response = await fetch('https://api.atenaspay.com/v1/pix/cashin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': ATENAS_API_KEY
            },
      body: JSON.stringify({
        amount: valorEmCentavos,
        value: valorEmCentavos,
        description: "Doacao Capela Divina Esperanca"
      })
    });

    const data = await response.json();
    console.log("=== RESPOSTA DA ATENAS PAY ===");
    console.log(data);

    const pixCopiaECola = data.qr_code || data.pix_copy_paste || data.emv || (data.data && data.data.qr_code);
    const qrCodeBase64 = data.qr_code_base64 || data.qrcode_base64 || (data.data && data.data.qr_code_base64);

    if (!response.ok || !pixCopiaECola) {
      return res.status(400).json({ error: 'Erro ao gerar Pix na Atenas Pay.', resposta: data });
    }

    return res.json({
      success: true,
      pix_copy_paste: pixCopiaECola,
      qrcode_base64: qrCodeBase64
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ error: 'Falha interna no servidor.' });
  }
});

app.post('/api/webhook/atenas', (req, res) => {
  const evento = req.body;
  if (evento.type === 'payment.confirmed' || evento.event === 'payment.confirmed') {
    console.log('✅ Doação confirmada via Webhook:', evento.data);
  }
  res.status(200).send({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
