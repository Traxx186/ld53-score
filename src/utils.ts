import { Status } from "https://deno.land/std@0.185.0/http/http_status.ts"
import { Context } from "https://deno.land/x/oak@v12.3.0/mod.ts";

/**
 * Util function to return a JSON response
 */
export function jsonResponse(ctx: Context, data: any) {
    ctx.response.body = JSON.stringify({ data });
    ctx.response.type = "json";
}

/**
 * Util function to return a Not Found error
 */
export function notFound(ctx: Context, message: string) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = message;
}