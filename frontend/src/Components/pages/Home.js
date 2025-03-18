import React, { useEffect, useState } from "react";
import { getCryptoPrices } from "../../Services/cryptoService"; //importing function getCryptoPrices from cryptoServices
import "./Home.css"; //importing styling sheet for home.js

const Home = () => {
    //state storign the list of cryptocurrencys
    const [cryptos, setCryptos] = useState([]); 

    //state storing the search query entered by user
    const [searchQuery, setSearchQuery] = useState(""); 

    //fetches crypto prices from API
    useEffect(() => {
        const fetchPrices = async () => {
            const data = await getCryptoPrices(); 
            setCryptos(data); //updates the cells with latest prices
        };
    
        fetchPrices(); //intial call when componenet mounts
    
        //refreshes prices every 60 seconds (60000 interval remeber to change it back to this leaving it at other number to not call api all the time whilst im coding application)
        const interval = setInterval(fetchPrices, 1000000000);
    
        return () => clearInterval(interval); //clean up function to clear interval
    }, []);

    //filters cryptos based on search in box
    const filteredCryptos = cryptos.filter((crypto) =>
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="home-container">
            {/*crypto live prices title*/}
            <h2>Live Crypto Prices</h2>

            {/*search box*/}
            <input
                type="text"
                className="search-box"
                placeholder="Search Cryptocurrency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/*crypto price table*/}
            <table className="crypto-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Price (USD)</th>
                        <th>1h %</th>
                        <th>24h %</th>
                        <th>7d %</th>
                        <th>Market Cap</th>
                    </tr>
                </thead>
                <tbody>
                    {/*mappping through filtered list of cryptos*/}
                    {filteredCryptos.map((crypto) => (
                        <tr key={crypto.id}>
                            {/*displays crypto in order of rank based on market cap*/}
                            <td>{crypto.market_cap_rank}</td>
                            {/*displays crypto logo, name and symbol*/}
                            <td>
                                <img src={crypto.image} alt={crypto.name} width="20" style={{ marginRight: "10px" }} />
                                {crypto.name} ({crypto.symbol.toUpperCase()})
                            </td>
                            {/*displays current price*/}
                            <td>${crypto.current_price.toLocaleString()}</td>
                            {/*displays price change from past 1 hour in %*/}
                            <td style={{ color: crypto.price_change_percentage_1h_in_currency >= 0 ? "green" : "red" }}>
                                {crypto.price_change_percentage_1h_in_currency?.toFixed(2)}%
                            </td>
                            {/*displays price change from past 24 hours in %*/}
                            <td style={{ color: crypto.price_change_percentage_24h_in_currency >= 0 ? "green" : "red" }}>
                                {crypto.price_change_percentage_24h_in_currency?.toFixed(2)}%
                            </td>
                            {/*displays price change from past 7 days in %*/}
                            <td style={{ color: crypto.price_change_percentage_7d_in_currency >= 0 ? "green" : "red" }}>
                                {crypto.price_change_percentage_7d_in_currency?.toFixed(2)}%
                            </td>
                            {/*displays market cap in billions*/}
                            <td>${(crypto.market_cap / 1e9).toFixed(2)}B</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Home;
