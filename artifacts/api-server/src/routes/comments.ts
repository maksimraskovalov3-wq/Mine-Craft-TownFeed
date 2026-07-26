import { Router, type IRouter } from "express";
import { getSupabase } from "../lib/supabase";
import {
  ListCommentsParams,
  ListCommentsResponse,
  CreateCommentParams,
  CreateCommentBody,
  CreateCommentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /cities/:id/comments
router.get("/cities/:id/comments", async (req, res): Promise<void> => {
  const params = ListCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data, error } = await getSupabase()
    .from("comments")
    .select("*")
    .eq("city_id", params.data.id)
    .order("created_at", { ascending: false });

  if (error) {
    req.log.error({ error }, "Failed to fetch comments");
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(ListCommentsResponse.parse(data ?? []));
});

// POST /cities/:id/comments
router.post("/cities/:id/comments", async (req, res): Promise<void> => {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CreateCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { data, error } = await getSupabase()
    .from("comments")
    .insert({
      city_id: params.data.id,
      nickname: body.data.nickname,
      content: body.data.content,
      avatar_url: body.data.avatar_url ?? null,
    })
    .select()
    .single();

  if (error) {
    req.log.error({ error }, "Failed to create comment");
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(CreateCommentResponse.parse(data));
});

export default router;
