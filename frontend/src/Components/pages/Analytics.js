import React, { useEffect, useState } from "react";
import Select from "react-select";
import { getCryptoPrices, getCryptoHistory } from "../../Services/cryptoService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./Analytics.css";

const Analytics = () => {
    const [cryptos, setCryptos] = useState([]);
    const [selectedCrypto, setSelectedCrypto] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [targetPrice, setTargetPrice] = useState("");
    const [chartData, setChartData] = useState([]);

    //fetches all crypto on load
    useEffect(() => {
        const fetchPrices = async () => {
            const data = await getCryptoPrices();
            setCryptos(data);
        };
        fetchPrices();
    }, []);

    //fetches historical price data and fetches current crypto price
    useEffect(() => {
        const fetchChart = async () => {
            if (!selectedCrypto) return;

            //gets cuyrrent crypto price
            const selected = cryptos.find(c => c.id === selectedCrypto.value);
            if (selected) {
                setCurrentPrice(selected.current_price);
            }

            //gets crypto historical data from cryptoServices.js function coingecko api
            const history = await getCryptoHistory(selectedCrypto.value, 365);
            const formatted = history.map(([timestamp, price]) => ({
                time: new Date(timestamp).toLocaleDateString(),
                price
            }));
            setChartData(formatted);
        };
        fetchChart();
    }, [selectedCrypto, cryptos]);

    //test function for handling notification of crypto price change will update next
    const handleNotify = () => {
        if (!selectedCrypto || !targetPrice) return;
        alert(`You will be notified when ${selectedCrypto.label} reaches $${targetPrice}`);
    };

    const cryptoOptions = cryptos.map(crypto => ({
        value: crypto.id,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={crypto.image} alt={crypto.symbol} style={{ width: 20, height: 20 }} />
                {crypto.name} ({crypto.symbol.toUpperCase()})
            </div>
        )
    }));

    return (
        <div className="analytics-container">
            <h1 className="analytics-title">Analytics</h1>
            <p>Set up alerts to be notified when your chosen cryptocurrency hits a specific price.</p>

            <div className="analytics-inputs">
                <Select className="crypto-dropdown" options={cryptoOptions} value={selectedCrypto} onChange={setSelectedCrypto} isSearchable/>

                {currentPrice !== null && (
                    <div className="current-price">
                        <span className="current-price-label">Current Price:</span>
                        <span className="price-value">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                )}


                {/*line chart for crypto historical price data*/}
                {chartData.length > 0 && (
                    <div className="analytics-chart-section">
                        <h3>Price History (1 Year)</h3>
                        <ResponsiveContainer height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                <Tooltip formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                <Line type="monotone" dataKey="price" stroke="#174EA6" strokeWidth={2} dot={false}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <input type="number" placeholder="Enter target price" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} className="price-input"/>

                <button className="notify-btn" onClick={handleNotify}>Get Notified</button>
            </div>
        </div>
    );
};

export default Analytics;