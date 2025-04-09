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
                per_page: 200, //changed limit to 200 from 50 for further testing
                page: 1, //first page of results
                sparkline: false, //exludes sparkline mini chart data
                price_change_percentage: "1h,24h,7d", //include 1h, 24h and 7 day price change 
                x_cg_demo_api_key: API_KEY, //coingecko api
            },
        });

        console.log("API response", response.data); //used for debugging
        return response.data; //return crypto data
    } catch (error) {
        console.error("Error fetching crypto data", error.response ? error.response.data : error);
        return []; //returns empty array if the request fails
    }
};

//function for fetching historical market chart data
export const getCryptoHistory = async (coinId, days = 365) => {
    try {
        const response = await axios.get(`${BASE_URL}/coins/${coinId}/market_chart`, {
            params: {
                vs_currency: "usd",
                days: days, 
                interval: "daily",
                x_cg_demo_api_key: API_KEY,
            },
        });

        return response.data.prices; //returns array of time stamp and price
    } catch (error) {
        console.error(`Error getting historical data ${coinId}:`, error.response ? error.response.data : error);
        return [];
    }
};