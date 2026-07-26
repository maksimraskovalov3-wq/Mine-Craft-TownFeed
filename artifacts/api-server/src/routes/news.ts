import { Router, type IRouter } from "express";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/auth";
import {
  ListNewsResponse,
  CreateNewsBody,
  CreateNewsResponse,
  DeleteNewsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /news
router.get("/news", async (req, res): Promise<void> => {
  const { data, error } = await getSupabase()
    .from("news")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    req.log.error({ error }, "Failed to fetch news");
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(ListNewsResponse.parse(data ?? []));
});

// POST /news (admin)
router.post("/news", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateNewsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, error } = await getSupabase()
    .from("news")
    .insert({ content: parsed.data.content })
    .select()
    .single();

  if (error) {
    req.log.error({ error }, "Failed to create news");
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(CreateNewsResponse.parse(data));
});

// DELETE /news/:id (admin)
router.delete("/news/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteNewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { error } = await getSupabase()
    .from("news")
    .delete()
    .eq("id", params.data.id);

  if (error) {
    req.log.error({ error }, "Failed to delete news");
    res.status(500).json({ error: error.message });
    return;
  }

  res.sendStatus(204);
});

export default router;
