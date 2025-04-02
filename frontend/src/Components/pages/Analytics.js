import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";
import Select from "react-select";
import { getCryptoPrices, getCryptoHistory } from "../../Services/cryptoService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./Analytics.css";


const Analytics = () => {
    const [cryptos, setCryptos] = useState([]); //stores list of all cryptos
    const [selectedCrypto, setSelectedCrypto] = useState(null); //tracks selected cryptos from dropdown

    const [currentPrice, setCurrentPrice] = useState(null); //stores the current price of the selected crypto
    const [targetPrice, setTargetPrice] = useState(""); //stores the users entered target price
    const [chartData, setChartData] = useState([]); //stores historical data chart data for selected crypto
    const [successMessage, setSuccessMessage] = useState(""); //user confirmation message

    const [alerts, setAlerts] = useState([]); //stores the users active crypto price alerts for display

    //fetches all crypto on load
    useEffect(() => {
        const fetchPrices = async () => {
            const data = await getCryptoPrices(); //calls service to fetch all crpyto prices from api(cryptoService.js)
            setCryptos(data); //updates state with crypto data
        };
        fetchPrices();
    }, []);

    //fetches historical price data and fetches current crypto price
    useEffect(() => {
        const fetchChart = async () => {
            //if nothing is selected by user then do nothing
            if (!selectedCrypto) return;

            //gets current crypto price
            const selected = cryptos.find(c => c.id === selectedCrypto.value);
            if (selected) {
                setCurrentPrice(selected.current_price);
            }

            //gets crypto historical data from cryptoServices.js function coingecko api
            const history = await getCryptoHistory(selectedCrypto.value, 365); //fetches 1 years worth of data 365 days
            const formatted = history.map(([timestamp, price]) => ({
                time: new Date(timestamp).toLocaleDateString(),
                price
            }));
            setChartData(formatted);
        };
        fetchChart();
    }, [selectedCrypto, cryptos]);

    //runs whenever the cryptos list is updated adding/removing cryto price alerts or after fetching from api
    useEffect(() => {
        //function for fetching the users active alerts from the backend
        const fetchAlerts = async () => {
            const user = auth.currentUser;

            //exits if no user is logged in
            if (!user) return;
    
            //sends a post request to fetch alerts associated with the users email
            try {
                const res = await fetch("http://localhost:5000/api/get-alerts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: user.email }),
                });
    
                //parses the response json
                const data = await res.json();

            console.log("backend response:", data); 

            //formats each alert with full crypto information such as name, id , target price, current price....
            const formattedAlerts = data.map(alert => {
                const crypto = cryptos.find(c => c.id === alert.cryptoId);
                const name = crypto ? crypto.name : alert.cryptoId;

                console.log("alert mapping:", { alert, crypto, name });

                return {
                    id: alert.id,
                    name: crypto ? crypto.name : alert.cryptoId,
                    image: crypto ? crypto.image : "",
                    currentPrice: alert.currentPrice,
                    targetPrice: alert.targetPrice
                };
            });

            //updates local state with formatted alerts
            setAlerts(formattedAlerts); 

            } catch (error) {
                console.error("Error fetching alerts:", error);
            }
        };
    
        //onlys runs fetchalerts once cryptos have been loaded
        if (cryptos.length > 0) {
            fetchAlerts();
        }
    }, [cryptos]);


    //function for handling user notifcation
    const handleNotify = async () => {
        if (!selectedCrypto || !targetPrice) return;

        //gets logged in user info(email to which to send the notifcation to)
        const user = auth.currentUser;

        //testing(error message if user not logged in)
        if (!user) {
        alert("Please log in");
        return;
        }

        if (parseFloat(targetPrice) <= 0) {
        alert("Enter a target price greater than 0");
        return;
        }

        //ensures currrent prices exist
        if (!currentPrice) {
        alert("Current price unavailable. Please try again");
        return;
        }

     try {
            //sends alert data to backend
            const response = await fetch("http://localhost:5000/api/set-alert", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                    body: JSON.stringify({
                    cryptoId: selectedCrypto.value,
                    targetPrice: parseFloat(targetPrice),
                    currentPrice: parseFloat(currentPrice),
                    email: user.email,
                }),
            });

            //finds the full crypto object from the cryptos list
            const matchedCrypto = cryptos.find(c => c.id === selectedCrypto.value);

            setAlerts(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    name: selectedCrypto.label.props.children[1],
                    image: matchedCrypto.image,
                    currentPrice: parseFloat(currentPrice),
                    targetPrice: parseFloat(targetPrice),
                },
            ]);

            //success message for user when alert has been set(get notified button click)
            setSuccessMessage(`Alert set for ${selectedCrypto.value} at $${parseFloat(targetPrice).toFixed(2)}. You will receive an email once the target is hit.`);
            setTargetPrice(""); //clears the target user input after submission
        } catch (error) {
            console.error("Failed to set an alert", error);
        }
    };

    //maps crypto data for dropdown menu(format)
    const cryptoOptions = cryptos.map(crypto => ({
        value: crypto.id,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={crypto.image} alt={crypto.symbol} style={{ width: 20, height: 20 }} />
                {crypto.name} ({crypto.symbol.toUpperCase()})
            </div>
        )
    }));

    //handles removing a crypto alert from the active alerts table when user has clicked the remove button
    const handleRemoveAlert = async (id) => {
        try {
            //sends a delete request to the backend to remove the alert from the database
            await fetch("http://localhost:5000/api/delete-alert", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id }) //passes the alerts id to the backend
            });
    
            //updates the local alerts state to remove the deleted alert from the table 
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        } catch (err) {
            console.error("Failed to delete alert", err);
        }
    };

    return (
        <div className="analytics-container">
            <h1 className="analytics-title">Analytics</h1>
            <p>Set up alerts to be notified when your chosen cryptocurrency hits a specific price target by selecting cryptocurrency of your choosing from dropdown menu and then inputting your price target in the enter target price box, historical data for the crypto selected will also be displayed.</p>

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
                {successMessage && (
                 <p className="success-message">{successMessage}</p>
                )}
            </div>

            {/*displays active alerts table after user has entered a price target alert*/}
                <div className="alerts-table">
                    <h3>Active Alerts</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Cryptocurrency</th>
                                <th>Current Price</th>
                                <th>Target Price</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert) => (
                                <tr key={alert.id}>
                                    <td>
                                    <img src={alert.image} alt={alert.name} width="20" style={{ marginRight: "10px", verticalAlign: "middle" }}/>
                                    {alert.name}
                                    </td>
                                    <td>${alert.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td>${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td>
                                    <button onClick={() => handleRemoveAlert(alert.id)} className="remove-alert-btn">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
        </div>
    );
};

export default Analytics;