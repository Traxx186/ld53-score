import "https://deno.land/std@0.185.0/dotenv/load.ts";
import * as uuid from "https://deno.land/std@0.184.0/uuid/mod.ts";
import { Status, STATUS_TEXT } from "https://deno.land/std@0.185.0/http/http_status.ts"
import { Application, Context, Router } from "https://deno.land/x/oak@v12.3.0/mod.ts";

import Score from "./Score.ts";
import sql from "./db.ts";
import { jsonResponse, notFound } from "./utils.ts";

// Create score table
await sql`
    CREATE TABLE IF NOT EXISTS public.score
    (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        username character varying(50) NOT NULL,
        score integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp,
        PRIMARY KEY (id)
    )
`;

const router = new Router();
router.get("/", async (ctx: Context) => {
    const scores: Score[] = await sql`SELECT * FROM score`;

    jsonResponse(ctx, scores);
});

router.post("/", async (ctx: Context) => {
    if (!ctx.request.hasBody)
        ctx.throw(Status.BadRequest, STATUS_TEXT[Status.BadRequest]);

    const body = ctx.request.body();
    if (body.type !== "json")
        ctx.throw(Status.UnsupportedMediaType, STATUS_TEXT[Status.UnsupportedMediaType]);

    const score: Partial<Score> = await body.value;
    if (!score || !score.score || !score.username)
        ctx.throw(Status.BadRequest, STATUS_TEXT[Status.BadRequest]);
    
    const newScore = await sql`
        INSERT INTO score (username, score)
        VALUES (${ score.username }, ${ score.score })
        RETURNING *
    `;

    ctx.response.status = Status.Created;
    jsonResponse(ctx, newScore);
});

router.get("/:id", async (ctx: Context) => {
    if (!ctx.params.id)
        ctx.throw(Status.BadRequest, STATUS_TEXT[Status.BadRequest]);

    const { id } = ctx.params;
    if (!uuid.validate(id))
        ctx.throw(Status.BadRequest, "Id is not a valid UUID");

    const score = await sql`
        SELECT * FROM score
        WHERE id = ${ctx.params.id}
    `;

    if (!score[0]) {
        notFound(ctx, `Score with id '${id}' not found`);
        return;
    }
    
    jsonResponse(ctx, score[0]);
});

router.patch("/:id", async (ctx: Context) => {
    if (!ctx.params.id)
        ctx.throw(Status.BadRequest, STATUS_TEXT[Status.BadRequest]);

    const body = ctx.request.body();
    if (body.type !== "json")
        ctx.throw(Status.UnsupportedMediaType, STATUS_TEXT[Status.UnsupportedMediaType]);
    
    const { score } = await body.value;
    const { id } = ctx.params;
    if (!uuid.validate(id))
        ctx.throw(Status.BadRequest, "Id is not a valid UUID");
    
    const count = await sql`
        SELECT count(id) FROM score
        WHERE id = ${ctx.params.id}
    `;

    if (count[0].count == 0) {
        notFound(ctx, `Score with id '${id}' not found`);
        return;
    }

    if (!score)
        ctx.throw(Status.BadRequest, "A score is required");

    const updatedScore = await sql`
        UPDATE score
        SET score = ${score},
            updated_at = ${sql`now()`}
        WHERE id = ${id}
        RETURNING *
    `;

    jsonResponse(ctx, updatedScore[0]);
});

router.delete("/:id", async (ctx: Context) => {
    const { id } = ctx.params;
    if (!uuid.validate(id)) 
        ctx.throw(Status.BadRequest, "Id is not a valid UUID");

    const deletedScore = await sql`
        DELETE FROM score
        WHERE id = ${id}
        RETURNING *
    `;

    if (deletedScore.count <= 0) {
        notFound(ctx, `Score with id '${id}' not found`);
        return;
    }
    
    ctx.response.status = Status.NoContent
    ctx.response.body = null;
})

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });