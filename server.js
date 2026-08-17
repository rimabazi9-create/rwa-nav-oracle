const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const API_SECRET_TOKEN = process.env.CHAINLINK_ADAPTER_SECRET || "default_secret_key";

// 1. مسار فحص صحة السيرفر لـ Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: Math.floor(Date.now() / 1000) });
});

// 2. مسار API الـ NAV المعتمد لـ Chainlink
app.post('/api/v1/chainlink-nav', (req, res) => {
    try {
        // فحص رمز الأمان Bearer Token
        const authHeader = req.headers['authorization'];
        if (!authHeader || authHeader !== `Bearer ${API_SECRET_TOKEN}`) {
            return res.status(401).json({
                jobRunID: req.body.id || "1",
                status: "errored",
                error: "Unauthorized access",
                statusCode: 401
            });
        }

        const jobRunID = req.body.id || "1";
        const assetId = req.body.data ? req.body.data.assetId : "BSAT-RWA";

        // القيمة التقييمية الحالية (1.00 USD) محولة لـ 18 Decimals (BigInt string)
        const rawNavPrice = 1.00; 
        const decimals = 18;
        const navInWei = (BigInt(Math.round(rawNavPrice * 100)) * BigInt(10 ** (decimals - 2))).toString();

        return res.status(200).json({
            jobRunID: jobRunID,
            data: {
                assetId: assetId,
                result: navInWei,
                navReadable: rawNavPrice,
                updatedAt: Math.floor(Date.now() / 1000)
            },
            result: navInWei,
            statusCode: 200
        });

    } catch (error) {
        return res.status(500).json({
            jobRunID: req.body.id || "1",
            status: "errored",
            error: error.message,
            statusCode: 500
        });
    }
});

app.listen(PORT, () => {
    console.log(`RWA NAV Oracle Server running on port ${PORT}`);
});

