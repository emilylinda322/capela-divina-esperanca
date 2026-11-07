process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const ATENAS_API_KEY = process.env.ATENAS_PAY_API_KEY || 'atenaspay_live_6d19d42aead11728e90b8d993973fcbe62770ac44e5258a35b66a1638412001b';

app.post('/api/gerar-pix', async (req, res) => {
    try {
        const { valor } = req.body;

        if (!valor || isNaN(valor) || valor <= 0) {
            return res.status(400).json({ error: 'Informe um valor válido.' });
        }

        const response = await axios.post('https://api.atenaspay.com/v1/pix/cashin', {
            amount: parseFloat(valor),
            description: "Doacao Capela Divina Esperanca",
            customer: {
                name: "Doador Capela",
                email: "doacao@capela.org",
                cpf: "00000000000"
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': ATENAS_API_KEY
            }
        });

        console.log('=== RESPOSTA DA ATENAS PAY ===', response.data);
        res.json(response.data);
    } catch (error) {
        const erroDetalhe = error.response ? error.response.data : error.message;
        console.error('Erro na requisição Atenas Pay:', erroDetalhe);
        res.status(500).json({ error: 'Falha interna no servidor', detalhe: erroDetalhe });
    }
});

app.post('/api/webhook/atenas', (req, res) => {
    console.log('=== WEBHOOK RECEBIDO ===', req.body);
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
