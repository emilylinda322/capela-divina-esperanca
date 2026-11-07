const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const ATENAS_API_KEY = process.env.ATENAS_PAY_API_KEY || 'atenaspay_live_6d19d42aead11728e90b8d993973fcbe62770ac44e5258a35b66a1638412001b';

// Agente HTTPS que ignora a verificação estrita de certificado SSL
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

app.post('/api/gerar-pix', async (req, res) => {
    try {
        const { valor } = req.body;

        if (!valor || isNaN(valor) || valor <= 0) {
            return res.status(400).json({ error: 'Informe um valor válido.' });
        }

        const response = await fetch('https://api.atenaspay.com/v1/pix/cashin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': ATENAS_API_KEY
            },
            agent: httpsAgent,
            body: JSON.stringify({
                amount: parseFloat(valor),
                description: "Doacao Capela Divina Esperanca",
                customer: {
                    name: "Doador Capela",
                    email: "doacao@capela.org",
                    cpf: "00000000000"
                }
            })
        });

        const data = await response.json();
        console.log('=== RESPOSTA DA ATENAS PAY ===', data);

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: data.message || data.error || 'Erro na Atenas Pay',
                detalhes: data 
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ error: 'Falha interna no servidor', detalhe: error.message });
    }
});

app.post('/api/webhook/atenas', (req, res) => {
    console.log('=== WEBHOOK RECEBIDO ===', req.body);
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
