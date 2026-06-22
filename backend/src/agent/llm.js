import OpenAI from "openai"
import config from "../config.js"

const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: "https://openrouter.ai/api/v1"
})

export default client;