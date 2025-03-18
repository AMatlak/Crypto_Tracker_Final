import axios from "axios";

//coingecko api details
const API_KEY = "CG-S84bmxLEfg5HJ9bdc12hKnSS";
const BASE_URL = "https://api.coingecko.com/api/v3";

//function to fetch crypto prices
export const getCryptoPrices = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/coins/markets`, {
            params: {
                vs_currency: "usd", 
                order: "market_cap_desc", 
                per_page: 50,  
                page: 1,  
                sparkline: false,  
                price_change_percentage: "1h,24h,7d", 
                x_cg_demo_api_key: API_KEY, 
            },
        });

        console.log("API Response:", response.data); //used for debugging
        return response.data; //return crpyo data
    } catch (error) {
        console.error("Error fetching crypto data:", error.response ? error.response.data : error);
        return [];
    }
};