import { Router, type IRouter } from "express";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/auth";
import {
  ListCitiesResponse,
  CreateCityBody,
  CreateCityResponse,
  GetCityParams,
  GetCityResponse,
  DeleteCityParams,
  GetCityStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /cities
router.get("/cities", async (req, res): Promise<void> => {
  const { data, error } = await getSupabase()
    .from("cities")
    .select("*")
    .order("last_updated", { ascending: false });

  if (error) {
    req.log.error({ error }, "Failed to fetch cities");
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(ListCitiesResponse.parse(data ?? []));
});

// GET /cities/stats  — must be before /:id
router.get("/cities/stats", async (req, res): Promise<void> => {
  const sb = getSupabase();
  const [citiesRes, commentsRes, newsRes] = await Promise.all([
    sb.from("cities").select("id", { count: "exact", head: true }),
    sb.from("comments").select("id", { count: "exact", head: true }),
    sb.from("news").select("id", { count: "exact", head: true }),
  ]);

  res.json(
    GetCityStatsResponse.parse({
      total_cities: citiesRes.count ?? 0,
      total_comments: commentsRes.count ?? 0,
      total_news: newsRes.count ?? 0,
    }),
  );
});

// POST /cities (admin)
router.post("/cities", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, error } = await getSupabase()
    .from("cities")
    .insert({
      ...parsed.data,
      last_updated: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    req.log.error({ error }, "Failed to create city");
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(CreateCityResponse.parse(data));
});

// GET /cities/:id
router.get("/cities/:id", async (req, res): Promise<void> => {
  const params = GetCityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data, error } = await getSupabase()
    .from("cities")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  res.json(GetCityResponse.parse(data));
});

// DELETE /cities/:id (admin)
router.delete(
  "/cities/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteCityParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const { error } = await getSupabase()
      .from("cities")
      .delete()
      .eq("id", params.data.id);

    if (error) {
      req.log.error({ error }, "Failed to delete city");
      res.status(500).json({ error: error.message });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
