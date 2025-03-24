import React, { useEffect, useState } from "react";
import { getCryptoPrices } from "../../Services/cryptoService"; //importing function getCryptoPrices from cryptoServices
import "./Home.css"; //importing styling sheet for home.js

const Home = () => {
    //state storing the list of cryptocurrencies
    const [cryptos, setCryptos] = useState([]); 

    //state storing the search query entered by user
    const [searchQuery, setSearchQuery] = useState(""); 

    //pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [coinsPerPage, setCoinsPerPage] = useState(getCoinsPerPage(window.innerWidth));

    //function to show amount of coins based on screen size
    function getCoinsPerPage(width) {
        if (width >= 1500) return 30;
        if (width >= 1300) return 15;
        if (width >= 768) return 15;
        return 15;
    }

    //updates coins per page when window is resized
    useEffect(() => {
        const handleResize = () => {
            setCoinsPerPage(getCoinsPerPage(window.innerWidth));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    //fetches crypto prices from API
    useEffect(() => {
        const fetchPrices = async () => {
            const data = await getCryptoPrices(); 
            setCryptos(data); //updates the cells with latest prices
        };

        fetchPrices(); //initial call when component mounts

        //refresh prices every 60 seconds (leave high while developing)
        const interval = setInterval(fetchPrices, 1000000000);
        return () => clearInterval(interval); //clean up function to clear interval
    }, []);

    //filters cryptos based on search query
    const filteredCryptos = cryptos.filter((crypto) =>
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    //pagination logic
    const indexOfLastCoin = currentPage * coinsPerPage;
    const indexOfFirstCoin = indexOfLastCoin - coinsPerPage;
    const currentCoins = filteredCryptos.slice(indexOfFirstCoin, indexOfLastCoin);

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
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); //rest to page 1 after search
                }}
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
                    {/*mapping through paginated and filtered list of cryptos*/}
                    {currentCoins.map((crypto) => (
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

            {/*pagination buttons*/}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <button
                    onClick={() =>
                        setCurrentPage((prev) =>
                            indexOfLastCoin < filteredCryptos.length ? prev + 1 : prev
                        )
                    }
                    disabled={indexOfLastCoin >= filteredCryptos.length}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Home;