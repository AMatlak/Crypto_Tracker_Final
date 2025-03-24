//imports axios for making the http requests
import axios from "axios";

//coingecko api details
const API_KEY = "CG-S84bmxLEfg5HJ9bdc12hKnSS";
const BASE_URL = "https://api.coingecko.com/api/v3";

//function to fetch crypto prices from coingecko
export const getCryptoPrices = async () => {
    try {
        //make a get request to coingecko
        const response = await axios.get(`${BASE_URL}/coins/markets`, {
            params: {
                vs_currency: "usd", //price in usd
                order: "market_cap_desc", //sort by market cap
                per_page: 50, //limit to 50 coins
                page: 1, //first page of results
                sparkline: false, //exludes sparkline mini chart data
                price_change_percentage: "1h,24h,7d", //include 1h, 24h and 7 day price change 
                x_cg_demo_api_key: API_KEY, //coingecko api
            },
        });

        console.log("API Response:", response.data); //used for debugging
        return response.data; //return crypto data
    } catch (error) {
        console.error("Error fetching crypto data:", error.response ? error.response.data : error);
        return []; //returns empty array if the request fails
    }
};