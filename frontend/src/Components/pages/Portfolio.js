import React, { useEffect, useState, useRef } from "react";
import { getCryptoPrices } from "../../Services/cryptoService"; //importing function getCryptoPrices from cryptoServices for crypto prices
import { auth } from "../../firebase"; //importing firebase auth
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore"; //importing firestore functions
import { db } from "../../firebase"; //importing firestore database
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid} from "recharts"; //importing charting components for both piechart and line chart from recharts
import Select from "react-select";
import "./Portfolio.css"; //importing portfolio page stylings
import { Eye, EyeOff } from 'lucide-react';  //importing eye icons for hidding portfolio value from lucide-react

//portfolio component
const Portfolio = () => {
    const [cryptos, setCryptos] = useState([]); //all available cryptocurriencies
    const [selectedCrypto, setSelectedCrypto] = useState(null); //currently selected cryptocurrency from dropdown
    const [amount, setAmount] = useState(""); //amount of crypto entered by user

    const [portfolio, setPortfolio] = useState({}); //users crypto holdings
    const [totalValue, setTotalValue] = useState(0); //total value of users portfolio

    const [chartData, setChartData] = useState([]); //data for piechart 
    const [historicalData, setHistoricalData] = useState([]); //historical portfolio over time
    const [timeRange, setTimeRange] = useState("1M"); //selected time range for line chart

    const lastSavedRef = useRef(null); //reference to track when the users holdings where last saved to firestore
    const user = auth.currentUser; //currently authenticated user

    const [isHidden, setIsHidden] = useState(false); //state to toggle visibility of users portfolio on and off

    const [percentageChange, setPercentageChange] = useState(null); //percentage change over selected time period

    const [filteredData, setFilteredData] = useState([]); //filtered portfolio history used for chart and percentage change
    

    //fetches crypto prices and refreshes them every 60 seconds
    useEffect(() => {
        const fetchPrices = async () => {
            const data = await getCryptoPrices();
            setCryptos(data);
        };
        fetchPrices();
        const interval = setInterval(fetchPrices, 180000); //refreshes every 60 seconds
        return () => clearInterval(interval);
    }, []);

    //loads the users portfolio from firestore when component mounts
    useEffect(() => {
        if (user) {
            const loadPortfolio = async () => {
                const docRef = doc(db, "portfolios", user.email); //firestore doc for users portfolio
                const docSnap = await getDoc(docRef); //fetches the document
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPortfolio(data.holdings || {}); //sets holdings
                    setHistoricalData(data.history || []); //sets chart history
                }
            };
            loadPortfolio();
        }
    }, [user]);

    //calculates total portfolio value and updates the piechart and history
    useEffect(() => {
        let total = 0;
        const chart = [];

        //loops through all holdings and calculates current value
        for (let id in portfolio) {
            const crypto = cryptos.find(c => c.id === id);
            if (crypto) {
                const value = crypto.current_price * portfolio[id];
                total += value;
                chart.push({ name: crypto.symbol.toUpperCase(), value });
            }
        }

        //updates total portfolio value
        setTotalValue(total);

        //converts chart data to percentage format for piechart
        const chartWithPercentages = chart.map(item => ({
            name: item.name,
            value: parseFloat(((item.value / total) * 100).toFixed(2))
        }));
        setChartData(chartWithPercentages);

        const now = new Date();
        const timestamp = now.toISOString();

        //saves updated total to history every 5 seconds
        if (user && total > 0) {
            const lastSaved = lastSavedRef.current ? new Date(lastSavedRef.current) : null;
            const shouldSave = !lastSaved || (now - lastSaved) >= 5000;

            if (shouldSave) {
                lastSavedRef.current = now;
                const docRef = doc(db, "portfolios", user.email);
                updateDoc(docRef, {
                    history: arrayUnion({ timestamp, total })
                });
                setHistoricalData(prev => [...prev, { timestamp, total }]);
            }
        }
    }, [portfolio, cryptos]);

    //refreshes histroical data from firestore every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!user) return;
            const docRef = doc(db, "portfolios", user.email);
            getDoc(docRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setHistoricalData(data.history || []);
                }
            });
        }, 180000); //every 60 seconds
        return () => clearInterval(interval);
    }, [user]);

    //calculates percentage change when user has selected different time range
    useEffect(() => {
        const now = new Date();
    
        //gets the dates from which to filter historical data entries based on the users selected time range
        const getPastDate = (range) => {
            const date = new Date(now);
            if (range === "1D") date.setDate(now.getDate() - 1);
            if (range === "1W") date.setDate(now.getDate() - 7);
            if (range === "1M") date.setMonth(now.getMonth() - 1);
            if (range === "1Y") date.setFullYear(now.getFullYear() - 1);
            return date;
        };
    
        const past = getPastDate(timeRange);
    
        //filters historical data within the users selected time range and also fromats it for the charts display
        const filtered = historicalData
            .filter(entry => new Date(entry.timestamp) >= past)
            .map(entry => ({
                time: new Date(entry.timestamp).toLocaleDateString() + "\n" +
                      new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                value: entry.total
            }));
    
        //updates percentage changes and data for the line chart
        const change = calculatePercentageChange(filtered);
        setPercentageChange(change);
        setFilteredData(filtered); 
    }, [timeRange, historicalData]);

    //function for adding crypto to users portfolio
    const handleAdd = async () => {
        if (!selectedCrypto || !amount || isNaN(amount)) return;

        //adds amount to existing or new entry of crypto
        const updated = {
            ...portfolio,
            [selectedCrypto.value]: (portfolio[selectedCrypto.value] || 0) + parseFloat(amount)
        };

        //updates local states
        setPortfolio(updated);

        await setDoc(doc(db, "portfolios", user.email), {
            holdings: updated
        }, { merge: true });
        setAmount("");
    };
    
    //function for removing crypto from users portfolio
    const handleRemove = async () => {
        if (!selectedCrypto || !amount || isNaN(amount)) return;
        if (!(selectedCrypto.value in portfolio)) return;
    
        const currentAmount = portfolio[selectedCrypto.value];
        const removeAmount = parseFloat(amount);
    
        let updated;
    
        //removes entry or subtracts the amount of crypto
        if (removeAmount >= currentAmount) {
            updated = { ...portfolio };
            delete updated[selectedCrypto.value];
        } else {
            updated = {
                ...portfolio,
                [selectedCrypto.value]: currentAmount - removeAmount
            };
        }
    
        //updates local state
        setPortfolio(updated);
    
        const docRef = doc(db, "portfolios", user.email);
    
        //updates holdings using update
        await updateDoc(docRef, {
            holdings: updated
        });
    
        //manually recalculates total portfolio value
        let newTotal = 0;
        for (let id in updated) {
            const crypto = cryptos.find(c => c.id === id);
            if (crypto) {
                newTotal += crypto.current_price * updated[id];
            }
        }
    
        const now = new Date();
        const timestamp = now.toISOString();
    
        await updateDoc(docRef, {
            history: arrayUnion({ timestamp, total: newTotal })
        });
    
        setHistoricalData(prev => [...prev, { timestamp, total: newTotal }]);
        setAmount("");
    };

    //preset colors for piechart segments
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EF0", "#FF6666"];

    //function for calucalting percentage change
    const calculatePercentageChange = (data) => { 
        if (data.length < 2) return null; //checks if theirs enough data to calculate percentage change
        const first = data[0].value;
        const last = data[data.length - 1].value;
        const change = ((last - first) / first) * 100; //formula for calculating selected time rang
        return change.toFixed(2); //returns the change and is also rounded to 2 decimal places
    };

    //function for formatting crypto options for dropdown with image and name of cryptocurrency
    const cryptoOptions = cryptos.map(crypto => ({
        value: crypto.id,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={crypto.image} alt={crypto.symbol} style={{ width: 20, height: 20 }} />
                {crypto.name} ({crypto.symbol.toUpperCase()})
            </div>
        )
    }));

    //portfolio page ui
    return (
        <div className="portfolio-container">
            <h1>Portfolio</h1>
            <p> To add a cryptocurrency to your portfolio, select a coin from the dropdown below, enter the amount you own, and click <b>"Add Transaction"</b>.  
            To remove it, select the coin again, enter the amount you'd like to remove, and click <b>"Remove Transaction"</b>.</p>
            {/*input section for adding and removing cryptocurrencies from users profile */}
            <div className="portfolio-inputs">
                <Select className="crypto-dropdown" options={cryptoOptions} value={selectedCrypto} onChange={setSelectedCrypto} isSearchable/>
                
                {/*crypto amount input*/}
                <input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)}/>

                <div className="portfolio-buttons">
                    <button onClick={handleAdd}>Add Transaction</button>
                    <button onClick={handleRemove}>Remove Transaction</button>
                </div>
            </div>

            {/*displays total portfolio value and piechart*/}
            <div className="portfolio-summary">
                <div className="portfolio-left">
                <h2 className="portfolio-total">
                    {/*span used to wrap the elements for styling*/}
                    <span className="portfolio-total-label">Portfolio Value:</span>
                    {/*tolocalstring was used for portfolio value to format with commas and the minimum and maximum is used to keep to 2 decimal places*/}
                    {/*is hidden is used here to toggle visibility of users portfolio on and off */}
                    <span className="portfolio-total-amount"> {isHidden ? '*******' : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                    <span onClick={() => setIsHidden(!isHidden)} style={{ cursor: 'pointer', marginLeft: '10px' }}>{isHidden ? <EyeOff size={25} /> : <Eye size={25} />}</span>
                    {/*displays percentage change of users portfolio value when isHidden is false*/}
                    {!isHidden && percentageChange !== null && (
                        <div className={`percentage-change ${percentageChange >= 0 ? "percentage-positive" : "percentage-negative"}`}>
                            {percentageChange >= 0 ? "+" : ""}
                            {percentageChange}%
                        </div>
                    )}
                </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label={({ name, value }) => `${name}: ${value}%`}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/*displays a table of users portfolio crypto holdings */}
                <div className="portfolio-right">
                    <table>
                        <thead>
                            <tr>
                                <th>Cryptocurrency</th>
                                <th>Amount</th>
                                <th>Current Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(portfolio).map((id) => {
                                const crypto = cryptos.find(c => c.id === id);
                                if (!crypto) return null;
                                const currentValue = (crypto.current_price * portfolio[id]).toFixed(2);
                                return (
                                    <tr key={id}>
                                        <td>
                                        <img src={crypto.image} alt={crypto.name} width="20" style={{ marginRight: "10px", verticalAlign: "middle" }} />
                                        {crypto.name}
                                        </td>
                                        <td>{isHidden ? '*****' : portfolio[id]}</td>
                                        <td>{isHidden ? '*****' : `$${Number(currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*historical chart of portfolio value over time*/}
            <div className="portfolio-chart-section">
                <h3>Portfolio Value Over Time</h3>
                <div className="chart-buttons">
                    <button onClick={() => setTimeRange("1D")}>1 Day</button>
                    <button onClick={() => setTimeRange("1W")}>1 Week</button>
                    <button onClick={() => setTimeRange("1M")}>1 Month</button>
                    <button onClick={() => setTimeRange("1Y")}>1 Year</button>
                </div>
                <ResponsiveContainer height={300}>
                    <LineChart data={isHidden ? [] : (filteredData || [])}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tickFormatter={(value) => {
                                if (timeRange === "1D") {
                                return value.split("\n")[1]; //shows only time for 1 day to reduce dates clutter
                                } else {
                                return value.split("\n")[0]; //shows only dates for the other times eg 1 week...
                                }
                            }}
                            minTickGap={20} //adds spacing between the ticks to reduce label clutter that was happening before
                        />
                        <YAxis
                                tickFormatter={(value) =>
                                "$" + value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                            }
                            tick={{ fill: "#174EA6", fontSize: 14, fontWeight: 600 }}
                        />
                        <Tooltip formatter={(value) => "$" + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/>
                        <Line type="monotone" dataKey="value" stroke="#174EA6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Portfolio;
