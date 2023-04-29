import postgres from "https://deno.land/x/postgresjs/mod.js";

const sql = postgres({
    host: Deno.env.get("DB_HOST"),
    database: Deno.env.get("DB_NAME"),
    username: Deno.env.get("DB_USERNAME"),
    password: Deno.env.get("DB_PASSWORD"),
});

export default sql;